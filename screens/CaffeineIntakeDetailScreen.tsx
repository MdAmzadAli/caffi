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
  const [dateOffset, setDateOffset] = useState(0);

  const { chartData, dateRangeLabel, average } = useMemo(() => {
    const now = new Date();
    let data: BarData[] = [];
    let startDate: Date;
    let endDate: Date;
    let rangeLabel = "";

    if (selectedPeriod === "week") {
      const currentDay = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - currentDay + dateOffset * 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayTotal = entries
          .filter((e) => {
            const t = new Date(e.timestamp);
            return t >= date && t < nextDate;
          })
          .reduce((sum, e) => sum + e.caffeineAmount, 0);

        data.push({ label: days[date.getDay()], value: dayTotal });
      }

      const startMonth = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endMonth = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      rangeLabel = `${startMonth} - ${endMonth}`;
    } else if (selectedPeriod === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth() + dateOffset, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + dateOffset + 1, 0);
      endDate.setHours(23, 59, 59, 999);

      let currentWeekStart = new Date(startDate);
      currentWeekStart.setHours(0, 0, 0, 0);
      let weekNum = 1;
      
      while (currentWeekStart <= endDate) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        
        const effectiveEnd = weekEnd > endDate ? endDate : weekEnd;
        effectiveEnd.setHours(23, 59, 59, 999);

        const weekTotal = entries
          .filter((e) => {
            const t = new Date(e.timestamp);
            return t >= currentWeekStart && t <= effectiveEnd;
          })
          .reduce((sum, e) => sum + e.caffeineAmount, 0);

        data.push({ label: `W${weekNum}`, value: weekTotal });
        
        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNum++;
      }

      rangeLabel = startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      startDate = new Date(now.getFullYear() + dateOffset, 0, 1);
      endDate = new Date(now.getFullYear() + dateOffset, 11, 31);
      endDate.setHours(23, 59, 59, 999);

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(startDate.getFullYear(), month, 1);
        const monthEnd = new Date(startDate.getFullYear(), month + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthTotal = entries
          .filter((e) => {
            const t = new Date(e.timestamp);
            return t >= monthStart && t <= monthEnd;
          })
          .reduce((sum, e) => sum + e.caffeineAmount, 0);

        data.push({ label: months[month], value: monthTotal });
      }

      rangeLabel = startDate.getFullYear().toString();
    }

    const totalValue = data.reduce((sum, d) => sum + d.value, 0);
    const bucketCount = data.length;
    const avg = bucketCount > 0 ? Math.round(totalValue / bucketCount) : 0;

    return {
      chartData: data,
      dateRangeLabel: rangeLabel,
      average: avg,
    };
  }, [entries, selectedPeriod, dateOffset]);

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

  const handlePrevious = () => setDateOffset((prev) => prev - 1);
  const handleNext = () => setDateOffset((prev) => prev + 1);

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
              onPress={() => {
                setSelectedPeriod(period);
                setDateOffset(0);
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

        <View style={styles.dateNavigator}>
          <Pressable onPress={handlePrevious} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="chevron-left" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.dateRangeText, { color: theme.text }]}>{dateRangeLabel}</Text>
          <Pressable onPress={handleNext} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="chevron-right" size={24} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.chartSection}>
          <View style={styles.yAxisLabels}>
            <Text style={[styles.yAxisLabel, { color: theme.mutedGrey }]}>{Math.round(maxValue)}</Text>
            <Text style={[styles.yAxisLabel, { color: theme.mutedGrey }]}>{Math.round(maxValue / 2)}</Text>
            <Text style={[styles.yAxisLabel, { color: theme.mutedGrey }]}>0</Text>
          </View>
          
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
  dateNavigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  chartSection: {
    flexDirection: "row",
    marginBottom: Spacing["3xl"],
  },
  yAxisLabels: {
    width: 36,
    justifyContent: "space-between",
    paddingBottom: 24,
    height: 200,
  },
  yAxisLabel: {
    fontSize: 12,
    textAlign: "right",
    paddingRight: Spacing.sm,
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
