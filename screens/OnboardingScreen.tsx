import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
} from "react-native";
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
  Gender,
  CaffeineSensitivity,
  SleepGoal,
  AlcoholIntake,
  Medication,
} from "@/store/caffeineStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type OnboardingStep =
  | "age"
  | "weight"
  | "gender"
  | "sensitivity"
  | "sleep"
  | "alcohol"
  | "medications"
  | "summary";

const STEPS: OnboardingStep[] = [
  "age",
  "weight",
  "gender",
  "sensitivity",
  "sleep",
  "alcohol",
  "medications",
  "summary",
];

interface OnboardingData {
  age?: number;
  weight?: number;
  gender?: Gender;
  caffeineSensitivity?: CaffeineSensitivity;
  sleepGoal?: SleepGoal;
  alcoholIntake?: AlcoholIntake;
  medications?: Medication[];
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
      animateToStep(currentStep - 1);
    }
  }, [currentStep, animateToStep]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleFinish = useCallback(() => {
    const calculationInputs = {
      age: data.age,
      weight: data.weight,
      gender: data.gender,
      caffeineSensitivity: data.caffeineSensitivity,
      sleepGoal: data.sleepGoal,
      alcoholIntake: data.alcoholIntake,
      medications: data.medications,
    };

    const { optimal, safe } = calculateOptimalCaffeine(calculationInputs);

    updateProfile({
      age: data.age,
      weight: data.weight,
      gender: data.gender,
      caffeineSensitivity: data.caffeineSensitivity,
      sleepGoal: data.sleepGoal,
      alcoholIntake: data.alcoholIntake,
      medications: data.medications,
      optimalCaffeine: optimal,
      safeCaffeine: safe,
      dailyLimit: safe,
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
      case "age":
        return (
          <AgeStep
            value={data.age}
            onChange={(v) => updateData("age", v)}
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
      case "gender":
        return (
          <GenderStep
            value={data.gender}
            onChange={(v) => updateData("gender", v)}
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
      case "sleep":
        return (
          <SleepStep
            value={data.sleepGoal}
            onChange={(v) => updateData("sleepGoal", v)}
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
      case "summary":
        return <SummaryStep data={data} onFinish={handleFinish} />;
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

function AgeStep({ value, onChange, onNext, onSkip }: StepProps<number>) {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(value || 30);

  const handleConfirm = () => {
    onChange(localValue);
    onNext();
  };

  return (
    <StepContainer
      icon="user"
      title="Your Age"
      onSkip={onSkip}
    >
      <View style={styles.sliderContainer}>
        <ThemedText type="h1" style={styles.valueDisplay}>
          {localValue}
        </ThemedText>
        <ThemedText type="caption" muted style={styles.valueLabel}>
          years old
        </ThemedText>

        <View style={styles.sliderRow}>
          <SliderButton
            icon="minus"
            onPress={() => setLocalValue((v) => Math.max(13, v - 1))}
          />
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                {
                  width: `${((localValue - 13) / (80 - 13)) * 100}%`,
                  backgroundColor: Colors.light.accent,
                },
              ]}
            />
          </View>
          <SliderButton
            icon="plus"
            onPress={() => setLocalValue((v) => Math.min(80, v + 1))}
          />
        </View>

        <View style={styles.rangeLabels}>
          <ThemedText type="caption" muted>13</ThemedText>
          <ThemedText type="caption" muted>80</ThemedText>
        </View>
      </View>

      <ContinueButton onPress={handleConfirm} />
    </StepContainer>
  );
}

function WeightStep({ value, onChange, onNext, onSkip }: StepProps<number>) {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(value || 70);

  const handleConfirm = () => {
    onChange(localValue);
    onNext();
  };

  return (
    <StepContainer
      icon="activity"
      title="Your Weight"
      onSkip={onSkip}
    >
      <View style={styles.sliderContainer}>
        <ThemedText type="h1" style={styles.valueDisplay}>
          {localValue}
        </ThemedText>
        <ThemedText type="caption" muted style={styles.valueLabel}>
          kg
        </ThemedText>

        <View style={styles.sliderRow}>
          <SliderButton
            icon="minus"
            onPress={() => setLocalValue((v) => Math.max(30, v - 1))}
          />
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                {
                  width: `${((localValue - 30) / (150 - 30)) * 100}%`,
                  backgroundColor: Colors.light.accent,
                },
              ]}
            />
          </View>
          <SliderButton
            icon="plus"
            onPress={() => setLocalValue((v) => Math.min(150, v + 1))}
          />
        </View>

        <View style={styles.rangeLabels}>
          <ThemedText type="caption" muted>30 kg</ThemedText>
          <ThemedText type="caption" muted>150 kg</ThemedText>
        </View>
      </View>

      <ContinueButton onPress={handleConfirm} />
    </StepContainer>
  );
}

function GenderStep({ value, onChange, onNext, onSkip }: StepProps<Gender>) {
  const handleSelect = (gender: Gender) => {
    onChange(gender);
    onNext();
  };

  const options: { key: Gender; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "male", label: "Male", icon: "user" },
    { key: "female", label: "Female", icon: "user" },
    { key: "other", label: "Other", icon: "users" },
    { key: "prefer_not_to_say", label: "Prefer not to say", icon: "user-x" },
  ];

  return (
    <StepContainer
      icon="users"
      title="Gender"
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
    { key: "low", label: "Low", icon: "coffee" },
    { key: "medium", label: "Medium", icon: "coffee" },
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

function SleepStep({ value, onChange, onNext, onSkip }: StepProps<SleepGoal>) {
  const handleSelect = (sleepGoal: SleepGoal) => {
    onChange(sleepGoal);
    onNext();
  };

  const options: { key: SleepGoal; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "good_sleep", label: "Good Sleep", icon: "moon" },
    { key: "normal_sleep", label: "Normal Sleep", icon: "sunset" },
    { key: "insomnia_prone", label: "Insomnia-Prone", icon: "alert-triangle" },
  ];

  return (
    <StepContainer
      icon="moon"
      title="Sleep Goal"
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
    { key: "rare", label: "Rare", icon: "check-circle" },
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
  const [selected, setSelected] = useState<Medication[]>(value || []);

  const handleToggle = (medication: Medication) => {
    if (medication === "none") {
      setSelected(["none"]);
    } else {
      setSelected((prev) => {
        const filtered = prev.filter((m) => m !== "none");
        if (filtered.includes(medication)) {
          return filtered.filter((m) => m !== medication);
        }
        return [...filtered, medication];
      });
    }
  };

  const handleConfirm = () => {
    onChange(selected.length > 0 ? selected : ["none"]);
    onNext();
  };

  const options: { key: Medication; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "anxiety_meds", label: "Anxiety meds", icon: "heart" },
    { key: "adhd_stimulants", label: "ADHD stimulants", icon: "zap" },
    { key: "ssris", label: "SSRIs", icon: "activity" },
    { key: "beta_blockers", label: "Beta-blockers", icon: "shield" },
    { key: "none", label: "None", icon: "check" },
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
            isSelected={selected.includes(option.key)}
            onPress={() => handleToggle(option.key)}
          />
        ))}
      </View>

      <ContinueButton onPress={handleConfirm} />
    </StepContainer>
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
}

function ContinueButton({ onPress }: ContinueButtonProps) {
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
        styles.continueButton,
        { backgroundColor: Colors.light.accent },
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
});
