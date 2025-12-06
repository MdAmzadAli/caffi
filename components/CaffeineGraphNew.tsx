import React, { useMemo, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import Svg, {
  Path,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Text as SvgText,
  G,
} from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import {
  CaffeineEvent,
  buildSampleTimes,
  computeActiveCurve,
  getActiveAtTime,
  formatTimeLabel,
  formatCurrentTime,
  generateSmoothPath,
  getEventMarkersWithCollision,
  getSleepStatusMessage,
  parseBedtimeToMs,
} from "@/utils/graphUtils";

interface GraphColors {
  bg: string;
  bgSecondary: string;
  accentGold: string;
  darkBrown: string;
  darkBrown2: string;
  green: string;
  blue: string;
  mutedGrey: string;
  dangerRed: string;
  areaFill: string;
  areaFillEnd: string;
}

const LIGHT_GRAPH_COLORS: GraphColors = {
  bg: "#FFFFFF",
  bgSecondary: "#F5F5F5",
  accentGold: "#C9A36A",
  darkBrown: "#5C4A3B",
  darkBrown2: "#6A513B",
  green: "#53A451",
  blue: "#4DA3FF",
  mutedGrey: "#9E9E9E",
  dangerRed: "#D9534F",
  areaFill: "#E8DFD0",
  areaFillEnd: "#F5F0E8",
};

const DARK_GRAPH_COLORS: GraphColors = {
  bg: "#1F1815",
  bgSecondary: "#2A2420",
  accentGold: "#C9A36A",
  darkBrown: "#F5EBDD",
  darkBrown2: "#E8DFD4",
  green: "#53A451",
  blue: "#4DA3FF",
  mutedGrey: "#A0A0A0",
  dangerRed: "#D9534F",
  areaFill: "#3D3530",
  areaFillEnd: "#2A2420",
};

interface CaffeineGraphProps {
  events: CaffeineEvent[];
  now?: string;
  halfLifeHours?: number;
  sampleResolutionMinutes?: number;
  viewWindowHours?: number;
  yMax?: number;
  sleepThresholdMg?: number;
  bedtime: string;
  onScrollOffsetChange?: (isOffCenter: boolean) => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  isDark?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const Y_AXIS_WIDTH = 28;
const RIGHT_PADDING = 4;
const X_AXIS_HEIGHT = 20;
const GRAPH_PADDING_TOP = 8;
const GRAPH_PADDING_BOTTOM = 8;
const MARKER_SIZE = 28;
const HOURS_VISIBLE = 11;
const TOTAL_WINDOW_HOURS = 168;

export function CaffeineGraphNew({
  events,
  now = new Date().toISOString(),
  halfLifeHours = 5.5,
  sampleResolutionMinutes = 5,
  viewWindowHours = TOTAL_WINDOW_HOURS,
  yMax = 450,
  sleepThresholdMg = 100,
  bedtime,
  onScrollOffsetChange,
  scrollViewRef,
  isDark = false,
}: CaffeineGraphProps) {
  const GRAPH_COLORS = isDark ? DARK_GRAPH_COLORS : LIGHT_GRAPH_COLORS;
  
  const graphHeight = SCREEN_HEIGHT * 0.32;
  const chartHeight = graphHeight - X_AXIS_HEIGHT - GRAPH_PADDING_TOP - GRAPH_PADDING_BOTTOM;
  const scrollContentWidth = SCREEN_WIDTH * (viewWindowHours / HOURS_VISIBLE);
  const chartWidth = scrollContentWidth - Y_AXIS_WIDTH - RIGHT_PADDING;

  const nowMs = Date.parse(now);
  const nowDate = new Date(nowMs);

  const { samples: sampleTimesMs, startMs, endMs } = useMemo(() => {
    return buildSampleTimes(now, viewWindowHours, sampleResolutionMinutes);
  }, [now, viewWindowHours, sampleResolutionMinutes]);

  const curveData = useMemo(() => {
    return computeActiveCurve(events, sampleTimesMs, halfLifeHours);
  }, [events, sampleTimesMs, halfLifeHours]);

  const currentActiveMg = useMemo(() => {
    return getActiveAtTime(events, nowMs, halfLifeHours);
  }, [events, nowMs, halfLifeHours]);

  const bedtimeMs = useMemo(() => {
    return parseBedtimeToMs(bedtime, nowDate);
  }, [bedtime, nowMs]);

  const timeToX = useCallback(
    (ms: number): number => {
      const ratio = (ms - startMs) / (endMs - startMs);
      return Y_AXIS_WIDTH + ratio * chartWidth;
    },
    [startMs, endMs, chartWidth]
  );

  const mgToY = useCallback(
    (mg: number): number => {
      const ratio = mg / yMax;
      return GRAPH_PADDING_TOP + chartHeight * (1 - ratio);
    },
    [yMax, chartHeight]
  );

  const curvePoints = useMemo(() => {
    return curveData.map((pt) => ({
      x: timeToX(pt.t),
      y: mgToY(pt.mg),
    }));
  }, [curveData, timeToX, mgToY]);

  const curvePath = useMemo(() => {
    return generateSmoothPath(curvePoints, 0.2);
  }, [curvePoints]);

  const areaPath = useMemo(() => {
    if (curvePoints.length < 2) return "";
    const baseY = mgToY(0);
    let path = `M ${curvePoints[0].x} ${baseY}`;
    path += ` L ${curvePoints[0].x} ${curvePoints[0].y}`;
    path += curvePath.substring(curvePath.indexOf("C") - 1);
    path += ` L ${curvePoints[curvePoints.length - 1].x} ${baseY}`;
    path += " Z";
    return path;
  }, [curvePoints, curvePath, mgToY]);

  const yAxisTicks = useMemo(() => {
    const ticks = [];
    const step = yMax <= 200 ? 50 : 100;
    for (let mg = 0; mg <= yMax; mg += step) {
      ticks.push(mg);
    }
    return ticks;
  }, [yMax]);

  const xAxisTicks = useMemo(() => {
    const ticks = [];
    const startHour = new Date(startMs);
    startHour.setMinutes(0, 0, 0);
    let currentMs = startHour.getTime();
    if (currentMs < startMs) {
      currentMs += 3600000;
    }
    while (currentMs <= endMs) {
      ticks.push(currentMs);
      currentMs += 3600000;
    }
    return ticks;
  }, [startMs, endMs]);

  const dateMarkers = useMemo(() => {
    const markers: { ms: number; label: string }[] = [];
    const startDate = new Date(startMs);
    startDate.setHours(0, 0, 0, 0);
    let currentMs = startDate.getTime();
    if (currentMs < startMs) {
      currentMs += 24 * 3600000;
    }
    while (currentMs <= endMs) {
      const date = new Date(currentMs);
      const day = date.getDate();
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear().toString().slice(-2);
      markers.push({ ms: currentMs, label: `${day} ${month}, ${year}` });
      currentMs += 24 * 3600000;
    }
    return markers;
  }, [startMs, endMs]);

  const eventMarkers = useMemo(() => {
    const relevantEvents = events.filter((e) => {
      const eventMs = Date.parse(e.timestampISO);
      return eventMs >= startMs && eventMs <= endMs;
    });
    return getEventMarkersWithCollision(relevantEvents, timeToX, 22);
  }, [events, startMs, endMs, timeToX]);

  const nowX = timeToX(nowMs);
  const bedtimeX = timeToX(bedtimeMs);
  const sleepThresholdY = mgToY(sleepThresholdMg);

  const { message: sleepMessage, color: sleepColor } = getSleepStatusMessage(
    currentActiveMg,
    sleepThresholdMg
  );

  const statusTextColor =
    sleepColor === "green"
      ? GRAPH_COLORS.green
      : sleepColor === "brown"
        ? GRAPH_COLORS.darkBrown2
        : GRAPH_COLORS.dangerRed;

  const defaultScrollX = useMemo(() => {
    const nowPosition = ((nowMs - startMs) / (endMs - startMs)) * scrollContentWidth;
    return Math.max(0, nowPosition - SCREEN_WIDTH / 2);
  }, [nowMs, startMs, endMs, scrollContentWidth]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (onScrollOffsetChange) {
        const scrollX = event.nativeEvent.contentOffset.x;
        const centerX = scrollX + SCREEN_WIDTH / 2;
        const nowPosition = ((nowMs - startMs) / (endMs - startMs)) * scrollContentWidth;
        const isOffCenter = Math.abs(centerX - nowPosition) > SCREEN_WIDTH * 0.1;
        onScrollOffsetChange(isOffCenter);
      }
    },
    [onScrollOffsetChange, nowMs, startMs, endMs, scrollContentWidth]
  );

  const gradientId = isDark ? "curveGradientDark" : "curveGradientLight";

  return (
    <View style={[styles.container, { height: graphHeight, backgroundColor: GRAPH_COLORS.bg }]}>
      <View style={[styles.yAxisContainer, { backgroundColor: GRAPH_COLORS.bg }]}>
        {yAxisTicks.map((mg) => (
          <View
            key={mg}
            style={[
              styles.yAxisTickRow,
              { top: mgToY(mg) - 4 },
            ]}
          >
            <Text style={[styles.yAxisLabel, { color: GRAPH_COLORS.mutedGrey }]}>{mg}</Text>
          </View>
        ))}
        <View style={[styles.sleepLabel, { top: sleepThresholdY - 6 }]}>
          <Text style={[styles.sleepLabelText, { color: GRAPH_COLORS.green }]}>Sleep unaffected</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: defaultScrollX, y: 0 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={{ width: scrollContentWidth }}
      >
        <Svg
          width={scrollContentWidth}
          height={graphHeight - X_AXIS_HEIGHT}
          style={styles.svgChart}
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={GRAPH_COLORS.areaFill} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={GRAPH_COLORS.areaFillEnd} stopOpacity="0.2" />
            </LinearGradient>
          </Defs>

          {yAxisTicks.map((mg) => (
            <Line
              key={`grid-${mg}`}
              x1={Y_AXIS_WIDTH}
              y1={mgToY(mg)}
              x2={scrollContentWidth - RIGHT_PADDING}
              y2={mgToY(mg)}
              stroke={GRAPH_COLORS.darkBrown}
              strokeOpacity={isDark ? 0.12 : 0.06}
              strokeWidth={0.5}
            />
          ))}

          <Line
            x1={Y_AXIS_WIDTH}
            y1={sleepThresholdY}
            x2={scrollContentWidth - RIGHT_PADDING}
            y2={sleepThresholdY}
            stroke={GRAPH_COLORS.green}
            strokeWidth={1}
          />

          {dateMarkers.map((marker) => {
            const x = timeToX(marker.ms);
            return (
              <G key={`date-${marker.ms}`}>
                <Line
                  x1={x}
                  y1={GRAPH_PADDING_TOP}
                  x2={x}
                  y2={chartHeight + GRAPH_PADDING_TOP}
                  stroke={GRAPH_COLORS.mutedGrey}
                  strokeWidth={0.5}
                  strokeDasharray="3,3"
                  strokeOpacity={0.4}
                />
                <SvgText
                  x={x + 4}
                  y={GRAPH_PADDING_TOP + 8}
                  fontSize={7}
                  fill={GRAPH_COLORS.mutedGrey}
                  textAnchor="start"
                >
                  {marker.label}
                </SvgText>
              </G>
            );
          })}

          {bedtimeMs >= startMs && bedtimeMs <= endMs && (
            <>
              <Line
                x1={bedtimeX}
                y1={GRAPH_PADDING_TOP}
                x2={bedtimeX}
                y2={chartHeight + GRAPH_PADDING_TOP}
                stroke={GRAPH_COLORS.blue}
                strokeWidth={1.5}
                strokeDasharray="4,3"
              />
              <SvgText
                x={bedtimeX}
                y={GRAPH_PADDING_TOP - 2}
                fontSize={10}
                fill={GRAPH_COLORS.blue}
                textAnchor="middle"
              >
                🌙
              </SvgText>
            </>
          )}

          <Line
            x1={nowX}
            y1={GRAPH_PADDING_TOP}
            x2={nowX}
            y2={chartHeight + GRAPH_PADDING_TOP}
            stroke={GRAPH_COLORS.darkBrown2}
            strokeWidth={1.5}
          />

          <Path d={areaPath} fill={`url(#${gradientId})`} />

          <Path
            d={curvePath}
            stroke={GRAPH_COLORS.darkBrown2}
            strokeWidth={2}
            fill="none"
          />

          {eventMarkers.map((marker, idx) => {
            const eventMs = Date.parse(marker.event.timestampISO);
            const mgAtEvent = getActiveAtTime(events, eventMs, halfLifeHours);
            const markerY = mgToY(mgAtEvent);
            const isClustered = marker.clustered.length > 1;

            return (
              <G key={marker.event.id}>
                <Circle
                  cx={marker.x}
                  cy={markerY}
                  r={3}
                  fill={GRAPH_COLORS.darkBrown2}
                />
                <Circle
                  cx={marker.x}
                  cy={markerY + MARKER_SIZE / 2 + 6}
                  r={MARKER_SIZE / 2}
                  fill={GRAPH_COLORS.bgSecondary}
                  stroke={GRAPH_COLORS.bgSecondary}
                  strokeWidth={1.5}
                />
                <Circle
                  cx={marker.x}
                  cy={markerY + MARKER_SIZE / 2 + 6}
                  r={MARKER_SIZE / 2 - 2}
                  fill={GRAPH_COLORS.bgSecondary}
                />
                <SvgText
                  x={marker.x}
                  y={markerY + MARKER_SIZE / 2 + 10}
                  fontSize={12}
                  textAnchor="middle"
                  fill={GRAPH_COLORS.darkBrown}
                >
                  ☕
                </SvgText>
                {isClustered && (
                  <>
                    <Circle
                      cx={marker.x + 11}
                      cy={markerY + MARKER_SIZE / 2}
                      r={8}
                      fill={GRAPH_COLORS.darkBrown2}
                    />
                    <SvgText
                      x={marker.x + 11}
                      y={markerY + MARKER_SIZE / 2 + 3}
                      fontSize={7}
                      fill={GRAPH_COLORS.bg}
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      +{marker.clustered.length - 1}
                    </SvgText>
                  </>
                )}
              </G>
            );
          })}
        </Svg>

        <View style={[styles.xAxisContainer, { width: scrollContentWidth }]}>
          {xAxisTicks.map((tickMs, idx) => {
            const x = timeToX(tickMs);
            return (
              <View key={tickMs} style={[styles.xAxisTick, { left: x - 14 }]}>
                <Text style={[styles.xAxisLabel, { color: GRAPH_COLORS.mutedGrey }]}>{formatTimeLabel(tickMs)}</Text>
              </View>
            );
          })}
          <View style={[styles.currentTimeLabel, { left: nowX - 22 }]}>
            <Text style={[styles.currentTimeLabelText, { color: GRAPH_COLORS.darkBrown2 }]}>
              {formatCurrentTime(nowMs)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.activeValueContainer}>
        <Text style={[styles.activeValueText, { color: GRAPH_COLORS.darkBrown2 }]}>
          {currentActiveMg.toFixed(1)} mg
        </Text>
        <Text style={[styles.activeValueSubtitle, { color: statusTextColor }]}>
          {sleepMessage}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  yAxisContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: Y_AXIS_WIDTH,
    height: "100%",
    zIndex: 10,
  },
  yAxisTickRow: {
    position: "absolute",
    left: 0,
    width: Y_AXIS_WIDTH - 2,
    alignItems: "flex-end",
  },
  yAxisLabel: {
    fontSize: 8,
    fontWeight: "500",
  },
  sleepLabel: {
    position: "absolute",
    left: 2,
    width: Y_AXIS_WIDTH + 50,
  },
  sleepLabelText: {
    fontSize: 7,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
    marginLeft: Y_AXIS_WIDTH,
  },
  svgChart: {
    backgroundColor: "transparent",
  },
  xAxisContainer: {
    height: X_AXIS_HEIGHT,
    position: "relative",
  },
  xAxisTick: {
    position: "absolute",
    width: 28,
    alignItems: "center",
  },
  xAxisLabel: {
    fontSize: 7,
    fontWeight: "500",
  },
  currentTimeLabel: {
    position: "absolute",
    width: 44,
    alignItems: "center",
    bottom: 0,
  },
  currentTimeLabelText: {
    fontSize: 8,
    fontWeight: "600",
  },
  activeValueContainer: {
    position: "absolute",
    top: GRAPH_PADDING_TOP + 12,
    right: RIGHT_PADDING + 4,
    alignItems: "flex-end",
    zIndex: 20,
  },
  activeValueText: {
    fontSize: 28,
    fontWeight: "700",
  },
  activeValueSubtitle: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
    maxWidth: 140,
    textAlign: "right",
  },
});

export default CaffeineGraphNew;
