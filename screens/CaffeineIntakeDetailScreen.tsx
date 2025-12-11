import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

type TimePeriod = "week" | "month" | "year";

interface BarData {
  label: string;
  value: number;
}

export default function CaffeineIntakeDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { entries } = useCaffeineStore();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("week");

  const { chartData, average } = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let data: BarData[] = [];

    const getDateLabel = (date: Date, period: TimePeriod): string => {
      if (period === "week") {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else if (period === "month") {
        const day = date.getDate();
        const month = date.toLocaleDateString("en-US", { month: "short" });
        return `${month} ${day}`;
      } else {
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      }
    };

    const getDayTotal = (date: Date): number => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      return entries
        .filter((e) => {
          const t = new Date(e.timestamp);
          return t >= startOfDay && t <= endOfDay;
        })
        .reduce((sum, e) => sum + e.caffeineAmount, 0);
    };

    const getWeekTotal = (endDate: Date): number => {
      const startOfWeek = new Date(endDate);
      startOfWeek.setDate(endDate.getDate() - 6);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(endDate);
      endOfWeek.setHours(23, 59, 59, 999);
      return entries
        .filter((e) => {
          const t = new Date(e.timestamp);
          return t >= startOfWeek && t <= endOfWeek;
        })
        .reduce((sum, e) => sum + e.caffeineAmount, 0);
    };

    const getMonthTotal = (date: Date): number => {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return entries
        .filter((e) => {
          const t = new Date(e.timestamp);
          return t >= startOfMonth && t <= endOfMonth;
        })
        .reduce((sum, e) => sum + e.caffeineAmount, 0);
    };

    if (selectedPeriod === "week") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        data.push({ label: getDateLabel(date, "week"), value: getDayTotal(date) });
      }
    } else if (selectedPeriod === "month") {
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - i * 7);
        data.push({ label: getDateLabel(weekEnd, "month"), value: getWeekTotal(weekEnd) });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        data.push({ label: getDateLabel(date, "year"), value: getMonthTotal(date) });
      }
    }

    const totalValue = data.reduce((sum, d) => sum + d.value, 0);
    const bucketCount = data.length;
    const avg = bucketCount > 0 ? Math.round(totalValue / bucketCount) : 0;

    return {
      chartData: data,
      average: avg,
    };
  }, [entries, selectedPeriod]);

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  const getAverageLabel = () => {
    switch (selectedPeriod) {
      case "week":
        return "Weekly average";
      case "month":
        return "Monthly average";
      case "year":
        return "Yearly average";
    }
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
        <View style={styles.headerTitleContainer}>
          <View style={[styles.logoIcon, { borderColor: theme.accentGold }]}>
            <View style={[styles.logoMoon, { backgroundColor: theme.accentGold }]} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Analytics</Text>
        </View>
      </View>

      <ScrollView
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
              onPress={() => setSelectedPeriod(period)}
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

        <View style={styles.chartSection}>
          <View style={styles.chartContainer}>
            <View style={[styles.gridLine, { borderTopColor: theme.divider }]} />
            <View style={[styles.gridLineMiddle, { borderTopColor: theme.divider }]} />
            <View style={[styles.gridLineBottom, { borderTopColor: theme.divider }]} />
            
            <View style={styles.barsContainer}>
              {chartData.map((item, idx) => (
                <View key={idx} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    {item.value > 0 && (
                      <>
                        <Text style={[styles.barLabel, { color: theme.text }]}>
                          {item.value}
                        </Text>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max((item.value / maxValue) * 140, 4),
                              backgroundColor: theme.accentGold,
                            },
                          ]}
                        />
                      </>
                    )}
                    {item.value === 0 && (
                      <View
                        style={[
                          styles.barEmpty,
                          { backgroundColor: theme.divider },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.xAxisLabel, { color: theme.mutedGrey }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 4,
  },
  logoMoon: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    marginBottom: Spacing.xl,
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
  chartSection: {
    marginBottom: Spacing["3xl"],
  },
  chartContainer: {
    flex: 1,
    height: 200,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  gridLineMiddle: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  gridLineBottom: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingBottom: 24,
    height: "100%",
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  bar: {
    width: 28,
    borderRadius: 4,
    minHeight: 4,
  },
  barEmpty: {
    width: 28,
    height: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  xAxisLabel: {
    fontSize: 11,
    marginTop: Spacing.sm,
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
