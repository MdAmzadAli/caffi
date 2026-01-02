import React, { useState, useEffect, useMemo,useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
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
import { Calendar, TimePickerModal as PaperTimePickerModal, registerTranslation, en } from "react-native-paper-dates";
import { Button, Provider as PaperProvider, MD3DarkTheme, MD3LightTheme, Portal } from "react-native-paper";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

registerTranslation('en', en);

const BOTTOM_SHEET_HEIGHT_RATIO = 0.45;
const CALENDAR_HEADER_OFFSET = 100;

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (date: Date, label: string) => void;
  initialDate?: Date;
}

const PRESET_OPTIONS = [
  { label: "now", minutes: 0 },
  { label: "10 minutes ago", minutes: 10 },
  { label: "15 minutes ago", minutes: 15 },
  { label: "20 minutes ago", minutes: 20 },
  { label: "25 minutes ago", minutes: 25 },
  { label: "30 minutes ago", minutes: 30 },
];

export function TimePickerModal({ visible, onClose, onSelectTime, initialDate }: TimePickerModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [selectedPreset, setSelectedPreset] = useState<string>("now");
  const [customDate, setCustomDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const MODAL_HEIGHT = windowHeight * BOTTOM_SHEET_HEIGHT_RATIO;
  const translateY = useSharedValue(MODAL_HEIGHT);
  const startY = useSharedValue(0);

  const { calendarModalWidth, calendarCellSize, calendarFixedHeight } = useMemo(() => {
    const modalWidth = Math.min(windowWidth * 0.9, 400);
    const cellSize = modalWidth / 7;
    const fixedHeight = (cellSize * 6) + CALENDAR_HEADER_OFFSET;
    return {
      calendarModalWidth: modalWidth,
      calendarCellSize: cellSize,
      calendarFixedHeight: fixedHeight,
    };
  }, [windowWidth]);

  const accentColor = useMemo(
    () => (isDark ? Colors.dark.accent : Colors.light.accent),
    [isDark]
  );
  
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
      setSelectedPreset("now");
      setCustomDate(initialDate || new Date());
      translateY.value = MODAL_HEIGHT;
        translateY.value = withSpring(0);
    } else {
      translateY.value = MODAL_HEIGHT;
    }
  }, [visible, translateY, initialDate]);

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

  const handlePresetSelect = (preset: typeof PRESET_OPTIONS[0]) => {
    setSelectedPreset(preset.label);
    const date = new Date();
    date.setMinutes(date.getMinutes() - preset.minutes);
    onSelectTime(date, preset.label);
    closeModal();
  };

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);

  const onCalendarChange = (params: { date: Date | undefined }) => {
    if (params.date) {
      setSelectedCalendarDate(params.date);
    }
  };

  const onDateConfirm = () => {
    setShowDatePicker(false);
    if (selectedCalendarDate) {
      const newDate = new Date(customDate);
      newDate.setFullYear(selectedCalendarDate.getFullYear());
      newDate.setMonth(selectedCalendarDate.getMonth());
      newDate.setDate(selectedCalendarDate.getDate());
      setCustomDate(newDate);
      setSelectedPreset("");
      onSelectTime(newDate, formatDateTime(newDate));
      setSelectedCalendarDate(undefined); // Add this line
    }
  };

  const onTimeConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setShowTimePicker(false);
    const newDate = new Date(customDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setCustomDate(newDate);
    setSelectedPreset("");
    onSelectTime(newDate, formatDateTime(newDate));
  };

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }, []);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const formatDateTime = useCallback((date: Date) => {
    return `${formatDate(date)} ${formatTime(date)}`;
  }, [formatDate, formatTime]);

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
        <GestureHandlerRootView style={{ flex: 1 }} >
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
                <ThemedText type="body" style={styles.sectionTitle}>Preset</ThemedText>
                
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetContainer}
                >
                  {PRESET_OPTIONS.map((preset) => (
                    <Pressable
                      key={preset.label}
                      onPress={() => handlePresetSelect(preset)}
                      style={[
                        styles.presetChip,
                        selectedPreset === preset.label
                          ? { backgroundColor: Colors.light.accent }
                          : { backgroundColor: theme.backgroundSecondary },
                      ]}
                    >
                      <ThemedText
                        type="body"
                        style={[
                          styles.presetText,
                          selectedPreset === preset.label && { color: "#FFFFFF" },
                        ]}
                      >
                        {preset.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>

                <ThemedText type="body" style={styles.sectionTitle}>Custom</ThemedText>

                <View style={styles.customRow}>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.customButton, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <Feather name="calendar" size={20} color={theme.accent} />
                    <ThemedText type="body">{formatDate(customDate)}</ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowTimePicker(true)}
                    style={[styles.customButton, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <Feather name="clock" size={20} color={theme.accent} />
                    <ThemedText type="body">{formatTime(customDate)}</ThemedText>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
           </GestureHandlerRootView>
        {showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent
            statusBarTranslucent
            animationType="fade"
            onRequestClose={() => {
              setShowDatePicker(false);
              setSelectedCalendarDate(undefined); // Add this line
            }}
          >
            <View style={styles.centeredOverlay}>
              <Pressable style={styles.backdrop} onPress={() => setShowDatePicker(false)} />
              <View style={[styles.calendarModal, { backgroundColor: theme.backgroundRoot }]}>
                <View style={styles.calendarHeader}>
                  <ThemedText type="h4" style={styles.calendarTitle}>Select Date</ThemedText>
                </View>
                <View style={[styles.calendarWrapper, { height: calendarFixedHeight }]}>
                  <Calendar
                    key={showDatePicker ? 'calendar-visible' : 'calendar-hidden'}
                    locale="en"
                    mode="single"
                    date={selectedCalendarDate || customDate}
                    onChange={onCalendarChange}
                  />
                </View>
                <View style={styles.calendarActions}>
                  <Button
                    mode="text"
                    onPress={() => setShowDatePicker(false)}
                    textColor={theme.textMuted}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={onDateConfirm}
                    buttonColor={accentColor}
                  >
                    Confirm
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        )}
     
      </Modal>

      <Portal>
        <PaperTimePickerModal
          visible={showTimePicker}
          onDismiss={() => setShowTimePicker(false)}
          onConfirm={onTimeConfirm}
          hours={customDate.getHours()}
          minutes={customDate.getMinutes()}
          label="Select Time"
          locale="en"
          cancelLabel="Cancel"
          confirmLabel="OK"
        />
      </Portal>
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
  presetContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  presetChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  presetText: {
    fontWeight: "500",
  },
  customRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  customButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
