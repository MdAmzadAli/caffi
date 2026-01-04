import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { TimePickerModal } from "react-native-paper-dates";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  useCaffeineStore,
  calculateOptimalCaffeine,
  AgeRange,
  CaffeineSensitivity,
  AlcoholIntake,
  Medication,
} from "@/store/caffeineStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type OnboardingStep =
  | "special_condition"
  | "age"
  | "weight"
  | "sensitivity"
  | "alcohol"
  | "medications"
  | "schedule"
  | "summary";

const STEPS: OnboardingStep[] = [
  "special_condition",
  "age",
  "weight",
  "sensitivity",
  "alcohol",
  "medications",
  "schedule",
];

interface OnboardingData {
  specialCondition?: "none" | "pregnancy_breastfeeding";
  ageRange?: AgeRange;
  weight?: number;
  caffeineSensitivity?: CaffeineSensitivity;
  alcoholIntake?: AlcoholIntake;
  medications?: Medication[];
  wakeTime?: string;
  sleepTime?: string;
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { updateProfile } = useCaffeineStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({});
  const slideAnim = useSharedValue(0);

  const animateToStep = useCallback(
    (nextStep: number) => {
      slideAnim.value = withTiming(nextStep, { duration: 300 }, () => {
        runOnJS(setCurrentStep)(nextStep);
      });
    },
    [slideAnim]
  );

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      animateToStep(currentStep + 1);
    }
  }, [currentStep, animateToStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      // If going back from schedule and pregnant, go back to special_condition
      if (STEPS[currentStep] === "schedule" && data.specialCondition === "pregnancy_breastfeeding") {
        animateToStep(0);
      } else {
        animateToStep(currentStep - 1);
      }
    }
  }, [currentStep, animateToStep, data.specialCondition]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleFinish = useCallback((wakeTimeOverride?: string, sleepTimeOverride?: string) => {
    const isPregnant = data.specialCondition === "pregnancy_breastfeeding";
    
    const calculationInputs = {
      ageRange: data.ageRange,
      weight: data.weight,
      caffeineSensitivity: data.caffeineSensitivity,
      alcoholIntake: data.alcoholIntake,
      medications: data.medications,
      isPregnant,
    };

    let { optimal, safe } = calculateOptimalCaffeine(calculationInputs);

    if (isPregnant) {
      optimal = 100;
      safe = 200;
    }

    updateProfile({
      name: "",
      ageRange: data.ageRange,
      weight: data.weight,
      isPregnant,
      hasHeartCondition: false,
      caffeineSensitivity: data.caffeineSensitivity,
      alcoholIntake: data.alcoholIntake,
      medications: data.medications,
      wakeTime: wakeTimeOverride || data.wakeTime || "07:00",
      sleepTime: sleepTimeOverride || data.sleepTime || "23:00",
      optimalCaffeine: optimal,
      safeCaffeine: safe,
      dailyLimit: optimal,
      graphYAxisLimit: 300,
      timeFormat: "AM/PM",
      hasCompletedOnboarding: true,
    });
  }, [data, updateProfile]);

  const updateData = useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const progressWidth = ((currentStep + 1) / STEPS.length) * 100;

  const renderStep = () => {
    switch (STEPS[currentStep]) {
      case "special_condition":
        return (
          <SpecialConditionStep
            value={data.specialCondition}
            onChange={(v) => {
              updateData("specialCondition", v);
              if (v === "pregnancy_breastfeeding") {
                // Skip to schedule
                animateToStep(STEPS.indexOf("schedule"));
              } else {
                handleNext();
              }
            }}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case "age":
        return (
          <AgeStep
            value={data.ageRange}
            onChange={(v) => updateData("ageRange", v)}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case "weight":
        return (
          <WeightStep
            value={data.weight}
            onChange={(v) => updateData("weight", v)}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case "sensitivity":
        return (
          <SensitivityStep
            value={data.caffeineSensitivity}
            onChange={(v) => updateData("caffeineSensitivity", v)}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case "alcohol":
        return (
          <AlcoholStep
            value={data.alcoholIntake}
            onChange={(v) => updateData("alcoholIntake", v)}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case "medications":
        return (
          <MedicationsStep
            value={data.medications}
            onChange={(v) => updateData("medications", v)}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case "schedule":
        return (
          <ScheduleStep
            wakeTime={data.wakeTime}
            sleepTime={data.sleepTime}
            onWakeTimeChange={(v) => updateData("wakeTime", v)}
            onSleepTimeChange={(v) => updateData("sleepTime", v)}
            onFinish={handleFinish}
            data={data}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md },
        ]}
      >
        {currentStep > 0 ? (
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}

        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: Colors.light.accent,
                  width: `${progressWidth}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>{renderStep()}</View>
    </View>
  );
}

interface StepProps<T> {
  value: T | undefined;
  onChange: (value: T) => void;
  onNext: () => void;
  onSkip: () => void;
}

function SpecialConditionStep({ value, onChange, onNext, onSkip }: StepProps<"none" | "pregnancy_breastfeeding">) {
  const options: { key: "none" | "pregnancy_breastfeeding"; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "none", label: "None", icon: "check" },
    { key: "pregnancy_breastfeeding", label: "Pregnancy / Breastfeeding", icon: "heart" },
  ];

  return (
    <StepContainer
      icon="shield"
      title="Special Condition"
      onSkip={onSkip}
    >
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <OptionButton
            key={option.key}
            label={option.label}
            icon={option.icon}
            isSelected={value === option.key}
            onPress={() => onChange(option.key)}
          />
        ))}
      </View>
    </StepContainer>
  );
}

function AgeStep({ value, onChange, onNext, onSkip }: StepProps<AgeRange>) {
  const handleSelect = (ageRange: AgeRange) => {
    onChange(ageRange);
    onNext();
  };

  const options: { key: AgeRange; label: string; description: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "under_18", label: "Under 18", description: "Teen or younger", icon: "user" },
    { key: "18_to_60", label: "18 to 60", description: "Adult", icon: "user" },
    { key: "over_60", label: "Over 60", description: "Senior", icon: "user" },
  ];

  return (
    <StepContainer
      icon="user"
      title="Your Age Range"
      onSkip={onSkip}
    >
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <OptionButton
            key={option.key}
            label={option.label}
            icon={option.icon}
            isSelected={value === option.key}
            onPress={() => handleSelect(option.key)}
          />
        ))}
      </View>
    </StepContainer>
  );
}

function WeightStep({ value, onChange, onNext, onSkip }: StepProps<number>) {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(value ? String(value) : "");

  const handleConfirm = () => {
    const weightValue = parseInt(localValue, 10);
    if (weightValue && weightValue >= 20 && weightValue <= 300) {
      onChange(weightValue);
      onNext();
    }
  };

  const handleTextChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "");
    setLocalValue(numericText);
  };

  const isValid = () => {
    const weightValue = parseInt(localValue, 10);
    return weightValue && weightValue >= 20 && weightValue <= 300;
  };

  return (
    <StepContainer
      icon="activity"
      title="Your Weight"
      onSkip={onSkip}
    >
      <View style={styles.inputContainer}>
        <ThemedText type="body" muted style={styles.inputLabel}>
          Enter your weight in kilograms
        </ThemedText>
        <View
          style={[
            styles.textInputContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="activity" size={20} color={theme.textMuted} />
          <View style={styles.textInputWrapper}>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={localValue}
              onChangeText={handleTextChange}
              placeholder="Enter weight (kg)"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              maxLength={3}
            />
          </View>
          <ThemedText type="body" muted>kg</ThemedText>
        </View>
      </View>
      <ContinueButton onPress={handleConfirm} disabled={!isValid()} />
    </StepContainer>
  );
}

function SensitivityStep({
  value,
  onChange,
  onNext,
  onSkip,
}: StepProps<CaffeineSensitivity>) {
  const handleSelect = (sensitivity: CaffeineSensitivity) => {
    onChange(sensitivity);
    onNext();
  };

  const options: { key: CaffeineSensitivity; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "medium", label: "Normal", icon: "coffee" },
    { key: "low", label: "Low", icon: "coffee" },
    { key: "high", label: "High", icon: "alert-circle" },
  ];

  return (
    <StepContainer
      icon="zap"
      title="Caffeine Sensitivity"
      onSkip={onSkip}
    >
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <OptionButton
            key={option.key}
            label={option.label}
            icon={option.icon}
            isSelected={value === option.key}
            onPress={() => handleSelect(option.key)}
          />
        ))}
      </View>
    </StepContainer>
  );
}

function AlcoholStep({
  value,
  onChange,
  onNext,
  onSkip,
}: StepProps<AlcoholIntake>) {
  const handleSelect = (alcoholIntake: AlcoholIntake) => {
    onChange(alcoholIntake);
    onNext();
  };

  const options: { key: AlcoholIntake; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "rare", label: "Never", icon: "check-circle" },
    { key: "sometimes", label: "Sometimes", icon: "clock" },
    { key: "daily", label: "Daily", icon: "repeat" },
  ];

  return (
    <StepContainer
      icon="droplet"
      title="Alcohol Intake"
      onSkip={onSkip}
    >
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <OptionButton
            key={option.key}
            label={option.label}
            icon={option.icon}
            isSelected={value === option.key}
            onPress={() => handleSelect(option.key)}
          />
        ))}
      </View>
    </StepContainer>
  );
}

function MedicationsStep({
  value,
  onChange,
  onNext,
  onSkip,
}: StepProps<Medication[]>) {
  const handleSelect = (medication: Medication) => {
    onChange([medication]);
    onNext();
  };

  const options: { key: Medication; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "none", label: "None / Skip", icon: "check" },
    { key: "anxiety_panic", label: "Anxiety / Panic issues", icon: "heart" },
    { key: "adhd_medication", label: "ADHD (focus medications)", icon: "zap" },
    { key: "insomnia_medication", label: "Sleep issues / Insomnia medication", icon: "moon" },
    { key: "acid_reflux", label: "Acid reflux / Stomach problems", icon: "thermometer" },
    { key: "high_blood_pressure", label: "High blood pressure", icon: "activity" },
    { key: "depression_treatment", label: "Depression treatment", icon: "shield" },
  ];

  return (
    <StepContainer
      icon="thermometer"
      title="Medications"
      onSkip={onSkip}
    >
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <OptionButton
            key={option.key}
            label={option.label}
            icon={option.icon}
            isSelected={value?.includes(option.key) ?? false}
            onPress={() => handleSelect(option.key)}
          />
        ))}
      </View>
    </StepContainer>
  );
}

interface ScheduleStepProps {
  wakeTime: string | undefined;
  sleepTime: string | undefined;
  onWakeTimeChange: (value: string) => void;
  onSleepTimeChange: (value: string) => void;
  onFinish: (wakeTime: string, sleepTime: string) => void;
  data: OnboardingData;
}

function ScheduleStep({
  wakeTime,
  sleepTime,
  onWakeTimeChange,
  onSleepTimeChange,
  onFinish,
  data,
}: ScheduleStepProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [localWakeTime, setLocalWakeTime] = useState(wakeTime || "07:00");
  const [localSleepTime, setLocalSleepTime] = useState(sleepTime || "23:00");
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);

  const parseTime = (timeStr: string) => {
    const [hourStr, minuteStr] = timeStr.split(":");
    const hours = parseInt(hourStr);
    const minutes = parseInt(minuteStr) || 0;
    return { hours, minutes };
  };

  const formatTime = (time: string) => {
    const { hours, minutes } = parseTime(time);
    const period = hours >= 12 ? "PM" : "AM";
    let hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const onWakePickerConfirm = useCallback(
    ({ hours, minutes }: { hours: number; minutes: number }) => {
      setShowWakePicker(false);
      const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      setLocalWakeTime(timeStr);
    },
    []
  );

  const onSleepPickerConfirm = useCallback(
    ({ hours, minutes }: { hours: number; minutes: number }) => {
      setShowSleepPicker(false);
      const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      setLocalSleepTime(timeStr);
    },
    []
  );

  const handleConfirm = () => {
    onWakeTimeChange(localWakeTime);
    onSleepTimeChange(localSleepTime);
    onFinish(localWakeTime, localSleepTime);
  };

  const wakeTimeParsed = parseTime(localWakeTime);
  const sleepTimeParsed = parseTime(localSleepTime);

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${Colors.light.accent}20` },
          ]}
        >
          <Feather name="clock" size={32} color={Colors.light.accent} />
        </View>
        <ThemedText type="h2" style={styles.stepTitle}>
          Your Sleep Schedule
        </ThemedText>
      </View>

      <View style={styles.stepContent}>
        <ThemedText type="body" muted style={styles.scheduleSubtitle}>
          This helps us calculate when to stop caffeine
        </ThemedText>

        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleItem}>
            <Feather name="sun" size={24} color={Colors.light.accent} />
            <ThemedText type="body" style={styles.scheduleLabel}>
              Wake up
            </ThemedText>
            <Pressable
              onPress={() => setShowWakePicker(true)}
              style={[styles.timePickerButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="clock" size={20} color={Colors.light.accent} />
              <ThemedText type="h3" style={styles.timeValue}>
                {formatTime(localWakeTime)}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textMuted} />
            </Pressable>
          </View>

          <View style={styles.scheduleItem}>
            <Feather name="moon" size={24} color={Colors.light.accent} />
            <ThemedText type="body" style={styles.scheduleLabel}>
              Bedtime
            </ThemedText>
            <Pressable
              onPress={() => setShowSleepPicker(true)}
              style={[styles.timePickerButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="clock" size={20} color={Colors.light.accent} />
              <ThemedText type="h3" style={styles.timeValue}>
                {formatTime(localSleepTime)}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>

        <ThemedText type="caption" muted style={styles.scheduleNote}>
          Tap a time to change it
        </ThemedText>
      </View>

      <View style={[styles.requiredButtonContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <ContinueButton onPress={handleConfirm} />
      </View>

      <TimePickerModal
        visible={showWakePicker}
        onDismiss={() => setShowWakePicker(false)}
        onConfirm={onWakePickerConfirm}
        hours={wakeTimeParsed.hours}
        minutes={wakeTimeParsed.minutes}
        label="Wake Up Time"
        locale="en"
      />

      <TimePickerModal
        visible={showSleepPicker}
        onDismiss={() => setShowSleepPicker(false)}
        onConfirm={onSleepPickerConfirm}
        hours={sleepTimeParsed.hours}
        minutes={sleepTimeParsed.minutes}
        label="Bedtime"
        locale="en"
      />
    </View>
  );
}

interface SummaryStepProps {
  data: OnboardingData;
  onFinish: () => void;
}

function SummaryStep({ data, onFinish }: SummaryStepProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { optimal, safe } = calculateOptimalCaffeine(data);

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryIconContainer}>
        <View
          style={[
            styles.summaryIconCircle,
            { backgroundColor: `${Colors.light.accent}20` },
          ]}
        >
          <Feather name="check-circle" size={48} color={Colors.light.accent} />
        </View>
      </View>

      <ThemedText type="h2" style={styles.summaryTitle}>
        Your Caffeine Profile
      </ThemedText>

      <View style={styles.resultsContainer}>
        <ThemedView elevation={1} style={styles.resultCard}>
          <ThemedText type="caption" muted style={styles.resultLabel}>
            Optimal Daily Limit
          </ThemedText>
          <ThemedText type="h1" style={[styles.resultValue, { color: Colors.light.accent }]}>
            {optimal}
            <ThemedText type="body" style={{ color: Colors.light.accent }}> mg</ThemedText>
          </ThemedText>
        </ThemedView>

        <ThemedView elevation={1} style={styles.resultCard}>
          <ThemedText type="caption" muted style={styles.resultLabel}>
            Safe Maximum
          </ThemedText>
          <ThemedText type="h1" style={styles.resultValue}>
            {safe}
            <ThemedText type="body" muted> mg</ThemedText>
          </ThemedText>
        </ThemedView>
      </View>

      <View style={[styles.finishButtonContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={onFinish}
          style={[styles.finishButton, { backgroundColor: Colors.light.accent }]}
        >
          <ThemedText type="body" style={styles.finishButtonText}>
            Get Started
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

interface StepContainerProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  onSkip: () => void;
  children: React.ReactNode;
}

function StepContainer({ icon, title, onSkip, children }: StepContainerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${Colors.light.accent}20` },
          ]}
        >
          <Feather name={icon} size={32} color={Colors.light.accent} />
        </View>
        <ThemedText type="h2" style={styles.stepTitle}>
          {title}
        </ThemedText>
      </View>

      <View style={styles.stepContent}>{children}</View>

      <View style={[styles.skipContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable onPress={onSkip} style={styles.skipButton}>
          <ThemedText type="body" muted style={styles.skipText}>
            Skip
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

interface OptionButtonProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  isSelected: boolean;
  onPress: () => void;
}

function OptionButton({ label, icon, isSelected, onPress }: OptionButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.optionButton,
        {
          backgroundColor: isSelected
            ? Colors.light.accent
            : theme.backgroundDefault,
          borderColor: isSelected ? Colors.light.accent : theme.backgroundSecondary,
        },
        animatedStyle,
      ]}
    >
      <Feather
        name={icon}
        size={20}
        color={isSelected ? "#FFFFFF" : theme.text}
      />
      <ThemedText
        type="body"
        style={[
          styles.optionLabel,
          { color: isSelected ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

interface SliderButtonProps {
  icon: "plus" | "minus";
  onPress: () => void;
}

function SliderButton({ icon, onPress }: SliderButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.sliderButton,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <Feather name={icon} size={24} color={Colors.light.accent} />
    </AnimatedPressable>
  );
}

interface ContinueButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

function ContinueButton({ onPress, disabled = false }: ContinueButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => {
        if (!disabled) {
          scale.value = withSpring(0.97);
        }
      }}
      onPressOut={() => {
        if (!disabled) {
          scale.value = withSpring(1);
        }
      }}
      style={[
        styles.continueButton,
        { backgroundColor: disabled ? Colors.light.textMuted : Colors.light.accent },
        animatedStyle,
      ]}
    >
      <ThemedText type="body" style={styles.continueButtonText}>
        Continue
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  stepHeader: {
    alignItems: "center",
    paddingTop: Spacing["3xl"],
    paddingBottom: Spacing["2xl"],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    textAlign: "center",
  },
  stepContent: {
    flex: 1,
  },
  skipContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  skipText: {
    fontWeight: "500",
  },
  sliderContainer: {
    alignItems: "center",
    paddingTop: Spacing["2xl"],
  },
  valueDisplay: {
    fontSize: 64,
    fontWeight: "700",
  },
  valueLabel: {
    marginTop: Spacing.xs,
    marginBottom: Spacing["2xl"],
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: Spacing.md,
  },
  sliderButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.divider,
    borderRadius: 4,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 4,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 56,
    marginTop: Spacing.sm,
  },
  optionsContainer: {
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.md,
  },
  optionLabel: {
    fontWeight: "500",
  },
  continueButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  summaryContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  summaryIconContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  summaryIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  resultsContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing["3xl"],
  },
  resultCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  resultLabel: {
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultValue: {
    fontWeight: "700",
  },
  finishButtonContainer: {
    paddingTop: Spacing.xl,
  },
  finishButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  finishButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  inputContainer: {
    paddingTop: Spacing.lg,
  },
  inputLabel: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  textInputWrapper: {
    flex: 1,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  scheduleSubtitle: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  scheduleContainer: {
    gap: Spacing.xl,
  },
  scheduleItem: {
    alignItems: "center",
    gap: Spacing.md,
  },
  scheduleLabel: {
    fontWeight: "500",
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  timeValue: {
    minWidth: 120,
    textAlign: "center",
  },
  scheduleNote: {
    textAlign: "center",
    marginTop: Spacing["2xl"],
  },
  requiredButtonContainer: {
    paddingTop: Spacing.xl,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    minWidth: 180,
    justifyContent: "center",
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerModalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing["3xl"],
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  pickerTitle: {
    fontWeight: "600",
  },
  pickerDoneButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  timePicker: {
    height: 200,
  },
  timePickerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  timePickerColumn: {
    alignItems: "center",
    flex: 1,
  },
  timePickerLabel: {
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timePickerScroll: {
    maxHeight: 180,
  },
  timePickerItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginVertical: 2,
    minWidth: 60,
    alignItems: "center",
  },
  timePickerItemText: {
    fontWeight: "500",
  },
  periodContainer: {
    gap: Spacing.sm,
  },
  periodButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
    minWidth: 70,
    alignItems: "center",
  },
  periodButtonText: {
    fontWeight: "600",
  },
  previewContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    marginTop: Spacing.md,
  },
});
