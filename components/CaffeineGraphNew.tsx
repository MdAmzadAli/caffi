import React, { useMemo, useRef, useCallback, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  Pressable,
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
  Image as SvgImage,
  ClipPath,
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
  getMaxCaffeineInSleepWindowForDisplay,
  getSleepWindowStatusMessage,
  parseBedtimeToMs,
} from "@/utils/graphUtils";
import { useRealTimeNow } from "@/hooks/useRealTimeNow";

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
  yMax?: number;
  sleepThresholdMg?: number;
  optimalCaffeineMg?: number;
  bedtime: string;
  onScrollOffsetChange?: (isOffCenter: boolean, direction: 'left' | 'right' | null) => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  isDark?: boolean;
  dayWindowStart: number;
  dayWindowEnd: number;
  onExtendDays?: (direction: 'left' | 'right') => void;
  resetKey?: number;
  onEventClick?: (event: CaffeineEvent) => void;
  onStackedEventsClick?: (events: CaffeineEvent[], position: { x: number; y: number }) => void;
}

const Y_AXIS_WIDTH = 24;
const LEFT_PADDING = 0;
const RIGHT_PADDING = 0;
const X_AXIS_HEIGHT = 22;
const GRAPH_PADDING_TOP = 8;
const GRAPH_PADDING_BOTTOM = 8;
const MARKER_SIZE = 18;
const MARKER_IMAGE_SIZE = 14;
const HOURS_VISIBLE = 12;
const GROUP_PROXIMITY_PX = 15;
const HOURS_PER_DAY = 24;
const EDGE_THRESHOLD = 50;

interface EventGroup {
  events: CaffeineEvent[];
  x: number;
  y: number;
  iconY: number;
  category: string;
  imageUri?: string;
}

const CATEGORY_IMAGES: Record<string, any> = {
  coffee: require("@/assets/CaffeineSourceImages/coffee.png"),
  tea: require("@/assets/CaffeineSourceImages/tea.jpg"),
  energy: require("@/assets/CaffeineSourceImages/energy.png"),
  soda: require("@/assets/CaffeineSourceImages/soda.png"),
  chocolate: require("@/assets/CaffeineSourceImages/chocolate.png"),
};

const resolveImageSource = (imageUri: string | undefined): any => {
  if (!imageUri) return null;
  if (imageUri.startsWith("category:")) {
    const category = imageUri.replace("category:", "");
    return CATEGORY_IMAGES[category];
  }
  if (imageUri.startsWith("preset:")) {
    const { PRESET_IMAGES } = require("@/components/ImagePickerModal");
    const preset = PRESET_IMAGES.find((p: any) => p.id === imageUri.replace("preset:", ""));
    return preset?.image;
  }
  return imageUri;
};

