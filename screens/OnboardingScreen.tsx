import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  | "name"
  | "age"
  | "weight"
  | "sensitivity"
  | "alcohol"
  | "medications"
  | "schedule"
  | "summary";

const STEPS: OnboardingStep[] = [
  "name",
  "age",
  "weight",
  "sensitivity",
  "alcohol",
  "medications",
  "schedule",
  "summary",
];

interface OnboardingData {
  name?: string;
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
      animateToStep(currentStep - 1);
    }
  }, [currentStep, animateToStep]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleFinish = useCallback(() => {
    const calculationInputs = {
      ageRange: data.ageRange,
      weight: data.weight,
      caffeineSensitivity: data.caffeineSensitivity,
      alcoholIntake: data.alcoholIntake,
      medications: data.medications,
    };

    const { optimal, safe } = calculateOptimalCaffeine(calculationInputs);

    updateProfile({
      name: data.name || "",
      ageRange: data.ageRange,
      weight: data.weight,
      isPregnant: false,
      hasHeartCondition: false,
      caffeineSensitivity: data.caffeineSensitivity,
      alcoholIntake: data.alcoholIntake,
      medications: data.medications,
      wakeTime: data.wakeTime || "07:00",
      sleepTime: data.sleepTime || "23:00",
      optimalCaffeine: optimal,
      safeCaffeine: safe,
      dailyLimit: optimal,
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
      case "name":
        return (
          <NameStep
            value={data.name}
            onChange={(v) => updateData("name", v)}
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
            onNext={handleNext}
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

function NameStep({ value, onChange, onNext, onSkip }: StepProps<string>) {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(value || "");

  const handleConfirm = () => {
    onChange(localValue);
    onNext();
  };

  return (
    <StepContainer icon="user" title="What's your name?" onSkip={onSkip}>
      <View style={styles.inputContainer}>
        <ThemedText type="body" muted style={styles.inputLabel}>
          We'll use this to personalize your experience
        </ThemedText>
        <View
          style={[
            styles.textInputContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="user" size={20} color={theme.textMuted} />
          <View style={styles.textInputWrapper}>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={localValue}
              onChangeText={setLocalValue}
              placeholder="Enter your name"
              placeholderTextColor={theme.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
          </View>
        </View>
      </View>
      <ContinueButton onPress={handleConfirm} disabled={!localValue.trim()} />
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
    { key: "low", label: "Low", icon: "coffee" },
    { key: "medium", label: "Normal", icon: "coffee" },
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
    { key: "anxiety_panic", label: "Anxiety / Panic issues", icon: "heart" },
    { key: "adhd_medication", label: "ADHD (focus medications)", icon: "zap" },
    { key: "insomnia_medication", label: "Sleep issues / Insomnia medication", icon: "moon" },
    { key: "acid_reflux", label: "Acid reflux / Stomach problems", icon: "thermometer" },
    { key: "high_blood_pressure", label: "High blood pressure", icon: "activity" },
    { key: "depression_treatment", label: "Depression treatment", icon: "shield" },
    { key: "none", label: "None / Skip", icon: "check" },
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

interface ScheduleStepProps {
  wakeTime: string | undefined;
  sleepTime: string | undefined;
  onWakeTimeChange: (value: string) => void;
  onSleepTimeChange: (value: string) => void;
  onNext: () => void;
}

function ScheduleStep({
  wakeTime,
  sleepTime,
  onWakeTimeChange,
  onSleepTimeChange,
  onNext,
}: ScheduleStepProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [localWakeTime, setLocalWakeTime] = useState(wakeTime || "07:00");
  const [localSleepTime, setLocalSleepTime] = useState(sleepTime || "23:00");
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);

  const timeStringToDate = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const dateToTimeString = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatTime = (time: string) => {
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr);
    const minute = minuteStr || "00";
    if (hour === 0) return `12:${minute} AM`;
    if (hour === 12) return `12:${minute} PM`;
    if (hour > 12) return `${hour - 12}:${minute} PM`;
    return `${hour}:${minute} AM`;
  };

  const handleWakeTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowWakePicker(false);
    }
    if (selectedDate) {
      setLocalWakeTime(dateToTimeString(selectedDate));
    }
  };

  const handleSleepTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowSleepPicker(false);
    }
    if (selectedDate) {
      setLocalSleepTime(dateToTimeString(selectedDate));
    }
  };

  const handleConfirm = () => {
    onWakeTimeChange(localWakeTime);
    onSleepTimeChange(localSleepTime);
    onNext();
  };

  const renderTimePicker = (
    isWake: boolean,
    show: boolean,
    setShow: (show: boolean) => void,
    value: string,
    onChange: (event: any, date?: Date) => void
  ) => {
    if (!show) return null;

    if (Platform.OS === "ios") {
      return (
        <Modal
          transparent
          animationType="slide"
          visible={show}
          onRequestClose={() => setShow(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={[styles.pickerModalContent, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.pickerHeader}>
                <ThemedText type="h3" style={styles.pickerTitle}>
                  {isWake ? "Wake Up Time" : "Bedtime"}
                </ThemedText>
                <Pressable
                  onPress={() => setShow(false)}
                  style={styles.pickerDoneButton}
                >
                  <ThemedText type="body" style={{ color: Colors.light.accent, fontWeight: "600" }}>
                    Done
                  </ThemedText>
                </Pressable>
              </View>
              <DateTimePicker
                value={timeStringToDate(value)}
                mode="time"
                display="spinner"
                onChange={onChange}
                style={styles.timePicker}
                textColor={theme.text}
              />
            </View>
          </View>
        </Modal>
      );
    }

    return (
      <DateTimePicker
        value={timeStringToDate(value)}
        mode="time"
        is24Hour={false}
        display="default"
        onChange={onChange}
      />
    );
  };

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

      {renderTimePicker(true, showWakePicker, setShowWakePicker, localWakeTime, handleWakeTimeChange)}
      {renderTimePicker(false, showSleepPicker, setShowSleepPicker, localSleepTime, handleSleepTimeChange)}
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
});
