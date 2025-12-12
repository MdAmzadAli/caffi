import React, { useMemo, useState } from "react";
import { View, StyleSheet, Text, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type ViewMode = "Day" | "Month" | "Year";

interface TimePeriod {
  label: string;
  icon: string;
  startHour: number;
  endHour: number;
}

const TIME_PERIODS: TimePeriod[] = [
  { label: "5AM - 12PM", icon: "sunrise", startHour: 5, endHour: 12 },
  { label: "12PM - 3PM", icon: "sun", startHour: 12, endHour: 15 },
  { label: "3PM - 7PM", icon: "sunset", startHour: 15, endHour: 19 },
  { label: "7PM - 5AM", icon: "moon", startHour: 19, endHour: 5 },
];

export default function ConsumptionByTimeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { entries } = useCaffeineStore();
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isInTimePeriod = (hour: number, period: TimePeriod): boolean => {
    if (period.startHour < period.endHour) {
      return hour >= period.startHour && hour < period.endHour;
    } else {
      return hour >= period.startHour || hour < period.endHour;
    }
  };

  const getDateRange = useMemo(() => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (viewMode === "Day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "Month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }, [selectedDate, viewMode]);

  const periodData = useMemo(() => {
    const { start, end } = getDateRange;

    return TIME_PERIODS.map((period) => {
      const total = entries
        .filter((entry) => {
          const entryDate = new Date(entry.timestamp);
          return entryDate >= start && entryDate <= end;
        })
        .filter((entry) => {
          const hour = new Date(entry.timestamp).getHours();
          return isInTimePeriod(hour, period);
        })
        .reduce((sum, entry) => sum + entry.caffeineAmount, 0);

      return { ...period, total: Math.round(total) };
    });
  }, [entries, getDateRange]);

  const maxTotal = Math.max(...periodData.map((p) => p.total), 1);

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    if (viewMode === "Day") {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === "Month") {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setSelectedDate(newDate);
  };

  const getDateLabel = (): string => {
    if (viewMode === "Day") {
      return selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else if (viewMode === "Month") {
      return selectedDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else {
      return selectedDate.getFullYear().toString();
    }
  };

  const getIconComponent = (iconName: string) => {
    return <Feather name={iconName as any} size={18} color={theme.mutedGrey} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Analytic</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          Consumption by time of day
        </Text>
        <Text style={[styles.description, { color: theme.mutedGrey }]}>
          When do you consume caffeine throughout the day?
        </Text>

        <View style={styles.modeSelector}>
          {(["Day", "Month", "Year"] as ViewMode[]).map((mode) => (
            <Pressable
              key={mode}
              style={[
                styles.modeButton,
                viewMode === mode
                  ? { backgroundColor: theme.accentGold }
                  : { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: viewMode === mode ? "#FFFFFF" : theme.text },
                ]}
              >
                {mode}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.dateNavigator}>
          <Pressable onPress={() => navigateDate(-1)} hitSlop={12}>
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <Text style={[styles.dateLabel, { color: theme.text }]}>
            {getDateLabel()}
          </Text>
          <Pressable onPress={() => navigateDate(1)} hitSlop={12}>
            <Feather name="chevron-right" size={20} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.barsContainer}>
          {periodData.map((period, idx) => {
            const barWidth = period.total > 0 ? (period.total / maxTotal) * 100 : 0;
            const isFullBar = barWidth > 80;

            return (
              <View key={idx} style={styles.barRow}>
                <View
                  style={[
                    styles.barBackground,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: isFullBar ? theme.darkBrown : theme.accentGold,
                      },
                    ]}
                  />
                  <View style={styles.barContent}>
                    <View style={styles.barLabelContainer}>
                      {getIconComponent(period.icon)}
                      <Text
                        style={[
                          styles.barLabelText,
                          { color: isFullBar && barWidth > 50 ? "#FFFFFF" : theme.text },
                        ]}
                      >
                        {period.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.barValueText,
                        { color: isFullBar && barWidth > 90 ? "#FFFFFF" : theme.text },
                      ]}
                    >
                      {period.total} mg
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[styles.summaryText, { color: theme.mutedGrey }]}>
          Average amount of caffeine consumed per time period.
        </Text>
      </ScrollView>
    </View>
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
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  modeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  modeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dateNavigator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  barsContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  barRow: {
    width: "100%",
  },
  barBackground: {
    height: 56,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  barFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: BorderRadius.md,
  },
  barContent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  barLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  barLabelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  barValueText: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
