import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing } from "@/constants/theme";
import type { DrinkEntry } from "@/store/caffeineStore";

interface CaffeineDecayCurveProps {
  entries: DrinkEntry[];
  showHalfLife: boolean;
  sleepTime: string;
}

const CHART_HEIGHT = 180;
const CAFFEINE_HALF_LIFE_HOURS = 5;
const HOURS_TO_SHOW = 12;

export function CaffeineDecayCurve({
  entries,
  showHalfLife,
  sleepTime,
}: CaffeineDecayCurveProps) {
  const { theme } = useTheme();
  const chartWidth = Dimensions.get("window").width - Spacing.xl * 4;

  const curveData = useMemo(() => {
    const now = new Date();
    const points: { hour: number; mg: number }[] = [];

    for (let h = 0; h <= HOURS_TO_SHOW; h += 0.5) {
      const checkTime = new Date(now.getTime() + h * 60 * 60 * 1000);
      let caffeine = 0;

      entries.forEach((entry) => {
        const entryTime = new Date(entry.timestamp);
        if (entryTime <= checkTime) {
          const hoursElapsed =
            (checkTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
          const remainingFactor = Math.pow(
            0.5,
            hoursElapsed / CAFFEINE_HALF_LIFE_HOURS,
          );
          caffeine += entry.caffeineAmount * remainingFactor;
        }
      });

      points.push({ hour: h, mg: Math.round(caffeine) });
    }

    return points;
  }, [entries]);

  const maxMg = Math.max(...curveData.map((p) => p.mg), 100);
  const currentMg = curveData[0]?.mg || 0;
  const halfMg = currentMg / 2;

  const getY = (mg: number) => {
    return CHART_HEIGHT - (mg / maxMg) * (CHART_HEIGHT - 20);
  };

  const getX = (hour: number) => {
    return (hour / HOURS_TO_SHOW) * chartWidth;
  };

  const pathData = curveData
    .map((point, i) => {
      const x = getX(point.hour);
      const y = getY(point.mg);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  const areaPathData =
    pathData +
    ` L ${chartWidth} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

  const sleepHour = parseInt(sleepTime.split(":")[0]);
  const now = new Date();
  const currentHour = now.getHours();
  let hoursUntilSleep = sleepHour - currentHour;
  if (hoursUntilSleep <= 0) hoursUntilSleep += 24;
  const sleepX = hoursUntilSleep <= HOURS_TO_SHOW ? getX(hoursUntilSleep) : null;

  let halfLifeHour: number | null = null;
  if (showHalfLife && currentMg > 0) {
    for (const point of curveData) {
      if (point.mg <= halfMg) {
        halfLifeHour = point.hour;
        break;
      }
    }
  }

  if (entries.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height: CHART_HEIGHT }]}>
        <ThemedText type="small" muted>
          Add drinks to see your caffeine curve
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT + 30}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.light.accent} stopOpacity="0.3" />
            <Stop offset="1" stopColor={Colors.light.accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Path d={areaPathData} fill="url(#gradient)" />

        <Path
          d={pathData}
          stroke={Colors.light.accent}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {sleepX && (
          <>
            <Line
              x1={sleepX}
              y1={0}
              x2={sleepX}
              y2={CHART_HEIGHT}
              stroke={Colors.light.warning}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={sleepX}
              y={12}
              fontSize={10}
              fill={Colors.light.warning}
              textAnchor="middle"
            >
              Sleep
            </SvgText>
          </>
        )}

        {showHalfLife && halfLifeHour !== null && (
          <>
            <Line
              x1={0}
              y1={getY(halfMg)}
              x2={chartWidth}
              y2={getY(halfMg)}
              stroke={theme.textMuted}
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.5}
            />
            <Circle
              cx={getX(halfLifeHour)}
              cy={getY(halfMg)}
              r={5}
              fill={Colors.light.accent}
            />
            <SvgText
              x={getX(halfLifeHour) + 10}
              y={getY(halfMg) + 4}
              fontSize={10}
              fill={theme.text}
            >
              {Math.round(halfMg)}mg
            </SvgText>
          </>
        )}

        <Circle cx={0} cy={getY(currentMg)} r={6} fill={Colors.light.accent} />

        {[0, 3, 6, 9, 12].map((hour) => (
          <SvgText
            key={hour}
            x={getX(hour)}
            y={CHART_HEIGHT + 20}
            fontSize={10}
            fill={theme.textMuted}
            textAnchor="middle"
          >
            {hour === 0 ? "Now" : `+${hour}h`}
          </SvgText>
        ))}
      </Svg>
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
});
