import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, Alert, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  useCaffeineStore,
  calculateOptimalCaffeine,
  Gender,
  CaffeineSensitivity,
  SleepGoal,
  AlcoholIntake,
  Medication,
} from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { ThemeMode } from "@/store/themeStore";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

const SENSITIVITY_LABELS: Record<CaffeineSensitivity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const SLEEP_GOAL_LABELS: Record<SleepGoal, string> = {
  good_sleep: "Good Sleep",
  normal_sleep: "Normal Sleep",
  insomnia_prone: "Insomnia-Prone",
};

const ALCOHOL_LABELS: Record<AlcoholIntake, string> = {
  rare: "Rare",
  sometimes: "Sometimes",
  daily: "Daily",
};

const MEDICATION_LABELS: Record<Medication, string> = {
  anxiety_meds: "Anxiety meds",
  adhd_stimulants: "ADHD stimulants",
  ssris: "SSRIs",
  beta_blockers: "Beta-blockers",
  none: "None",
};

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "Settings">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { profile, updateProfile, resetData } = useCaffeineStore();

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age?.toString() || "");
  const [weight, setWeight] = useState(profile.weight?.toString() || "");
  const [dailyLimit, setDailyLimit] = useState(profile.dailyLimit.toString());
  const [wakeTime, setWakeTime] = useState(profile.wakeTime);
  const [sleepTime, setSleepTime] = useState(profile.sleepTime);

  const handleSave = () => {
    const newAge = age ? parseInt(age) : undefined;
    const newWeight = weight ? parseInt(weight) : undefined;
    
    const { optimal, safe } = calculateOptimalCaffeine({
      age: newAge,
      weight: newWeight,
      gender: profile.gender,
      caffeineSensitivity: profile.caffeineSensitivity,
      sleepGoal: profile.sleepGoal,
      alcoholIntake: profile.alcoholIntake,
      medications: profile.medications,
      isPregnant: profile.isPregnant,
      hasHeartCondition: profile.hasHeartCondition,
      onBirthControl: profile.onBirthControl,
    });

    updateProfile({
      name,
      age: newAge,
      weight: newWeight,
      dailyLimit: parseInt(dailyLimit) || safe,
      wakeTime,
      sleepTime,
      optimalCaffeine: optimal,
      safeCaffeine: safe,
    });
  };

  const getMedicationsDisplay = () => {
    if (!profile.medications || profile.medications.length === 0) {
      return "Not set";
    }
    return profile.medications.map((m) => MEDICATION_LABELS[m]).join(", ");
  };

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This will delete all your drink history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetData();
          },
        },
      ],
    );
  };

  return (
    <ScreenScrollView header={<ScreenHeader title="Settings" />}>
      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          YOUR CAFFEINE LIMITS
        </ThemedText>
        <ThemedView elevation={1} style={styles.limitsCard}>
          <View style={styles.limitItem}>
            <ThemedText type="caption" muted style={styles.limitLabel}>
              Optimal Daily
            </ThemedText>
            <ThemedText type="h3" style={{ color: Colors.light.accent }}>
              {profile.optimalCaffeine} mg
            </ThemedText>
          </View>
          <View style={[styles.limitDivider, { backgroundColor: theme.backgroundSecondary }]} />
          <View style={styles.limitItem}>
            <ThemedText type="caption" muted style={styles.limitLabel}>
              Safe Maximum
            </ThemedText>
            <ThemedText type="h3">
              {profile.safeCaffeine} mg
            </ThemedText>
          </View>
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          PROFILE
        </ThemedText>
        <ThemedView elevation={1} style={styles.card}>
          <SettingsInput
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            onBlur={handleSave}
          />
          <View style={styles.divider} />
          <SettingsInput
            label="Age"
            value={age}
            onChangeText={setAge}
            placeholder="Not set"
            keyboardType="number-pad"
            onBlur={handleSave}
          />
          <View style={styles.divider} />
          <SettingsInput
            label="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="Not set"
            keyboardType="number-pad"
            onBlur={handleSave}
          />
          <View style={styles.divider} />
          <SettingsDisplayRow
            label="Gender"
            value={profile.gender ? GENDER_LABELS[profile.gender] : "Not set"}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Pregnant / Nursing"
            value={profile.isPregnant}
            onToggle={() => {
              const newIsPregnant = !profile.isPregnant;
              const { optimal, safe } = calculateOptimalCaffeine({
                ...profile,
                isPregnant: newIsPregnant,
              });
              updateProfile({
                isPregnant: newIsPregnant,
                optimalCaffeine: optimal,
                safeCaffeine: safe,
              });
            }}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Heart Condition"
            value={profile.hasHeartCondition}
            onToggle={() => {
              const newHasHeartCondition = !profile.hasHeartCondition;
              const { optimal, safe } = calculateOptimalCaffeine({
                ...profile,
                hasHeartCondition: newHasHeartCondition,
              });
              updateProfile({
                hasHeartCondition: newHasHeartCondition,
                optimalCaffeine: optimal,
                safeCaffeine: safe,
              });
            }}
          />
          {profile.gender === "female" && (
            <>
              <View style={styles.divider} />
              <ToggleRow
                label="On Birth Control"
                value={profile.onBirthControl}
                onToggle={() => {
                  const newOnBirthControl = !profile.onBirthControl;
                  const { optimal, safe } = calculateOptimalCaffeine({
                    ...profile,
                    onBirthControl: newOnBirthControl,
                  });
                  updateProfile({
                    onBirthControl: newOnBirthControl,
                    optimalCaffeine: optimal,
                    safeCaffeine: safe,
                  });
                }}
              />
            </>
          )}
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          HEALTH FACTORS
        </ThemedText>
        <ThemedView elevation={1} style={styles.card}>
          <SettingsDisplayRow
            label="Caffeine Sensitivity"
            value={profile.caffeineSensitivity ? SENSITIVITY_LABELS[profile.caffeineSensitivity] : "Not set"}
          />
          <View style={styles.divider} />
          <SettingsDisplayRow
            label="Sleep Goal"
            value={profile.sleepGoal ? SLEEP_GOAL_LABELS[profile.sleepGoal] : "Not set"}
          />
          <View style={styles.divider} />
          <SettingsDisplayRow
            label="Alcohol Intake"
            value={profile.alcoholIntake ? ALCOHOL_LABELS[profile.alcoholIntake] : "Not set"}
          />
          <View style={styles.divider} />
          <SettingsDisplayRow
            label="Medications"
            value={getMedicationsDisplay()}
          />
        </ThemedView>
        <ThemedText type="caption" muted style={styles.hint}>
          These factors affect your caffeine recommendations
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          CAFFEINE SETTINGS
        </ThemedText>
        <ThemedView elevation={1} style={styles.card}>
          <SettingsInput
            label="Daily Limit (mg)"
            value={dailyLimit}
            onChangeText={setDailyLimit}
            placeholder="400"
            keyboardType="number-pad"
            onBlur={handleSave}
          />
          <View style={styles.divider} />
          <SettingsInput
            label="Wake Time"
            value={wakeTime}
            onChangeText={setWakeTime}
            placeholder="07:00"
            onBlur={handleSave}
          />
          <View style={styles.divider} />
          <SettingsInput
            label="Sleep Time"
            value={sleepTime}
            onChangeText={setSleepTime}
            placeholder="23:00"
            onBlur={handleSave}
          />
        </ThemedView>
        <ThemedText type="caption" muted style={styles.hint}>
          Recommended daily limit: 400mg for adults, 200mg if pregnant
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          APPEARANCE
        </ThemedText>
        <ThemedView elevation={1} style={styles.card}>
          <View style={styles.themeRow}>
            <ThemedText type="body">Theme</ThemedText>
            <View style={styles.themeOptions}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setThemeMode("light")}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      themeMode === "light"
                        ? Colors.light.accent
                        : theme.backgroundTertiary,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: themeMode === "light" ? "#FFFFFF" : theme.text,
                    fontWeight: themeMode === "light" ? "600" : "400",
                  }}
                >
                  Light
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setThemeMode("dark")}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      themeMode === "dark"
                        ? Colors.light.accent
                        : theme.backgroundTertiary,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: themeMode === "dark" ? "#FFFFFF" : theme.text,
                    fontWeight: themeMode === "dark" ? "600" : "400",
                  }}
                >
                  Dark
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setThemeMode("system")}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      themeMode === "system"
                        ? Colors.light.accent
                        : theme.backgroundTertiary,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: themeMode === "system" ? "#FFFFFF" : theme.text,
                    fontWeight: themeMode === "system" ? "600" : "400",
                  }}
                >
                  System
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          DATA
        </ThemedText>
        <ThemedView elevation={1} style={styles.card}>
          <SettingsButton
            icon="trash-2"
            label="Reset All Data"
            onPress={handleReset}
            destructive
          />
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          PRIVACY
        </ThemedText>
        <ThemedView elevation={1} style={styles.privacyCard}>
          <Feather name="shield" size={24} color={Colors.light.success} />
          <View style={styles.privacyText}>
            <ThemedText type="body" style={styles.privacyTitle}>
              Your data is private
            </ThemedText>
            <ThemedText type="small" muted>
              All data is stored locally on your device. We never collect or
              share your information.
            </ThemedText>
          </View>
        </ThemedView>
      </View>

      <View style={styles.footer}>
        <ThemedText type="caption" muted style={styles.version}>
          Caffi v1.0.0
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

