import React, { useState } from "react";
import { View, StyleSheet, Pressable, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useCaffeineStore } from "@/store/caffeineStore";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { SettingsHeader } from "@/components/SettingsHeader";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";
import { DateFormatPopup } from "@/components/DateFormatPopup";
import { TimeZoneModal } from "@/components/TimeZoneModal";

type DateTimeSettingsScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList>;
};

export default function DateTimeSettingsScreen({ navigation }: DateTimeSettingsScreenProps) {
  const { theme } = useTheme();
  const { profile, updateProfile } = useCaffeineStore();
  
  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currentTimeZone = (profile as any).timezone || deviceTimezone;
  const timeFormat = profile.timeFormat || "AM/PM";
  const currentDateFormat = profile.dateFormat || "DD/MM/YYYY";
  const accentColor = "#C9A36A"; 
  
  // Initialize toggle state based on whether a manual timezone exists in profile
  const [useDeviceTimezone, setUseDeviceTimezone] = useState(!(profile as any).timezone);
  const [showDateFormatPopup, setShowDateFormatPopup] = useState(false);
  const [showTimeZoneModal, setShowTimeZoneModal] = useState(false);

  const setTimeFormat = (format: "AM/PM" | "24-hour") => {
    updateProfile({ timeFormat: format });
  };

  const handleToggleDeviceTimezone = (value: boolean) => {
    setUseDeviceTimezone(value);
    if (value) {
      // Switch back to device timezone
      updateProfile({ timezone: undefined } as any);
    }
  };

  const handleSelectTimeZone = (tz: string) => {
    updateProfile({ timezone: tz } as any);
    setUseDeviceTimezone(false);
  };
  
  const getDateFormatLabel = (format: string) => {
    switch (format) {
      case "DD/MM/YYYY": return "31/12/2025";
      case "MM/DD/YYYY": return "12/31/2025";
      case "YYYY-MM-DD": return "2025-12-31";
      case "DD.MM.YYYY": return "31. 12. 2025";
      case "DD MMM YYYY": return "31 Dec 2025";
      default: return "31/12/2025";
    }
  };

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
            onPress={() => setShowDateFormatPopup(true)}
          >
            <Feather name="calendar" size={20} color={accentColor} style={styles.dropdownIcon} />
            <ThemedText style={styles.dropdownText}>{getDateFormatLabel(currentDateFormat)}</ThemedText>
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
              onValueChange={handleToggleDeviceTimezone}
              trackColor={{ false: theme.backgroundSecondary, true: accentColor }}
              thumbColor="#FFF"
            />
          </View>
          <Pressable 
            style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary, opacity: useDeviceTimezone ? 0.6 : 1 }]}
            disabled={useDeviceTimezone}
            onPress={() => setShowTimeZoneModal(true)}
          >
            <Feather name="globe" size={20} color={accentColor} style={styles.dropdownIcon} />
            <ThemedText style={styles.dropdownText}>{currentTimeZone}</ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textMuted} />
          </Pressable>
          <ThemedText type="caption" muted style={styles.sectionFooter}>
            Choose your timezone for accurate time displays throughout the app.
          </ThemedText>
        </View>
      </ScreenScrollView>

      <DateFormatPopup
        visible={showDateFormatPopup}
        selectedFormat={currentDateFormat}
        onClose={() => setShowDateFormatPopup(false)}
        onSelect={(format) => updateProfile({ dateFormat: format })}
      />

      <TimeZoneModal
        visible={showTimeZoneModal}
        selectedTimeZone={currentTimeZone}
        onClose={() => setShowTimeZoneModal(false)}
        onSelect={handleSelectTimeZone}
      />
    </View>
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
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionFooter: {
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
});
