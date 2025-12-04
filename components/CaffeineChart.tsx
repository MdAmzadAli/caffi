import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing } from "@/constants/theme";
import type { DrinkEntry } from "@/store/caffeineStore";

interface CaffeineChartProps {
  entries: DrinkEntry[];
  timeRange: "day" | "week";
  dailyLimit: number;
}

const CHART_HEIGHT = 120;
const BAR_RADIUS = 4;

export function CaffeineChart({
  entries,
  timeRange,
  dailyLimit,
}: CaffeineChartProps) {
  const { theme } = useTheme();
  const chartWidth = Dimensions.get("window").width - Spacing.xl * 4;

  const chartData = useMemo(() => {
    if (timeRange === "day") {
      const hourlyData: { hour: number; mg: number }[] = [];
      for (let h = 0; h < 24; h++) {
        hourlyData.push({ hour: h, mg: 0 });
      }

      entries.forEach((entry) => {
        const hour = new Date(entry.timestamp).getHours();
        hourlyData[hour].mg += entry.caffeineAmount;
      });

      return hourlyData.filter((d) => d.hour >= 6 && d.hour <= 22);
    } else {
      const dailyData: { day: string; mg: number }[] = [];
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayEntries = entries.filter((e) => {
          const entryDate = new Date(e.timestamp);
          return entryDate >= date && entryDate < nextDate;
        });

        const totalMg = dayEntries.reduce((sum, e) => sum + e.caffeineAmount, 0);
        dailyData.push({ day: days[date.getDay()], mg: totalMg });
      }

      return dailyData;
    }
  }, [entries, timeRange]);

  const maxValue = Math.max(...chartData.map((d) => d.mg), dailyLimit);
  const barWidth =
    timeRange === "day"
      ? chartWidth / chartData.length - 4
      : chartWidth / 7 - 8;

  if (entries.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height: CHART_HEIGHT }]}>
        <ThemedText type="small" muted>
          No data for this period
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT + 30}>
        <Line
          x1={0}
          y1={(1 - dailyLimit / maxValue) * CHART_HEIGHT}
          x2={chartWidth}
          y2={(1 - dailyLimit / maxValue) * CHART_HEIGHT}
          stroke={Colors.light.danger}
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.5}
        />

        {chartData.map((item, index) => {
          const barHeight = (item.mg / maxValue) * CHART_HEIGHT;
          const x =
            timeRange === "day"
              ? index * (chartWidth / chartData.length) + 2
              : index * (chartWidth / 7) + 4;
          const y = CHART_HEIGHT - barHeight;

          const isOverLimit = item.mg > dailyLimit;
          const barColor = isOverLimit
            ? Colors.light.danger
            : item.mg > dailyLimit * 0.8
              ? Colors.light.warning
              : Colors.light.accent;

          return (
            <React.Fragment key={index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                fill={barColor}
                rx={BAR_RADIUS}
                ry={BAR_RADIUS}
              />
              <SvgText
                x={x + barWidth / 2}
                y={CHART_HEIGHT + 20}
                fontSize={10}
                fill={theme.textMuted}
                textAnchor="middle"
              >
                {"hour" in item ? `${item.hour}` : item.day}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: Colors.light.accent }]}
          />
          <ThemedText type="caption" muted>
            Under limit
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: Colors.light.danger }]}
          />
          <ThemedText type="caption" muted>
            Over limit
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