export function CaffeineGraphNew({
  events,
  now = new Date().toISOString(),
  halfLifeHours = 5.5,
  sampleResolutionMinutes = 5,
  yMax = 300,
  sleepThresholdMg = 100,
  optimalCaffeineMg = 200,
  bedtime,
  onScrollOffsetChange,
  scrollViewRef,
  isDark = false,
  dayWindowStart,
  dayWindowEnd,
  onExtendDays,
  resetKey = 0,
  onEventClick,
  onStackedEventsClick,
}: CaffeineGraphProps) {
  const GRAPH_COLORS = isDark ? DARK_GRAPH_COLORS : LIGHT_GRAPH_COLORS;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  const viewWindowHours = (dayWindowEnd - dayWindowStart + 1) * HOURS_PER_DAY;
  const graphHeight = windowHeight * 0.32;
  const chartHeight = graphHeight - X_AXIS_HEIGHT - GRAPH_PADDING_TOP - GRAPH_PADDING_BOTTOM;
  const scrollContentWidth = windowWidth * (viewWindowHours / HOURS_VISIBLE);
  const chartWidth = scrollContentWidth;

  const realTimeNow = useRealTimeNow();
  const nowMs = realTimeNow;
  const nowDate = new Date(nowMs);

  const { startMs, endMs } = useMemo(() => {
    const todayStart = new Date(nowMs);
    todayStart.setHours(0, 0, 0, 0);
    const start = todayStart.getTime() + dayWindowStart * HOURS_PER_DAY * 3600000;
    const end = todayStart.getTime() + (dayWindowEnd + 1) * HOURS_PER_DAY * 3600000;
    return { startMs: start, endMs: end };
  }, [nowMs, dayWindowStart, dayWindowEnd]);

  const sampleTimesMs = useMemo(() => {
    const samples: number[] = [];
    const stepMs = sampleResolutionMinutes * 60000;
    for (let t = startMs; t <= endMs; t += stepMs) {
      samples.push(t);
    }
    return samples;
  }, [startMs, endMs, sampleResolutionMinutes]);

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
      return ratio * chartWidth;
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
    const ticks = [50];
    const step = 50;
    for (let mg = step; mg <= yMax; mg += step) {
      if (mg !== 50) ticks.push(mg);
    }
    return ticks.sort((a, b) => a - b);
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


  const nowX = timeToX(nowMs);
  const bedtimeX = timeToX(bedtimeMs);
  const sleepThresholdY = mgToY(sleepThresholdMg);
  const optimalCaffeineY = mgToY(optimalCaffeineMg);
  
  const [showLegend, setShowLegend] = useState(false);

  const maxCaffeineInSleepWindow = useMemo(() => {
    return getMaxCaffeineInSleepWindowForDisplay(events, bedtime, nowMs, halfLifeHours, 6);
  }, [events, bedtime, nowMs, halfLifeHours]);

  const { message: sleepMessage, color: sleepColor } = getSleepWindowStatusMessage(
    maxCaffeineInSleepWindow
  );

  const statusTextColor =
    sleepColor === "green"
      ? GRAPH_COLORS.green
      : sleepColor === "brown"
        ? GRAPH_COLORS.accentGold
        : GRAPH_COLORS.darkBrown;

  const defaultScrollX = useMemo(() => {
    if (nowMs >= startMs && nowMs <= endMs) {
      const nowPosition = ((nowMs - startMs) / (endMs - startMs)) * scrollContentWidth;
      return Math.max(0, nowPosition - windowWidth / 2);
    }
    return scrollContentWidth / 2 - windowWidth / 2;
  }, [startMs, endMs, scrollContentWidth, windowWidth]);

  const lastExtendRef = useRef<number>(0);
  const hasInitialScrolled = useRef<boolean>(false);
  const prevDayWindowStartRef = useRef<number>(dayWindowStart);
  const currentScrollXRef = useRef<number>(defaultScrollX);

  useEffect(() => {
    if (scrollViewRef?.current && !hasInitialScrolled.current) {
      hasInitialScrolled.current = true;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: defaultScrollX, y: 0, animated: false });
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialScrolled.current) return;
    
    const daysDelta = prevDayWindowStartRef.current - dayWindowStart;
    if (daysDelta !== 0 && scrollViewRef?.current) {
      const pixelsPerDay = (windowWidth * HOURS_PER_DAY) / HOURS_VISIBLE;
      const offsetAdjustment = daysDelta * pixelsPerDay;
      const newScrollX = currentScrollXRef.current + offsetAdjustment;
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: Math.max(0, newScrollX), y: 0, animated: false });
      }, 0);
    }
    prevDayWindowStartRef.current = dayWindowStart;
  }, [dayWindowStart, dayWindowEnd, windowWidth]);

  useEffect(() => {
    if (resetKey > 0 && scrollViewRef?.current) {
      prevDayWindowStartRef.current = dayWindowStart;
      currentScrollXRef.current = defaultScrollX;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: defaultScrollX, y: 0, animated: true });
      }, 50);
    }
  }, [resetKey]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      const contentWidth = event.nativeEvent.contentSize.width;
      const viewportWidth = event.nativeEvent.layoutMeasurement.width;
      const maxScrollX = contentWidth - viewportWidth;

      // Only update the ref, don't trigger state changes that might affect ScrollView props
      currentScrollXRef.current = scrollX;

      // debounce or throttle this if needed, but the main issue is likely the interaction 
      // between contentOffset prop and manual scrolling
      if (onScrollOffsetChange) {
        const centerX = scrollX + windowWidth / 2;
        const nowPosition = nowMs >= startMs && nowMs <= endMs 
          ? ((nowMs - startMs) / (endMs - startMs)) * scrollContentWidth 
          : -1;
        const isOffCenter = nowPosition < 0 || Math.abs(centerX - nowPosition) > windowWidth * 0.1;
        const direction: 'left' | 'right' | null = isOffCenter 
          ? (nowPosition < 0 ? (dayWindowEnd < 1 ? 'right' : 'left') : (centerX < nowPosition ? 'right' : 'left')) 
          : null;
        onScrollOffsetChange(isOffCenter, direction);
      }

      const now = Date.now();
      if (now - lastExtendRef.current < 300) return;

      if (onExtendDays) {
        // Use a small buffer to prevent accidental triggers at exact boundaries
        if (scrollX <= 10) { 
          lastExtendRef.current = now;
          onExtendDays('left');
        } else if (scrollX >= maxScrollX - 10) {
          lastExtendRef.current = now;
          onExtendDays('right');
        }
      }
    },
    [onScrollOffsetChange, onExtendDays, nowMs, startMs, endMs, scrollContentWidth, windowWidth, dayWindowEnd]
  );

  const gradientId = isDark ? "curveGradientDark" : "curveGradientLight";

  const eventGroups = useMemo(() => {
    const visibleEvents = events
      .map(evt => {
        const eventMs = Date.parse(evt.timestampISO);
        if (eventMs < startMs || eventMs > endMs) return null;
        const x = timeToX(eventMs);
        const y = mgToY(getActiveAtTime(events, eventMs, halfLifeHours));
        return { evt, x, y, eventMs };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => a.eventMs - b.eventMs);

    const groups: EventGroup[] = [];
    let i = 0;
    while (i < visibleEvents.length) {
      const current = visibleEvents[i];
      const clustered: CaffeineEvent[] = [current.evt];
      
      let j = i + 1;
      while (j < visibleEvents.length) {
        const next = visibleEvents[j];
        if (Math.abs(next.x - current.x) <= GROUP_PROXIMITY_PX && Math.abs(next.y - current.y) <= GROUP_PROXIMITY_PX) {
          clustered.push(next.evt);
          j++;
        } else {
          break;
        }
      }

      const iconY = Math.max(GRAPH_PADDING_TOP + MARKER_IMAGE_SIZE / 2, current.y - MARKER_IMAGE_SIZE / 2 - 6);
      groups.push({
        events: clustered,
        x: current.x,
        y: current.y,
        iconY,
        category: current.evt.category || 'coffee',
        imageUri: current.evt.imageUri,
      });
      i = j;
    }

    return { visibleEvents, groups };
  }, [events, startMs, endMs, timeToX, mgToY, halfLifeHours]);

  const handleMarkerPress = useCallback((group: EventGroup, pageX: number, pageY: number) => {
    if (group.events.length === 1) {
      onEventClick?.(group.events[0]);
    } else {
      onStackedEventsClick?.(group.events, { x: pageX, y: pageY });
    }
  }, [onEventClick, onStackedEventsClick]);

  return (
    <View style={[styles.container, { height: graphHeight, backgroundColor: GRAPH_COLORS.bg }]}>
      <View style={[styles.yAxisContainer]}>
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
        <Pressable 
          style={styles.infoButton} 
          onPress={() => setShowLegend(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="info" size={14} color={GRAPH_COLORS.mutedGrey} />
        </Pressable>
      </View>
      
      {showLegend && (
        <>
          <Pressable style={styles.legendOverlay} onPress={() => setShowLegend(false)} />
          <View style={[styles.legendCard, { backgroundColor: GRAPH_COLORS.bg }]}>
            {/* <Text style={[styles.legendTitle, { color: GRAPH_COLORS.darkBrown2 }]}>Graph Legend</Text> */}
            <View style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: GRAPH_COLORS.green }]} />
              <Text style={[styles.legendText, { color: GRAPH_COLORS.darkBrown }]}>Sleep threshold - caffeine below this won't affect sleep</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendLineDashed, { borderColor: GRAPH_COLORS.accentGold }]} />
              <Text style={[styles.legendText, { color: GRAPH_COLORS.darkBrown }]}>Your optimal daily caffeine level</Text>
            </View>
          </View>
        </>
      )}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={{ width: scrollContentWidth, flexDirection: 'column' }}
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
              x1={0}
              y1={mgToY(mg)}
              x2={scrollContentWidth}
              y2={mgToY(mg)}
              stroke={GRAPH_COLORS.darkBrown}
              strokeOpacity={isDark ? 0.12 : 0.06}
              strokeWidth={0.5}
            />
          ))}

          <Line
            x1={0}
            y1={sleepThresholdY}
            x2={scrollContentWidth}
            y2={sleepThresholdY}
            stroke={GRAPH_COLORS.green}
            strokeWidth={1}
          />

          <Line
            x1={0}
            y1={optimalCaffeineY}
            x2={scrollContentWidth}
            y2={optimalCaffeineY}
            stroke={GRAPH_COLORS.accentGold}
            strokeWidth={1}
            strokeDasharray="4,3"
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

          {nowMs >= startMs && nowMs <= endMs && (
            <Line
              x1={nowX}
              y1={GRAPH_PADDING_TOP}
              x2={nowX}
              y2={chartHeight + GRAPH_PADDING_TOP}
              stroke={GRAPH_COLORS.darkBrown2}
              strokeWidth={1.5}
            />
          )}

          <Path d={areaPath} fill={`url(#${gradientId})`} />

          <Path
            d={curvePath}
            stroke={GRAPH_COLORS.darkBrown2}
            strokeWidth={2}
            fill="none"
          />

          {eventGroups.visibleEvents.map(item => (
            <Circle
              key={`dot-${item.evt.id}`}
              cx={item.x}
              cy={item.y}
              r={3}
              fill={GRAPH_COLORS.accentGold}
            />
          ))}
          {eventGroups.groups.map((group, idx) => {
            const { x, iconY, category, imageUri, events: groupEvents } = group;
            const categoryImage = CATEGORY_IMAGES[category];
            const resolvedImage = resolveImageSource(imageUri) || categoryImage;
            const hasImage = !!resolvedImage;
            const clipId = `clip-group-${idx}`;
            const count = groupEvents.length;

            return (
              <G key={`group-${idx}`}>
                <Defs>
                  <ClipPath id={clipId}>
                    <Circle cx={x} cy={iconY} r={MARKER_IMAGE_SIZE / 2} />
                  </ClipPath>
                </Defs>
                <Circle
                  cx={x}
                  cy={iconY}
                  r={MARKER_IMAGE_SIZE / 2 + 2}
                  fill={GRAPH_COLORS.bgSecondary}
                  stroke={GRAPH_COLORS.mutedGrey}
                  strokeWidth={0.5}
                  strokeOpacity={0.3}
                />
                {hasImage ? (
                  <SvgImage
                    x={x - MARKER_IMAGE_SIZE / 2}
                    y={iconY - MARKER_IMAGE_SIZE / 2}
                    width={MARKER_IMAGE_SIZE}
                    height={MARKER_IMAGE_SIZE}
                    href={resolvedImage}
                    clipPath={`url(#${clipId})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <SvgText
                    x={x}
                    y={iconY + 3}
                    fontSize={8}
                    textAnchor="middle"
                    fill={GRAPH_COLORS.darkBrown}
                  >
                    ☕
                  </SvgText>
                )}
                {count > 1 && (
                  <>
                    <Circle
                      cx={x + MARKER_IMAGE_SIZE / 2}
                      cy={iconY - MARKER_IMAGE_SIZE / 2}
                      r={6}
                      fill={GRAPH_COLORS.accentGold}
                    />
                    <SvgText
                      x={x + MARKER_IMAGE_SIZE / 2}
                      y={iconY - MARKER_IMAGE_SIZE / 2 + 3}
                      fontSize={8}
                      fontWeight="bold"
                      textAnchor="middle"
                      fill="#FFFFFF"
                    >
                      {count}
                    </SvgText>
                  </>
                )}
              </G>
            );
          })}
        </Svg>

        <View style={styles.markerOverlayContainer} pointerEvents="box-none">
          {eventGroups.groups.map((group, idx) => {
            const { x, iconY } = group;
            const hitSize = MARKER_SIZE + 8;
            return (
              <Pressable
                key={`marker-press-${idx}`}
                style={[
                  styles.markerPressable,
                  {
                    left: x - hitSize / 2,
                    top: iconY - hitSize / 2,
                    width: hitSize,
                    height: hitSize,
                  },
                ]}
                onPress={(e) => {
                  const { pageX, pageY } = e.nativeEvent;
                  handleMarkerPress(group, pageX, pageY);
                }}
              />
            );
          })}
        </View>

        <View style={[styles.xAxisContainer, { width: scrollContentWidth }]}>
          {xAxisTicks.map((tickMs) => {
            const x = timeToX(tickMs);
            return (
              <View key={tickMs} style={[styles.xAxisTick, { left: x - 12 }]}>
                <Text style={[styles.xAxisLabel, { color: GRAPH_COLORS.mutedGrey }]}>{formatTimeLabel(tickMs)}</Text>
              </View>
            );
          })}
          {nowMs >= startMs && nowMs <= endMs && (
            <View style={[styles.currentTimeLabel, { left: nowX - 18 }]}>
              <Text style={[styles.currentTimeLabelText, { color: GRAPH_COLORS.darkBrown2 }]}>
                {formatCurrentTime(nowMs)}
              </Text>
            </View>
          )}
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
    // backgroundColor:"transparent",
  },
  yAxisTickRow: {
    position: "absolute",
    left: 0,
    width: Y_AXIS_WIDTH - 4,
    alignItems: "flex-end",
  },
  yAxisLabel: {
    fontSize: 8,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  svgChart: {
    backgroundColor: "transparent",
  },
  markerOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: X_AXIS_HEIGHT,
  },
  markerPressable: {
    position: "absolute",
    borderRadius: 12,
  },
  xAxisContainer: {
    height: X_AXIS_HEIGHT,
    position: "relative",
    marginTop: 2,
  },
  xAxisTick: {
    position: "absolute",
    width: 24,
    alignItems: "center",
    top: 0,
  },
  xAxisLabel: {
    fontSize: 7,
    fontWeight: "500",
  },
  currentTimeLabel: {
    position: "absolute",
    width: 36,
    alignItems: "center",
    top: 8,
  },
  currentTimeLabelText: {
    fontSize: 8,
    fontWeight: "600",
  },
  activeValueContainer: {
    position: "absolute",
    top: GRAPH_PADDING_TOP + 12,
    right: 8,
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
  infoButton: {
    position: "absolute",
    top: GRAPH_PADDING_TOP,
    left: Y_AXIS_WIDTH + 4,
    padding: 4,
  },
  legendOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 19,
  },
  legendCard: {
    position: "absolute",
    top: GRAPH_PADDING_TOP + 24,
    left: Y_AXIS_WIDTH + 8,
    padding: 12,
    borderRadius: 8,
    width: "55%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  legendLine: {
    width: 24,
    height: 2,
    marginRight: 10,
  },
  legendLineDashed: {
    width: 24,
    height: 0,
    borderTopWidth: 2,
    borderStyle: "dashed",
    marginRight: 10,
  },
  legendText: {
    fontSize: 13,
    flex: 1,
  },
});

export default CaffeineGraphNew;
