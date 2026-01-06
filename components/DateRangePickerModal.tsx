import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, registerTranslation, en } from "react-native-paper-dates";
import { Button, Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

registerTranslation('en', en);

const BOTTOM_SHEET_HEIGHT_RATIO = 0.55;
const CALENDAR_HEADER_OFFSET = 100;

export type DateRangeOption = "today" | "yesterday" | "last30" | "last90" | "custom";

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectRange: (option: DateRangeOption, range: DateRange) => void;
  selectedOption: DateRangeOption;
  customRange?: DateRange;
}

const QUICK_OPTIONS: { label: string; value: DateRangeOption }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 30 days", value: "last30" },
  { label: "Last 90 days", value: "last90" },
  { label: "Custom", value: "custom" },
];

function getDateRange(option: DateRangeOption, customRange?: DateRange): DateRange {
  const now = new Date();
  
  switch (option) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "yesterday": {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "last30": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "last90": {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "custom":
      return customRange || { start: now, end: now };
    default:
      return { start: now, end: now };
  }
}

export function DateRangePickerModal({ 
  visible, 
  onClose, 
  onSelectRange, 
  selectedOption,
  customRange 
}: DateRangePickerModalProps) {
  const { theme, isDark } = useTheme();
  const { formatDate: formatDateHook } = useFormattedDate();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [localOption, setLocalOption] = useState<DateRangeOption>(selectedOption);
  const [fromDate, setFromDate] = useState<Date>(customRange?.start || new Date());
  const [toDate, setToDate] = useState<Date>(customRange?.end || new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);
  const [editingField, setEditingField] = useState<"from" | "to">("from");

  const MODAL_HEIGHT = windowHeight * BOTTOM_SHEET_HEIGHT_RATIO;
  const translateY = useSharedValue(MODAL_HEIGHT);
  const startY = useSharedValue(0);

  const calendarModalWidth = Math.min(windowWidth * 0.9, 400);
  const calendarCellSize = calendarModalWidth / 7;
  const calendarFixedHeight = (calendarCellSize * 6) + CALENDAR_HEADER_OFFSET;

  const accentColor = isDark ? Colors.dark.accent : Colors.light.accent;
  
  const paperTheme = useMemo(() => {
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
    const themeColors = isDark ? Colors.dark : Colors.light;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: accentColor,
        primaryContainer: isDark ? themeColors.backgroundSecondary : `${accentColor}20`,
        onPrimaryContainer: isDark ? themeColors.text : accentColor,
        secondary: accentColor,
        secondaryContainer: isDark ? themeColors.backgroundSecondary : `${accentColor}15`,
        onSecondaryContainer: themeColors.text,
        surface: themeColors.backgroundRoot,
        surfaceVariant: isDark ? themeColors.backgroundSecondary : themeColors.backgroundTertiary,
        onSurface: themeColors.text,
        onSurfaceVariant: themeColors.textMuted,
        outline: themeColors.divider,
        background: themeColors.backgroundRoot,
        onBackground: themeColors.text,
        elevation: {
          level0: "transparent",
          level1: themeColors.backgroundDefault,
          level2: themeColors.backgroundSecondary,
          level3: themeColors.backgroundTertiary,
          level4: themeColors.backgroundTertiary,
          level5: themeColors.backgroundTertiary,
        },
      },
    };
  }, [isDark, accentColor]);

  useEffect(() => {
    if (visible) {
      setLocalOption(selectedOption);
      if (customRange) {
        setFromDate(customRange.start);
        setToDate(customRange.end);
      } else {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 7);
        setFromDate(thirtyDaysAgo);
        setToDate(now);
      }
      translateY.value = MODAL_HEIGHT;
       translateY.value = withSpring(0);
     
    } else {
      translateY.value = MODAL_HEIGHT;
    }
  }, [visible, translateY, selectedOption, customRange]);

  const closeModal = () => {
    translateY.value = withTiming(MODAL_HEIGHT, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextY = Math.max(0, startY.value + event.translationY);
      translateY.value = nextY;
    })
    .onEnd((event) => {
      const shouldClose = translateY.value > MODAL_HEIGHT * 0.35 || event.velocityY > 800;
      if (shouldClose) {
        translateY.value = withTiming(MODAL_HEIGHT, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleQuickSelect = (option: DateRangeOption) => {
    setLocalOption(option);
    if (option !== "custom") {
      const range = getDateRange(option);
      onSelectRange(option, range);
      closeModal();
    }
  };

  const handleFromDatePress = () => {
    setEditingField("from");
    setSelectedCalendarDate(fromDate);
    setShowFromDatePicker(true);
  };

  const handleToDatePress = () => {
    setEditingField("to");
    setSelectedCalendarDate(toDate);
    setShowToDatePicker(true);
  };

  const onCalendarChange = (params: { date: Date | undefined }) => {
    if (params.date) {
      setSelectedCalendarDate(params.date);
    }
  };

  const onFromDateConfirm = () => {
    setShowFromDatePicker(false);
    if (selectedCalendarDate) {
      const newFromDate = new Date(selectedCalendarDate);
      newFromDate.setHours(0, 0, 0, 0);
      setFromDate(newFromDate);
      if (newFromDate > toDate) {
        setToDate(newFromDate);
      }
    }
  };

  const onToDateConfirm = () => {
    setShowToDatePicker(false);
    if (selectedCalendarDate) {
      const newToDate = new Date(selectedCalendarDate);
      newToDate.setHours(23, 59, 59, 999);
      setToDate(newToDate);
      if (newToDate < fromDate) {
        setFromDate(newToDate);
      }
    }
  };

  const handleApplyCustomRange = () => {
    const range = { start: fromDate, end: toDate };
    onSelectRange("custom", range);
    closeModal();
  };

  if (!visible) return null;

  return (
    <PaperProvider theme={paperTheme}>
      <Modal
        visible={visible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closeModal} />

          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.modalContent,
                sheetStyle,
                {
                  backgroundColor: theme.backgroundRoot,
                  paddingBottom: insets.bottom + Spacing.lg,
                  maxHeight: MODAL_HEIGHT,
                },
              ]}
            >
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: accentColor }]} />
              </View>

              <View style={styles.content}>
                <ThemedText type="body" style={styles.sectionTitle}>Quick select</ThemedText>
                
                <View style={styles.quickSelectContainer}>
                  {QUICK_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => handleQuickSelect(option.value)}
                      style={[
                        styles.quickSelectChip,
                        localOption === option.value
                          ? { backgroundColor: accentColor }
                          : { backgroundColor: theme.backgroundSecondary },
                      ]}
                    >
                      <ThemedText
                        type="body"
                        style={[
                          styles.quickSelectText,
                          localOption === option.value && { color: "#FFFFFF" },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                <ThemedText type="body" style={styles.sectionTitle}>Custom range</ThemedText>

                <View style={styles.customRangeContainer}>
                  <ThemedText type="caption" muted style={styles.fieldLabel}>From</ThemedText>
                  <Pressable
                    onPress={handleFromDatePress}
                    style={[styles.dateButton, { borderColor: theme.divider }]}
                  >
                    <Feather name="calendar" size={18} color={theme.textMuted} />
                    <ThemedText type="body">{formatDateHook(fromDate)}</ThemedText>
                  </Pressable>

                  <ThemedText type="caption" muted style={styles.fieldLabel}>To</ThemedText>
                  <Pressable
                    onPress={handleToDatePress}
                    style={[styles.dateButton, { borderColor: theme.divider }]}
                  >
                    <Feather name="calendar" size={18} color={theme.textMuted} />
                    <ThemedText type="body">{formatDateHook(toDate)}</ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handleApplyCustomRange}
                    style={[styles.applyButton, { backgroundColor: accentColor }]}
                  >
                    <ThemedText type="body" style={styles.applyButtonText}>Apply</ThemedText>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>

        {showFromDatePicker && (
          <Modal
            visible={showFromDatePicker}
            transparent
            statusBarTranslucent
            animationType="fade"
            onRequestClose={() => setShowFromDatePicker(false)}
          >
            <View style={styles.centeredOverlay}>
              <Pressable style={styles.backdrop} onPress={() => setShowFromDatePicker(false)} />
              <View style={[styles.calendarModal, { backgroundColor: theme.backgroundRoot }]}>
                <View style={styles.calendarHeader}>
                  <ThemedText type="h4" style={styles.calendarTitle}>Select Start Date</ThemedText>
                </View>
                <View style={[styles.calendarWrapper, { height: calendarFixedHeight }]}>
                  <Calendar
                    locale="en"
                    mode="single"
                    date={selectedCalendarDate || fromDate}
                    onChange={onCalendarChange}
                  />
                </View>
                <View style={styles.calendarActions}>
                  <Button
                    mode="text"
                    onPress={() => setShowFromDatePicker(false)}
                    textColor={theme.textMuted}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={onFromDateConfirm}
                    buttonColor={accentColor}
                  >
                    Confirm
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {showToDatePicker && (
          <Modal
            visible={showToDatePicker}
            transparent
            statusBarTranslucent
            animationType="fade"
            onRequestClose={() => setShowToDatePicker(false)}
          >
            <View style={styles.centeredOverlay}>
              <Pressable style={styles.backdrop} onPress={() => setShowToDatePicker(false)} />
              <View style={[styles.calendarModal, { backgroundColor: theme.backgroundRoot }]}>
                <View style={styles.calendarHeader}>
                  <ThemedText type="h4" style={styles.calendarTitle}>Select End Date</ThemedText>
                </View>
                <View style={[styles.calendarWrapper, { height: calendarFixedHeight }]}>
                  <Calendar
                    locale="en"
                    mode="single"
                    date={selectedCalendarDate || toDate}
                    onChange={onCalendarChange}
                  />
                </View>
                <View style={styles.calendarActions}>
                  <Button
                    mode="text"
                    onPress={() => setShowToDatePicker(false)}
                    textColor={theme.textMuted}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={onToDateConfirm}
                    buttonColor={accentColor}
                  >
                    Confirm
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        )}
        </GestureHandlerRootView>
      </Modal>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  centeredOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  calendarModal: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    maxWidth: 400,
    width: "90%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    paddingBottom: Spacing.md,
  },
  calendarWrapper: {
    overflow: "visible",
    paddingBottom: Spacing.sm,
  },
  calendarHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  calendarTitle: {
    fontWeight: "600",
  },
  calendarActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  quickSelectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickSelectChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  quickSelectText: {
    fontWeight: "500",
  },
  customRangeContainer: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    marginBottom: Spacing.xs,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  applyButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
