import React, { useState, useMemo, useEffect } from "react";
import { View, StyleSheet, Pressable, Switch, Modal, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useCaffeineStore } from "@/store/caffeineStore";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { SettingsHeader } from "@/components/SettingsHeader";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS 
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DateTimeSettingsScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList>;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function DateTimeSettingsScreen({ navigation }: DateTimeSettingsScreenProps) {
  const { theme } = useTheme();
  const { profile, updateProfile } = useCaffeineStore();
  const insets = useSafeAreaInsets();
  const [useDeviceTimezone, setUseDeviceTimezone] = useState(true);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const accentColor = "#C9A36A"; // Matches the + icon background

  const timeFormat = profile.timeFormat || "AM/PM";
  const dateFormat = (profile as any).dateFormat || "DD/MM/YYYY";

  const setTimeFormat = (format: "AM/PM" | "24-hour") => {
    updateProfile({ timeFormat: format });
  };

  const setDateFormat = (format: string) => {
    updateProfile({ dateFormat: format } as any);
    setIsDatePickerVisible(false);
  };

  const dateFormats = [
    { label: "31/12/2025", value: "DD/MM/YYYY" },
    { label: "12/31/2025", value: "MM/DD/YYYY" },
    { label: "2025-12-31", value: "YYYY-MM-DD" },
    { label: "31. 12. 2025", value: "DD. MM. YYYY" },
    { label: "31 Dec 2025", value: "DD MMM YYYY" },
  ];

  const currentDateFormatLabel = useMemo(() => {
    const format = dateFormats.find(f => f.value === dateFormat);
    return format ? format.label : "31/12/2025";
  }, [dateFormat]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <SettingsHeader title="Date & Time" onBack={() => navigation.goBack()} />

      <ScreenScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>Time format</ThemedText>
          <View style={[styles.segmentedControl, { backgroundColor: theme.backgroundSecondary }]}>
            <Pressable 
              style={[
                styles.segment, 
                timeFormat === "AM/PM" && { backgroundColor: accentColor }
              ]} 
              onPress={() => setTimeFormat("AM/PM")}
            >
              <ThemedText style={[styles.segmentText, timeFormat === "AM/PM" && { color: "#FFF" }]}>AM/PM</ThemedText>
            </Pressable>
            <Pressable 
              style={[
                styles.segment, 
                timeFormat === "24-hour" && { backgroundColor: accentColor }
              ]} 
              onPress={() => setTimeFormat("24-hour")}
            >
              <ThemedText style={[styles.segmentText, timeFormat === "24-hour" && { color: "#FFF" }]}>24-hour</ThemedText>
            </Pressable>
          </View>
          <ThemedText type="caption" muted style={styles.sectionFooter}>
            Choose how time is displayed throughout the app.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>Date format</ThemedText>
          <Pressable 
            style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => setIsDatePickerVisible(true)}
          >
            <Feather name="calendar" size={20} color={accentColor} style={styles.dropdownIcon} />
            <ThemedText style={styles.dropdownText}>{currentDateFormatLabel}</ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textMuted} />
          </Pressable>
          <ThemedText type="caption" muted style={styles.sectionFooter}>
            Choose how dates are displayed throughout the app.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>Timezone</ThemedText>
          <View style={styles.timezoneToggleRow}>
            <ThemedText>Use device timezone</ThemedText>
            <Switch 
              value={useDeviceTimezone} 
              onValueChange={setUseDeviceTimezone}
              trackColor={{ false: theme.backgroundSecondary, true: accentColor }}
              thumbColor="#FFF"
            />
          </View>
          <Pressable style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary, opacity: useDeviceTimezone ? 0.6 : 1 }]}>
            <Feather name="globe" size={20} color={accentColor} style={styles.dropdownIcon} />
            <ThemedText style={styles.dropdownText}>Asia/Calcutta (GMT+5:30)</ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textMuted} />
          </Pressable>
          <ThemedText type="caption" muted style={styles.sectionFooter}>
            Choose your timezone for accurate time displays throughout the app.
          </ThemedText>
        </View>
      </ScreenScrollView>

      <DateFormatBottomSheet
        visible={isDatePickerVisible}
        currentFormat={dateFormat}
        formats={dateFormats}
        onSelect={setDateFormat}
        onClose={() => setIsDatePickerVisible(false)}
        theme={theme}
        insets={insets}
        accentColor={accentColor}
      />
    </View>
  );
}

function DateFormatBottomSheet({ 
  visible, 
  currentFormat, 
  formats, 
  onSelect, 
  onClose, 
  theme, 
  insets,
  accentColor
}: any) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT);
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150 || event.velocityY > 1000) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <GestureDetector gesture={panGesture}>
            <Animated.View 
              style={[
                styles.bottomSheet, 
                { 
                  backgroundColor: theme.backgroundRoot,
                  paddingBottom: insets.bottom + Spacing.xl
                },
                animatedStyle
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.sheetHandle} />
              <ThemedText type="h2" style={styles.sheetTitle}>Choose date format</ThemedText>
              
              <View style={styles.optionsContainer}>
                {formats.map((item: any) => {
                  const isSelected = item.value === currentFormat;
                  return (
                    <Pressable
                      key={item.value}
                      style={[
                        styles.optionRow,
                        isSelected && { borderColor: "rgba(201, 163, 106, 0.3)", borderWidth: 1, borderRadius: BorderRadius.md }
                      ]}
                      onPress={() => onSelect(item.value)}
                    >
                      <ThemedText style={[styles.optionText, isSelected && { fontWeight: "700" }]}>
                        {item.label}
                      </ThemedText>
                      {isSelected && (
                        <Feather name="check" size={20} color={accentColor} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          </GestureDetector>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontSize: 18,
    fontWeight: "400",
  },
  segmentedControl: {
    flexDirection: "row",
    height: 48,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
      borderColor: "rgba(128,128,128,0.2)",
  },
  segment: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  segmentText: {
    fontWeight: "600",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  dropdownIcon: {
    marginRight: Spacing.md,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
  },
  timezoneToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  sectionFooter: {
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#C9A36A",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  optionText: {
    fontSize: 20,
    fontWeight: "600",
  },
});
