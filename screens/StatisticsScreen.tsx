import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CaffeineDecayCurve } from "@/components/CaffeineDecayCurve";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function StatisticsScreen() {
  const { theme } = useTheme();
  const { getActiveCaffeine, getCaffeineAtTime, profile, entries } =
    useCaffeineStore();
  const [showHalfLife, setShowHalfLife] = useState(true);

  const activeCaffeine = getActiveCaffeine();

  const predictions = useMemo(() => {
    const now = new Date();
    const sleepHour = parseInt(profile.sleepTime.split(":")[0]);
    const sleepTime = new Date();
    sleepTime.setHours(sleepHour, 0, 0, 0);
    if (sleepTime <= now) {
      sleepTime.setDate(sleepTime.getDate() + 1);
    }

    const caffeineAtSleep = getCaffeineAtTime(sleepTime);

    let safeForSleepTime: Date | null = null;
    for (let h = 0; h < 24; h++) {
      const checkTime = new Date(now.getTime() + h * 60 * 60 * 1000);
      const caffeineAtCheck = getCaffeineAtTime(checkTime);
      if (caffeineAtCheck < 50) {
        safeForSleepTime = checkTime;
        break;
      }
    }

    let halfLifeTime: Date | null = null;
    const halfTarget = activeCaffeine / 2;
    for (let h = 0; h < 24; h += 0.5) {
      const checkTime = new Date(now.getTime() + h * 60 * 60 * 1000);
      const caffeineAtCheck = getCaffeineAtTime(checkTime);
      if (caffeineAtCheck <= halfTarget) {
        halfLifeTime = checkTime;
        break;
      }
    }

    return {
      caffeineAtSleep,
      safeForSleepTime,
      halfLifeTime,
    };
  }, [getCaffeineAtTime, activeCaffeine, profile.sleepTime]);

  const formatTime = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeDiff = (date: Date | null) => {
    if (!date) return "";
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `in ${diffHours}h ${diffMins}m`;
    }
    return `in ${diffMins}m`;
  };

  return (
    <ScreenScrollView header={<ScreenHeader title="Statistics" />}>
      <ThemedView elevation={1} style={styles.mainCard}>
        <View style={styles.currentCaffeine}>
          <ThemedText type="caption" muted>
            Active Caffeine
          </ThemedText>
          <ThemedText type="h1" style={{ color: Colors.light.accent }}>
            {activeCaffeine} mg
          </ThemedText>
          <ThemedText type="caption" muted>
            currently in your system
          </ThemedText>
        </View>

        <View style={styles.toggleContainer}>
          <ToggleButton
            label="Half-life"
            isActive={showHalfLife}
            onPress={() => setShowHalfLife(true)}
          />
          <ToggleButton
            label="Simplified"
            isActive={!showHalfLife}
            onPress={() => setShowHalfLife(false)}
          />
        </View>

        <CaffeineDecayCurve
          entries={entries}
          showHalfLife={showHalfLife}
          sleepTime={profile.sleepTime}
        />
      </ThemedView>

      <View style={styles.predictionsSection}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Predictions
        </ThemedText>

        <ThemedView elevation={1} style={styles.predictionCard}>
          <View style={styles.predictionRow}>
            <View style={styles.predictionIcon}>
              <Feather name="moon" size={20} color={Colors.light.accent} />
            </View>
            <View style={styles.predictionContent}>
              <ThemedText type="body" style={styles.predictionLabel}>
                At bedtime ({profile.sleepTime})
              </ThemedText>
              <ThemedText
                type="h4"
                style={{
                  color:
                    predictions.caffeineAtSleep < 50
                      ? Colors.light.success
                      : predictions.caffeineAtSleep < 100
                        ? Colors.light.warning
                        : Colors.light.danger,
                }}
              >
                {predictions.caffeineAtSleep} mg
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView elevation={1} style={styles.predictionCard}>
          <View style={styles.predictionRow}>
            <View style={styles.predictionIcon}>
              <Feather name="check-circle" size={20} color={Colors.light.success} />
            </View>
            <View style={styles.predictionContent}>
              <ThemedText type="body" style={styles.predictionLabel}>
                Safe for sleep
              </ThemedText>
              <ThemedText type="h4">{formatTime(predictions.safeForSleepTime)}</ThemedText>
              <ThemedText type="caption" muted>
                {getTimeDiff(predictions.safeForSleepTime)} (below 50mg)
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView elevation={1} style={styles.predictionCard}>
          <View style={styles.predictionRow}>
            <View style={styles.predictionIcon}>
              <Feather name="clock" size={20} color={Colors.light.warning} />
            </View>
            <View style={styles.predictionContent}>
              <ThemedText type="body" style={styles.predictionLabel}>
                Half-life reached
              </ThemedText>
              <ThemedText type="h4">{formatTime(predictions.halfLifeTime)}</ThemedText>
              <ThemedText type="caption" muted>
                {getTimeDiff(predictions.halfLifeTime)} ({Math.round(activeCaffeine / 2)}mg remaining)
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </View>

      <View style={styles.infoSection}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          About Caffeine Metabolism
        </ThemedText>
        <ThemedView elevation={1} style={styles.infoCard}>
          <ThemedText type="body" style={styles.infoText}>
            Caffeine has a half-life of about 5 hours, meaning half of the
            caffeine you consume is eliminated from your body every 5 hours.
          </ThemedText>
          <View style={styles.infoRow}>
            <Feather name="info" size={16} color={theme.textMuted} />
            <ThemedText type="small" muted style={styles.infoHint}>
              For optimal sleep, aim for less than 50mg in your system at
              bedtime.
            </ThemedText>
          </View>
        </ThemedView>
      </View>
    </ScreenScrollView>
  );
}

interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function ToggleButton({ label, isActive, onPress }: ToggleButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.toggleButton,
        {
          backgroundColor: isActive
            ? Colors.light.accent
            : theme.backgroundSecondary,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="small"
        style={[styles.toggleLabel, { color: isActive ? "#FFFFFF" : theme.text }]}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  currentCaffeine: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  toggleContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  toggleLabel: {
    fontWeight: "600",
  },
  predictionsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  predictionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  predictionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  predictionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  predictionContent: {
    flex: 1,
  },
  predictionLabel: {
    marginBottom: Spacing.xs,
  },
  infoSection: {
    marginBottom: Spacing["2xl"],
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  infoText: {
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  infoHint: {
    flex: 1,
  },
});
