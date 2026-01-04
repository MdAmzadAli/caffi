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
import { useFormattedTime } from "@/hooks/useFormattedTime";
import { Spacing } from "@/constants/theme";

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
const X_AXIS_HEIGHT = 17;
const GRAPH_PADDING_TOP = 8;
const GRAPH_PADDING_BOTTOM = 8;
const MARKER_SIZE = 18;
const MARKER_IMAGE_SIZE = 20;
const HOURS_VISIBLE = 12;
const GROUP_PROXIMITY_PX = 22;
const HOURS_PER_DAY = 24;
const EDGE_THRESHOLD = 50;
const MAX_SAMPLE_POINTS = 5000; // Limit curve calculation points
const SLIDING_WINDOW_DAYS = 14; 

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
// ADD this RIGHT BEFORE the CaffeineGraphNew export function:

interface MarkerImageProps {
  x: number;
  y: number;
  size: number;
  imageUri?: string;
  category: string;
  clipId: string;
  fallbackColor: string;
}

const MarkerImage = React.memo(({ x, y, size, imageUri, category, clipId, fallbackColor }: MarkerImageProps) => {
  const [imageError, setImageError] = useState(false);
  const resolvedImage = useMemo(() => {
    const categoryImage = CATEGORY_IMAGES[category];
    return resolveImageSource(imageUri) || categoryImage;
  }, [imageUri, category]);

  // Check if image is a valid require() module or URI
  const isValidImage = useMemo(() => {
    if (!resolvedImage) return false;
    // Local requires return a number (module ID)
    if (typeof resolvedImage === 'number') return true;
    // Valid URI string
    if (typeof resolvedImage === 'string' && resolvedImage.length > 0) return true;
    // Object with uri property (React Native image source)
    if (typeof resolvedImage === 'object' && resolvedImage?.uri) return true;
    return false;
  }, [resolvedImage]);

  if (!isValidImage || imageError) {
    // Fallback to emoji
    return (
      <SvgText
        x={x}
        y={y + 3}
        fontSize={14}
        textAnchor="middle"
        fill={fallbackColor}
      >
        ☕
      </SvgText>
    );
  }

  return (
    <SvgImage
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      href={resolvedImage}
      clipPath={`url(#${clipId})`}
      preserveAspectRatio="xMidYMid slice"
      onError={() => setImageError(true)}
    />
  );
});
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
  const { formatTime: formatTimeHook } = useFormattedTime();
  const GRAPH_COLORS = isDark ? DARK_GRAPH_COLORS : LIGHT_GRAPH_COLORS;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  const viewWindowHours = (dayWindowEnd - dayWindowStart + 1) * HOURS_PER_DAY;
  const graphHeight = windowHeight * 0.32;
  const chartHeight = graphHeight - X_AXIS_HEIGHT - GRAPH_PADDING_TOP - GRAPH_PADDING_BOTTOM;
  const scrollContentWidth = windowWidth * (viewWindowHours / HOURS_VISIBLE);
  const chartWidth = scrollContentWidth;
  const [viewportX, setViewportX] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(windowWidth);
  const lastScrollUpdate = useRef<number>(0);

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
    const totalPoints = Math.floor((endMs - startMs) / stepMs);

    // Adaptive sampling to prevent memory overflow
    if (totalPoints > MAX_SAMPLE_POINTS) {
      const adaptiveStep = Math.ceil((endMs - startMs) / MAX_SAMPLE_POINTS);
      for (let t = startMs; t <= endMs; t += adaptiveStep) {
        samples.push(t);
      }
    } else {
      for (let t = startMs; t <= endMs; t += stepMs) {
        samples.push(t);
      }
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
    const ticks = [];
    const step = yMax / 6;
    for (let i = 1; i <= 6; i++) {
      ticks.push(Math.round(i * step));
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
      // FIX: Use the actual scroll content width for precise calculation
      const totalDays = dayWindowEnd - dayWindowStart + 1;
      const pixelsPerDay = scrollContentWidth / totalDays;

      const offsetAdjustment = daysDelta * pixelsPerDay;
      const newScrollX = currentScrollXRef.current + offsetAdjustment;

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ 
          x: Math.max(0, newScrollX), 
          y: 0, 
          animated: false 
        });
      }, 0);
    }
    prevDayWindowStartRef.current = dayWindowStart;
  }, [dayWindowStart, dayWindowEnd, scrollContentWidth]);

  useEffect(() => {
    if (resetKey > 0 && scrollViewRef?.current) {
      prevDayWindowStartRef.current = dayWindowStart;
      currentScrollXRef.current = defaultScrollX;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: defaultScrollX, y: 0, animated: false });
      }, 50);
    }
  }, [resetKey]);
  

  // REPLACE the entire handleScroll function with this:

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      const contentWidth = event.nativeEvent.contentSize.width;
      const viewportWidthValue = event.nativeEvent.layoutMeasurement.width;
      const maxScrollX = contentWidth - viewportWidthValue;
      const now = Date.now();

      currentScrollXRef.current = scrollX;

      // Throttle viewport updates to every 100ms for performance
      if (now - lastScrollUpdate.current > 100) {
        lastScrollUpdate.current = now;
        setViewportX(scrollX);
        setViewportWidth(viewportWidthValue);
      }

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

      if (now - lastExtendRef.current < 100) return; // CHANGED: Reduced from 200ms to 100ms for faster response

      if (onExtendDays) {
        // CRITICAL: Trigger 3 screens away (increased from 2) for earlier preloading
        const preloadThreshold = viewportWidthValue * 3;

        // Extend right (future)
        if (scrollX >= maxScrollX - preloadThreshold) {
          lastExtendRef.current = now;
          onExtendDays('right');
        }

        // Extend left (past)
        if (scrollX <= preloadThreshold) {
          lastExtendRef.current = now;
          onExtendDays('left');
        }
      }
    },
    [onScrollOffsetChange, onExtendDays, nowMs, startMs, endMs, scrollContentWidth, windowWidth, dayWindowEnd, dayWindowStart]
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

  const visibleEventGroups = useMemo(() => {
    const bufferZone = windowWidth * 0.5; // 50% buffer on each side
    const visibleStart = viewportX - bufferZone;
    const visibleEnd = viewportX + viewportWidth + bufferZone;

    return eventGroups.groups.filter(group => 
      group.x >= visibleStart && group.x <= visibleEnd
    );
  }, [eventGroups.groups, viewportX, viewportWidth, windowWidth]);

  const visibleXAxisTicks = useMemo(() => {
    const bufferZone = windowWidth;
    const visibleStart = viewportX - bufferZone;
    const visibleEnd = viewportX + viewportWidth + bufferZone;

    return xAxisTicks.filter(tickMs => {
      const x = timeToX(tickMs);
      return x >= visibleStart && x <= visibleEnd;
    });
  }, [xAxisTicks, viewportX, viewportWidth, windowWidth, timeToX]);

  const visibleDateMarkers = useMemo(() => {
    const bufferZone = windowWidth;
    const visibleStart = viewportX - bufferZone;
    const visibleEnd = viewportX + viewportWidth + bufferZone;

    return dateMarkers.filter(marker => {
      const x = timeToX(marker.ms);
      return x >= visibleStart && x <= visibleEnd;
    });
  }, [dateMarkers, viewportX, viewportWidth, windowWidth, timeToX]);

  const handleMarkerPress = useCallback((group: EventGroup, pageX: number, pageY: number) => {
    if (group.events.length === 1) {
      onEventClick?.(group.events[0]);
    } else {
      onStackedEventsClick?.(group.events, { x: pageX, y: pageY });
    }
  }, [onEventClick, onStackedEventsClick]);
