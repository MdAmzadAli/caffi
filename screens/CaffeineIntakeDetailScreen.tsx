import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type TimePeriod = "week" | "month" | "year";

interface BarData {
  label: string;
  value: number;
  animValue: Animated.Value;
}

export default function CaffeineIntakeDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { entries } = useCaffeineStore();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("week");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const mainScrollRef = useRef<ScrollView>(null);
  const CHART_HEIGHT = Dimensions.get("window").height * 0.25;

  const getWeekRange = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);
    return { start: sunday, end: saturday };
  };

  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const getYearRange = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const getDateRangeLabel = () => {
    if (selectedPeriod === "week") {
      const { start, end } = getWeekRange(selectedDate);
      const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${startLabel} - ${endLabel}`;
    } else if (selectedPeriod === "month") {
      return selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      return selectedDate.getFullYear().toString();
    }
  };

  const navigatePeriod = (direction: number) => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === "week") {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else if (selectedPeriod === "month") {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setSelectedDate(newDate);
  };

  const { chartData, average } = useMemo(() => {
    const data: BarData[] = [];

    if (selectedPeriod === "week") {
      const { start } = getWeekRange(selectedDate);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const value = entries
          .filter((e) => {
            const t = new Date(e.timestamp);
            return t >= dayStart && t <= dayEnd;
          })
          .reduce((sum, e) => sum + e.caffeineAmount, 0);

        data.push({ label: days[i], value, animValue: new Animated.Value(0) });
      }
    } else if (selectedPeriod === "month") {
      const { start, end } = getMonthRange(selectedDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const numWeeks = Math.ceil(totalDays / 7);

      for (let i = 0; i < numWeeks; i++) {
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        if (weekEnd > end) weekEnd.setTime(end.getTime());

        const value = entries
          .filter((e) => {
            const t = new Date(e.timestamp);
            return t >= weekStart && t <= weekEnd;
          })
          .reduce((sum, e) => sum + e.caffeineAmount, 0);

        const startDay = weekStart.getDate();
        const endDay = weekEnd.getDate();
        data.push({ label: `${startDay}-${endDay}`, value, animValue: new Animated.Value(0) });
      }
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const year = selectedDate.getFullYear();

      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(year, i, 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(year, i + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const value = entries
          .filter((e) => {
            const t = new Date(e.timestamp);
            return t >= monthStart && t <= monthEnd;
          })
          .reduce((sum, e) => sum + e.caffeineAmount, 0);

        data.push({ label: months[i], value, animValue: new Animated.Value(0) });
      }
    }

    const totalValue = data.reduce((sum, d) => sum + d.value, 0);
    let avg = 0;

    if (selectedPeriod === "week") {
      avg = data.length > 0 ? Math.round(totalValue / data.length) : 0;
    } else if (selectedPeriod === "month") {
      const { start, end } = getMonthRange(selectedDate);
      const daysInMonth = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      avg = Math.round(totalValue / daysInMonth);
    } else {
      avg = Math.round(totalValue / 365);
    }

    return { chartData: data, average: avg };
  }, [entries, selectedPeriod, selectedDate]);

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  useEffect(() => {
    chartData.forEach((bar, index) => {
      Animated.timing(bar.animValue, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: false,
      }).start();
    });
  }, [chartData]);

  const getAverageLabel = () => {
    switch (selectedPeriod) {
      case "week": return "Weekly average";
      case "month": return "Monthly average";
      case "year": return "Yearly average";
    }
  };

  const screenWidth = Dimensions.get("window").width;
  const barWidth = (screenWidth - Spacing.lg * 2 - Spacing.sm * 2) / chartData.length - 8;

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Analytics</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={mainScrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.text }]}>Caffeine intake</Text>
          <Text style={[styles.description, { color: theme.mutedGrey }]}>
            Track your caffeine consumption patterns over time. View weekly, monthly, or yearly trends to understand your intake habits.
          </Text>
        </View>

        <View style={styles.periodSelector}>
          {(["week", "month", "year"] as TimePeriod[]).map((period) => (
            <Pressable
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && {
                  backgroundColor: theme.accentGold,
                },
                selectedPeriod !== period && {
                  backgroundColor: theme.backgroundSecondary,
                },
              ]}
              onPress={() => {
                setSelectedPeriod(period);
                setSelectedDate(new Date());
              }}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: selectedPeriod === period ? "#FFFFFF" : theme.text,
                  },
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.dateSelector, { backgroundColor: theme.backgroundSecondary }]}>
          <Pressable onPress={() => navigatePeriod(-1)} hitSlop={12}>
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <Text style={[styles.dateLabel, { color: theme.text }]}>
            {getDateRangeLabel()}
          </Text>
          <Pressable onPress={() => navigatePeriod(1)} hitSlop={12}>
            <Feather name="chevron-right" size={20} color={theme.text} />
          </Pressable>
        </View>

        <View style={[styles.chartSection, { height: CHART_HEIGHT }]}>
          <View style={styles.chartContent}>
            {chartData.map((item, idx) => {
              const animatedHeight = item.animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max((item.value / maxValue) * (CHART_HEIGHT - 50), 4)],
              });

              return (
                <View key={idx} style={[styles.barColumn, { width: barWidth }]}>
                  <View style={styles.barWrapper}>
                    {item.value > 0 ? (
                      <>
                        <Animated.Text style={[styles.barLabel, { color: theme.text, opacity: item.animValue }]}>
                          {item.value}
                        </Animated.Text>
                        <Animated.View
                          style={[
                            styles.bar,
                            {
                              height: animatedHeight,
                              backgroundColor: theme.accentGold,
                            },
                          ]}
                        />
                      </>
                    ) : (
                      <Animated.View
                        style={[
                          styles.barEmpty,
                          { backgroundColor: theme.divider, opacity: item.animValue },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.xAxisLabel, { color: theme.mutedGrey }]}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.averageSection}>
          <Text style={[styles.averageValue, { color: theme.text }]}>{average} mg</Text>
          <Text style={[styles.averageLabel, { color: theme.mutedGrey }]}>{getAverageLabel()}</Text>
        </View>
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
  titleSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  periodSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  periodButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    width: "48%",
    // alignSelf: "left",
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  chartSection: {
    marginBottom: Spacing["3xl"],
  },
  chartContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: "100%",
    paddingHorizontal: Spacing.sm,
  },
  barColumn: {
    alignItems: "center",
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  bar: {
    width: "80%",
    borderRadius: 4,
    minHeight: 4,
  },
  barEmpty: {
    width: "80%",
    height: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  xAxisLabel: {
    fontSize: 10,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  averageSection: {
    alignItems: "flex-start",
  },
  averageValue: {
    fontSize: 40,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  averageLabel: {
    fontSize: 14,
  },
});