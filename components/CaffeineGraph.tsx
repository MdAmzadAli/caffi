import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  G,
} from "react-native-svg";
import { Colors, Spacing } from "@/constants/theme";
import {
  CaffeineEvent,
  calculateCaffeineAtTime,
  calculateDecayCurvePoints,
} from "@/utils/recommendationEngine";

interface CaffeineGraphProps {
  events: CaffeineEvent[];
  bedtime: string;
  optimalSleepThresholdMg?: number;
  now?: Date;
  halfLifeHours?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRAPH_WIDTH = SCREEN_WIDTH - 32;
const GRAPH_HEIGHT = 200;
const PADDING_LEFT = 35;
const PADDING_RIGHT = 100;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 40;
const CHART_WIDTH = GRAPH_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const CHART_HEIGHT = GRAPH_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

export function CaffeineGraph({
  events,
  bedtime,
  optimalSleepThresholdMg = 100,
  now = new Date(),
  halfLifeHours = 5.5,
}: CaffeineGraphProps) {
  const currentCaffeine = useMemo(
    () => calculateCaffeineAtTime(events, now, halfLifeHours),
    [events, now, halfLifeHours]
  );

  const { startTime, endTime, bedtimeDate, timeLabels } = useMemo(() => {
    const start = new Date(now);
    start.setHours(start.getHours() - 8, 0, 0, 0);
    const end = new Date(now);
    end.setHours(end.getHours() + 16, 0, 0, 0);

    const [bedHours, bedMinutes] = bedtime.split(":").map(Number);
    const bed = new Date(now);
    bed.setHours(bedHours, bedMinutes, 0, 0);
    if (bed <= now) {
      bed.setDate(bed.getDate() + 1);
    }

    const labels: { time: Date; label: string; x: number }[] = [];
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    for (let h = 0; h <= totalHours; h += 2) {
      const t = new Date(start.getTime() + h * 60 * 60 * 1000);
      const hour = t.getHours();
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      labels.push({
        time: t,
        label: `${hour12}${ampm}`,
        x: PADDING_LEFT + (h / totalHours) * CHART_WIDTH,
      });
    }

    return { startTime: start, endTime: end, bedtimeDate: bed, timeLabels: labels };
  }, [now, bedtime]);

  const decayPoints = useMemo(
    () => calculateDecayCurvePoints(events, startTime, endTime, halfLifeHours, 2),
    [events, startTime, endTime, halfLifeHours]
  );

  const maxMg = useMemo(() => {
    const maxFromCurve = Math.max(...decayPoints.map((p) => p.mg), 50);
    return Math.ceil(maxFromCurve / 50) * 50 + 50;
  }, [decayPoints]);

  const yScale = (mg: number): number => {
    return PADDING_TOP + CHART_HEIGHT - (mg / maxMg) * CHART_HEIGHT;
  };

  const xScale = (time: Date): number => {
    const totalMs = endTime.getTime() - startTime.getTime();
    const elapsed = time.getTime() - startTime.getTime();
    return PADDING_LEFT + (elapsed / totalMs) * CHART_WIDTH;
  };

  const pathD = useMemo(() => {
    if (decayPoints.length === 0) return "";
    const points = decayPoints.map((p) => ({
      x: xScale(p.time),
      y: yScale(p.mg),
    }));

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [decayPoints, startTime, endTime, maxMg]);

  const nowX = xScale(now);
  const bedtimeX = xScale(bedtimeDate);
  const thresholdY = yScale(optimalSleepThresholdMg);

  const sleepAffected = currentCaffeine > optimalSleepThresholdMg;
  const sleepMessage = sleepAffected
    ? "Sleep may be affected."
    : "Your sleep should be unaffected.";

  const yAxisLabels = useMemo(() => {
    const labels: { value: number; y: number }[] = [];
    const step = maxMg <= 100 ? 25 : 50;
    for (let v = 0; v <= maxMg; v += step) {
      labels.push({ value: v, y: yScale(v) });
    }
    return labels;
  }, [maxMg]);

  return (
    <View style={styles.container}>
      <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
        <Defs>
          <LinearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={Colors.light.darkBrown2} stopOpacity="1" />
            <Stop offset="1" stopColor={Colors.light.darkBrown} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {yAxisLabels.map((label) => (
          <G key={label.value}>
            <SvgText
              x={PADDING_LEFT - 8}
              y={label.y + 4}
              fontSize={10}
              fill={Colors.light.mutedGrey}
              textAnchor="end"
            >
              {label.value}
            </SvgText>
            <Line
              x1={PADDING_LEFT}
              y1={label.y}
              x2={PADDING_LEFT + CHART_WIDTH}
              y2={label.y}
              stroke={Colors.light.divider}
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          </G>
        ))}

        {timeLabels.map((label, index) => (
          <SvgText
            key={index}
            x={label.x}
            y={GRAPH_HEIGHT - 10}
            fontSize={9}
            fill={Colors.light.mutedGrey}
            textAnchor="middle"
          >
            {label.label}
          </SvgText>
        ))}

        <Line
          x1={PADDING_LEFT}
          y1={thresholdY}
          x2={PADDING_LEFT + CHART_WIDTH}
          y2={thresholdY}
          stroke={Colors.light.green}
          strokeWidth={2}
        />
        <SvgText
          x={PADDING_LEFT + 4}
          y={thresholdY - 6}
          fontSize={9}
          fill={Colors.light.green}
        >
          Sleep unaffected
        </SvgText>

        <Line
          x1={bedtimeX}
          y1={PADDING_TOP}
          x2={bedtimeX}
          y2={PADDING_TOP + CHART_HEIGHT}
          stroke={Colors.light.blue}
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />

        <Line
          x1={nowX}
          y1={PADDING_TOP}
          x2={nowX}
          y2={PADDING_TOP + CHART_HEIGHT}
          stroke={Colors.light.darkBrown}
          strokeWidth={1}
        />
        <SvgText
          x={nowX}
          y={PADDING_TOP + CHART_HEIGHT + 12}
          fontSize={10}
          fill={Colors.light.darkBrown}
          textAnchor="middle"
          fontWeight="600"
        >
          {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </SvgText>

        {pathD && (
          <Path
            d={pathD}
            stroke="url(#curveGradient)"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>

      <View style={styles.currentCaffeineContainer}>
        <Text style={styles.currentCaffeineValue}>
          {currentCaffeine.toFixed(1)} mg
        </Text>
        <Text
          style={[
            styles.sleepMessage,
            { color: sleepAffected ? Colors.light.warning : Colors.light.green },
          ]}
        >
          {sleepMessage}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: Colors.light.bg,
  },
  currentCaffeineContainer: {
    position: "absolute",
    top: PADDING_TOP,
    right: 8,
    alignItems: "flex-end",
  },
  currentCaffeineValue: {
    fontSize: 44,
    fontWeight: "700",
    color: Colors.light.darkBrown2,
  },
  sleepMessage: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    maxWidth: 100,
    textAlign: "right",
  },
});
