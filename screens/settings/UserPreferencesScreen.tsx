import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable, TextInput, Alert, Keyboard, TouchableWithoutFeedback } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme";
import { useCaffeineStore } from "@/store/caffeineStore";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { TimePickerModal } from "react-native-paper-dates";
import { SettingsHeader } from "@/components/SettingsHeader";
import { useFormattedTime } from "@/hooks/useFormattedTime";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";

type UserPreferencesScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "UserPreferences">;
};

export default function UserPreferencesScreen({ navigation }: UserPreferencesScreenProps) {
  const { theme } = useTheme();
  const { formatTime } = useFormattedTime();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useCaffeineStore();

  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);
  const [localThreshold, setLocalThreshold] = useState(String(profile.optimalCaffeine));
  const [localChartMax, setLocalChartMax] = useState(String(profile.graphYAxisLimit));
  const thresholdInputRef = useRef<TextInput>(null);
  const chartMaxInputRef = useRef<TextInput>(null);

  const handleBack = () => {
    let finalThreshold = parseInt(localThreshold, 10);
    if (isNaN(finalThreshold) || finalThreshold < 50) {
      finalThreshold = 50;
    }

    let finalChartMax = parseInt(localChartMax, 10);
    if (isNaN(finalChartMax) || finalChartMax < 100) {
      finalChartMax = 300;
    }

    updateProfile({ 
      optimalCaffeine: finalThreshold,
      graphYAxisLimit: finalChartMax 
    });
    navigation.goBack();
  };

  const handleRedoOnboarding = () => {
    Alert.alert(
      "Redo Onboarding",
      "Are you sure you want to retake the questionnaire? Your current profile will be updated.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Redo", 
          onPress: () => {
            updateProfile({ hasCompletedOnboarding: false });
          } 
        }
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <SettingsHeader title="User preferences" onBack={handleBack} />

        <ScreenScrollView
          contentContainerStyle={{ paddingTop: 0 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Pressable style={styles.redoButton} onPress={handleRedoOnboarding}>
              <View style={styles.redoIconContainer}>
                <MaterialCommunityIcons name="refresh" size={24} color={theme.text} />
              </View>
              <View style={styles.redoTextContainer}>
                <ThemedText type="h4">Redo onboarding</ThemedText>
                <ThemedText type="caption" muted>
                  Retake the questionnaire to recalculate your caffeine profile based on your current situation.
                </ThemedText>
              </View>
            </Pressable>

            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>Safe Caffeine Threshold</ThemedText>
              <Pressable 
                style={[styles.inputBox, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => thresholdInputRef.current?.focus()}
              >
                <TextInput
                  ref={thresholdInputRef}
                  style={[styles.inputValue, { color: theme.text, fontSize: 24, fontWeight: "700" }]}
                  value={localThreshold}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, "");
                    setLocalThreshold(numericText);
                  }}
                  onBlur={() => {
                    let val = parseInt(localThreshold, 10);
                    if (isNaN(val) || val < 50) {
                      val = 50;
                    }
                    setLocalThreshold(String(val));
                    updateProfile({ optimalCaffeine: val });
                    Keyboard.dismiss();
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </Pressable>
              <ThemedText type="caption" muted style={styles.sectionFooter}>
                This is the amount of caffeine your body can handle without triggering anxiety, jitters, or restlessness. Minimum is 50 mg.
              </ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>Wake Time</ThemedText>
              <Pressable 
                style={[styles.inputBox, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowWakePicker(true)}
              >
                <Feather name="sun" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <ThemedText type="h3" style={styles.inputValue}>{formatTime(profile.wakeTime)}</ThemedText>
              </Pressable>

              <ThemedText type="caption" muted style={styles.sectionFooter}>
                Set your usual wake time to help give you accurate recommendations.
              </ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>Sleep Time</ThemedText>
              <Pressable 
                style={[styles.inputBox, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowSleepPicker(true)}
              >
                <Feather name="moon" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <ThemedText type="h3" style={styles.inputValue}>{formatTime(profile.sleepTime)}</ThemedText>
              </Pressable>
              <ThemedText type="caption" muted style={styles.sectionFooter}>
                Set your usual bed time to help track when caffeine might affect your sleep.
              </ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>Custom Chart Maximum (mg)</ThemedText>
              <Pressable 
                style={[styles.inputBox, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => chartMaxInputRef.current?.focus()}
              >
                <TextInput
                  ref={chartMaxInputRef}
                  style={[styles.inputValue, { color: theme.text, fontSize: 24, fontWeight: "700" }]}
                  value={localChartMax}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, "");
                    setLocalChartMax(numericText);
                  }}
                  onBlur={() => {
                    let val = parseInt(localChartMax, 10);
                    if (isNaN(val) || val < 100) {
                      val = 300;
                    }
                    setLocalChartMax(String(val));
                    updateProfile({ graphYAxisLimit: val });
                    Keyboard.dismiss();
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </Pressable>
              <ThemedText type="caption" muted style={styles.sectionFooter}>
                Set the maximum value displayed on your caffeine tracking chart. Minimum is 100 mg.
              </ThemedText>
            </View>
          </View>
        </ScreenScrollView>

        <TimePickerModal
          visible={showWakePicker}
          onDismiss={() => setShowWakePicker(false)}
          onConfirm={({ hours, minutes }) => {
            updateProfile({ wakeTime: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}` });
            setShowWakePicker(false);
          }}
          hours={Number(profile.wakeTime.split(":")[0])}
          minutes={Number(profile.wakeTime.split(":")[1])}
        />

        <TimePickerModal
          visible={showSleepPicker}
          onDismiss={() => setShowSleepPicker(false)}
          onConfirm={({ hours, minutes }) => {
            updateProfile({ sleepTime: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}` });
            setShowSleepPicker(false);
          }}
          hours={Number(profile.sleepTime.split(":")[0])}
          minutes={Number(profile.sleepTime.split(":")[1])}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  redoButton: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  redoIconContainer: {
    marginTop: 4,
    marginRight: Spacing.md,
  },
  redoTextContainer: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontSize: 18,
     fontWeight: "400",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  inputAction: {
    padding: Spacing.md,
  },
  inputValue: {
    flex: 1,
    textAlign: "center",
  },
  inputIcon: {
    position: "absolute",
    left: Spacing.md,
  },
  sectionFooter: {
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
});