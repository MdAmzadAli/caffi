import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "Settings">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme } = useTheme();
  const { profile, updateProfile, resetData } = useCaffeineStore();

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age?.toString() || "");
  const [weight, setWeight] = useState(profile.weight?.toString() || "");
  const [dailyLimit, setDailyLimit] = useState(profile.dailyLimit.toString());
  const [wakeTime, setWakeTime] = useState(profile.wakeTime);
  const [sleepTime, setSleepTime] = useState(profile.sleepTime);

  const handleSave = () => {
    updateProfile({
      name,
      age: age ? parseInt(age) : undefined,
      weight: weight ? parseInt(weight) : undefined,
      dailyLimit: parseInt(dailyLimit) || 400,
      wakeTime,
      sleepTime,
    });
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
    <ScreenScrollView>
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
            placeholder="Optional"
            keyboardType="number-pad"
            onBlur={handleSave}
          />
          <View style={styles.divider} />
          <SettingsInput
            label="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="Optional"
            keyboardType="number-pad"
            onBlur={handleSave}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Pregnant / Nursing"
            value={profile.isPregnant}
            onToggle={() => {
              updateProfile({ isPregnant: !profile.isPregnant });
            }}
          />
        </ThemedView>
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
          DRINKS
        </ThemedText>
        <ThemedView elevation={1} style={styles.card}>
          <SettingsButton
            icon="plus-circle"
            label="Add Custom Drink"
            onPress={() => navigation.navigate("CustomDrink")}
          />
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
});
