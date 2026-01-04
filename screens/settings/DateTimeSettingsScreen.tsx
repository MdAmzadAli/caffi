import React, { useState } from "react";
import { View, StyleSheet, Pressable, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useCaffeineStore } from "@/store/caffeineStore";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { SettingsHeader } from "@/components/SettingsHeader";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";

type DateTimeSettingsScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList>;
};

export default function DateTimeSettingsScreen({ navigation }: DateTimeSettingsScreenProps) {
  const { theme } = useTheme();
  const { profile, updateProfile } = useCaffeineStore();
  const [useDeviceTimezone, setUseDeviceTimezone] = useState(true);

  const accentColor = "#C9A36A"; // Matches the + icon background

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
                profile.timeFormat === "AM/PM" && { backgroundColor: accentColor }
              ]} 
              onPress={() => updateProfile({ timeFormat: "AM/PM" })}
            >
              <ThemedText style={[styles.segmentText, profile.timeFormat === "AM/PM" && { color: "#FFF" }]}>AM/PM</ThemedText>
            </Pressable>
            <Pressable 
              style={[
                styles.segment, 
                profile.timeFormat === "24-hour" && { backgroundColor: accentColor }
              ]} 
              onPress={() => updateProfile({ timeFormat: "24-hour" })}
            >
              <ThemedText style={[styles.segmentText, profile.timeFormat === "24-hour" && { color: "#FFF" }]}>24-hour</ThemedText>
            </Pressable>
          </View>
          <ThemedText type="caption" muted style={styles.sectionFooter}>
            Choose how time is displayed throughout the app.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>Date format</ThemedText>
          <Pressable style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="calendar" size={20} color={accentColor} style={styles.dropdownIcon} />
            <ThemedText style={styles.dropdownText}>31/12/2025</ThemedText>
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
    marginTop:-16,
  },
  sectionFooter: {
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
});