// , backgroundColor: GRAPH_COLORS.bg 
  return (
    <View style={[styles.container, { height: graphHeight}]}>
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
            <View style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: GRAPH_COLORS.green }]} />
              <View style={styles.legendTextContainer}>
                <Text style={[styles.legendText, { color: GRAPH_COLORS.darkBrown }]}>Your Sleep Threshold</Text>
                <Text style={[styles.legendSubtext, { color: GRAPH_COLORS.mutedGrey }]}>Caffeine level below this within your sleeping window won't disrupt sleep</Text>
              </View>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendLineDashed, { borderColor: GRAPH_COLORS.accentGold }]} />
              <View style={styles.legendTextContainer}>
                <Text style={[styles.legendText, { color: GRAPH_COLORS.darkBrown }]}>Your Optimal Daily Caffeine Level</Text>
                <Text style={[styles.legendSubtext, { color: GRAPH_COLORS.mutedGrey }]}>Above this level-Side effects like anxiety, jitters, or energy crashes become more likely</Text>
              </View>
            </View>
          </View>
        </>
      )}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        removeClippedSubviews={true}
        style={styles.scrollView}
        contentContainerStyle={{ width: scrollContentWidth, flexDirection: 'column', paddingBottom: 0 }}
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
            const clipId = `clip-${groupEvents[0].id}-${groupEvents[0].timestampISO}`;
            const count = groupEvents.length;

            return (
              <G key={`group-${groupEvents[0].id}-${groupEvents[0].timestampISO}`}>
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
                <MarkerImage
                  x={x}
                  y={iconY}
                  size={MARKER_IMAGE_SIZE}
                  imageUri={imageUri}
                  category={category}
                  clipId={clipId}
                  fallbackColor={GRAPH_COLORS.darkBrown}
                />
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
          {xAxisTicks.map((tickMs, index) => {
            if (index % 2 !== 0) return null;
            const x = timeToX(tickMs);
            return (
              <View key={tickMs} style={[styles.xAxisTick, { left: x - 12 }]}>
                <Text style={[styles.xAxisLabel, { color: GRAPH_COLORS.mutedGrey }]}>
                  {formatTimeHook(tickMs)}
                </Text>
              </View>
            );
          })}
          {nowMs >= startMs && nowMs <= endMs && (
            <View style={[styles.currentTimeLabel, { left: nowX - 18 }]}>
              <Text style={[styles.currentTimeLabelText, { color: GRAPH_COLORS.darkBrown2 }]}>
                {formatTimeHook(nowMs)}
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
    marginTop: -(X_AXIS_HEIGHT), // Negative margin to overlap
    bottom: 0,
    paddingBottom: 0,
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
    top: 18,
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
  legendRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginTop: 8,
  },
  legendLineDashed: {
    width: 20,
    height: 0,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 8,
  },
  legendText: {
    fontSize: 13,
    fontWeight: "700",
  },
  legendSubtext: {
    fontSize: 11,
    fontWeight: "400",
    marginTop: 2,
    lineHeight: 14,
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
  legendDescription: {
    fontSize: 12,
    marginTop: 4,
    color: "#666",
  }
});

export default CaffeineGraphNew;