interface SettingsInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad";
  onBlur?: () => void;
}

function SettingsInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  onBlur,
}: SettingsInputProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.inputRow}>
      <ThemedText type="body">{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboardType}
        onBlur={onBlur}
        style={[styles.input, { color: theme.text }]}
      />
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, value, onToggle }: ToggleRowProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable style={styles.toggleRow} onPress={onToggle}>
      <ThemedText type="body">{label}</ThemedText>
      <AnimatedPressable
        onPress={onToggle}
        onPressIn={() => {
          scale.value = withSpring(0.9);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.toggle,
          {
            backgroundColor: value
              ? Colors.light.accent
              : theme.backgroundSecondary,
          },
          animatedStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.toggleKnob,
            {
              transform: [{ translateX: value ? 20 : 0 }],
            },
          ]}
        />
      </AnimatedPressable>
    </Pressable>
  );
}

interface SettingsDisplayRowProps {
  label: string;
  value: string;
}

function SettingsDisplayRow({ label, value }: SettingsDisplayRowProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.displayRow}>
      <ThemedText type="body">{label}</ThemedText>
      <ThemedText type="body" muted style={styles.displayValue}>
        {value}
      </ThemedText>
    </View>
  );
}

interface SettingsButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function SettingsButton({
  icon,
  label,
  onPress,
  destructive,
}: SettingsButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[styles.settingsButton, animatedStyle]}
    >
      <View style={styles.settingsButtonContent}>
        <Feather
          name={icon}
          size={20}
          color={destructive ? Colors.light.danger : Colors.light.accent}
        />
        <ThemedText
          type="body"
          style={[
            styles.settingsButtonLabel,
            destructive && { color: Colors.light.danger },
          ]}
        >
          {label}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={Colors.light.textMuted} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  limitsCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  limitItem: {
    flex: 1,
    alignItems: "center",
  },
  limitLabel: {
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  limitDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.lg,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  displayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  displayValue: {
    textAlign: "right",
    maxWidth: "60%",
  },
  input: {
    textAlign: "right",
    fontSize: 16,
    minWidth: 100,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginLeft: Spacing.lg,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  hint: {
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  settingsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingsButtonLabel: {
    fontWeight: "500",
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  version: {
    textAlign: "center",
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  themeOptions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  themeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
