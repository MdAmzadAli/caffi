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
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";

type UserPreferencesScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "UserPreferences">;
};

export default function UserPreferencesScreen({ navigation }: UserPreferencesScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useCaffeineStore();

  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);
  const [localThreshold, setLocalThreshold] = useState(String(profile.optimalCaffeine));
  const inputRef = useRef<TextInput>(null);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const handleBack = () => {
    let finalValue = parseInt(localThreshold, 10);
    if (isNaN(finalValue) || finalValue < 50) {
      finalValue = 50;
    }
    updateProfile({ optimalCaffeine: finalValue });
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

  const updateThreshold = (amount: number) => {
    updateProfile({ optimalCaffeine: Math.max(0, profile.optimalCaffeine + amount) });
  };

  const updateChartMax = (amount: number) => {
    updateProfile({ dailyLimit: Math.max(0, profile.dailyLimit + amount) });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>User preferences</ThemedText>
          <View style={styles.backButton} />
        </View>

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
                <ThemedText type="h3">Redo onboarding</ThemedText>
                <ThemedText type="caption" muted>
                  Retake the questionnaire to recalculate your caffeine profile based on your current situation.
                </ThemedText>
              </View>
            </Pressable>

            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>Safe caffeine threshold</ThemedText>
              <Pressable 
                style={[styles.inputBox, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => inputRef.current?.focus()}
              >
                <TextInput
                  ref={inputRef}
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
                This is the amount of caffeine you can have in your body without significantly disrupting sleep function. Average is around 100mg.
              </ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>Wake time</ThemedText>
              <Pressable 
                style={[styles.inputBox, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowWakePicker(true)}
              >
                <Feather name="sun" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <ThemedText type="h3" style={styles.inputValue}>{formatTime(profile.wakeTime)}</ThemedText>
              </Pressable>
            </View>

            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>Sleep time</ThemedText>
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
              <ThemedText type="h3" style={styles.sectionTitle}>Custom chart maximum (mg)</ThemedText>
              <View style={[styles.inputBox, { backgroundColor: theme.backgroundSecondary }]}>
                <Pressable onPress={() => updateChartMax(-50)} style={styles.inputAction}>
                  <Feather name="minus" size={20} color={theme.textMuted} />
                </Pressable>
                <ThemedText type="h2" style={styles.inputValue}>{profile.dailyLimit}</ThemedText>
                <Pressable onPress={() => updateChartMax(50)} style={styles.inputAction}>
                  <Feather name="plus" size={20} color={theme.textMuted} />
                </Pressable>
              </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
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
