import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { DrinkTimelineItem } from "@/components/DrinkTimelineItem";
import { CaffeineChart } from "@/components/CaffeineChart";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TimeRange = "day" | "week";

export default function HistoryScreen() {
  const { theme } = useTheme();
  const { entries, getEntriesForDateRange, deleteEntry, profile } =
    useCaffeineStore();
  const [timeRange, setTimeRange] = useState<TimeRange>("day");

  const { filteredEntries, dateLabel, stats } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let label: string;

    if (timeRange === "day") {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      label = "Today";
    } else {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      label = "Last 7 Days";
    }

    const filtered = getEntriesForDateRange(startDate, now);
    const totalCaffeine = filtered.reduce((sum, e) => sum + e.caffeineAmount, 0);
    const avgPerDay =
      timeRange === "week" ? Math.round(totalCaffeine / 7) : totalCaffeine;
    const drinkCount = filtered.length;

    return {
      filteredEntries: filtered,
      dateLabel: label,
      stats: {
        total: totalCaffeine,
        average: avgPerDay,
        drinks: drinkCount,
      },
    };
  }, [timeRange, entries, getEntriesForDateRange]);

  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: typeof filteredEntries } = {};

    filteredEntries.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const key = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });

    return Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].timestamp);
      const dateB = new Date(b[1][0].timestamp);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredEntries]);

  return (
    <ScreenScrollView>
      <View style={styles.toggleRow}>
        <ToggleButton
          label="Day"
          isActive={timeRange === "day"}
          onPress={() => setTimeRange("day")}
        />
        <ToggleButton
          label="Week"
          isActive={timeRange === "week"}
          onPress={() => setTimeRange("week")}
        />
      </View>

      <ThemedView elevation={1} style={styles.statsCard}>
        <ThemedText type="small" muted>
          {dateLabel}
        </ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: Colors.light.accent }}>
              {stats.total}
            </ThemedText>
            <ThemedText type="caption" muted>
              mg total
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: Colors.light.accent }}>
              {stats.average}
            </ThemedText>
            <ThemedText type="caption" muted>
              mg/day avg
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: Colors.light.accent }}>
              {stats.drinks}
            </ThemedText>
            <ThemedText type="caption" muted>
              drinks
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView elevation={1} style={styles.chartCard}>
        <ThemedText type="small" style={styles.chartTitle}>
          Caffeine Intake
        </ThemedText>
        <CaffeineChart
          entries={filteredEntries}
          timeRange={timeRange}
          dailyLimit={profile.dailyLimit}
        />
      </ThemedView>

      <View style={styles.entriesSection}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Drink Log
        </ThemedText>
        {groupedEntries.length === 0 ? (
          <ThemedView elevation={1} style={styles.emptyState}>
            <Feather name="inbox" size={32} color={theme.textMuted} />
            <ThemedText muted style={styles.emptyText}>
              No drinks recorded for this period
            </ThemedText>
          </ThemedView>
        ) : (
          groupedEntries.map(([dateKey, dayEntries]) => (
            <View key={dateKey} style={styles.dayGroup}>
              {timeRange === "week" && (
                <ThemedText type="small" muted style={styles.dayLabel}>
                  {dateKey}
                </ThemedText>
              )}
              {dayEntries.map((entry) => (
                <DrinkTimelineItem
                  key={entry.id}
                  entry={entry}
                  onDelete={() => deleteEntry(entry.id)}
                  showDate={timeRange === "week"}
                />
              ))}
            </View>
          ))
        )}
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
            : theme.backgroundDefault,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="small"
        style={[
          styles.toggleLabel,
          { color: isActive ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  toggleLabel: {
    fontWeight: "600",
  },
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.divider,
  },
  chartCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  chartTitle: {
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  entriesSection: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  dayGroup: {
    marginBottom: Spacing.md,
  },
  dayLabel: {
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emptyText: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
