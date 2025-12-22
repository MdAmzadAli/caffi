import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  Text,
  ScrollView,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Text as SvgText } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DrinkEntry } from "@/store/caffeineStore";
import { getCaffeineSourceImage, resolveImageSource } from "@/utils/getCaffeineSourceImage";
import { getServingLabel } from "@/utils/getServingLabel";
import { calculateSingleEntryCurve } from "@/utils/singleEntryCurve";
import { generateSmoothPath } from "@/utils/graphUtils";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.9;

type CaffeineLogPopupProps = {
  visible: boolean;
  entry: DrinkEntry | null;
  onClose: () => void;
  onEdit?: (entry: DrinkEntry) => void;
  onDuplicate?: (entry: DrinkEntry) => void;
  onDelete?: (entry: DrinkEntry) => void;
};

const CAFFEINE_HALF_LIFE_HOURS = 5;

function calculateCaffeineStats(entry: DrinkEntry | null) {
  if (!entry) {
    return {
      peakMg: 0,
      currentMg: 0,
      totalMg: 0,
      peakTimeLabel: "",
      currentTimeLabel: "",
      hoursElapsed: 0,
    };
  }

  const now = new Date();
  const entryTime = new Date(entry.timestamp);
  const hoursElapsed = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
  
  const totalMg = entry.caffeineAmount;
  const peakMg = entry.caffeineAmount;
  
  // Use exponential decay: at t=0 shows full dose, decays with 5-hour half-life
  const remainingFactor = Math.pow(0.5, hoursElapsed / CAFFEINE_HALF_LIFE_HOURS);
  const currentMg = totalMg * remainingFactor;
  
  const peakTimeLabel = entryTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  
  const currentTimeLabel = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    peakMg: Math.round(peakMg * 10) / 10,
    currentMg: Math.round(Math.max(0, currentMg) * 10) / 10,
    totalMg: Math.round(totalMg * 10) / 10,
    peakTimeLabel,
    currentTimeLabel,
    hoursElapsed,
  };
}

function useDecayPath(entry: DrinkEntry | null, curveColor: string) {
  const width = Dimensions.get("window").width - Spacing.lg * 2;
  const height = 160;
  const maxY = height - 10;
  const minY = 10;
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 60000); // Update every 60 seconds (1 minute)
    return () => clearInterval(interval);
  }, []);

  const caffeineStats = useMemo(() => calculateCaffeineStats(entry), [entry, updateTrigger]);

  const { path, area, peak, peakTimeLabel, peakDateLabel, timeLabels } = useMemo(() => {
    if (!entry) {
      return { path: "", area: "", peak: { x: 0, y: height }, peakTimeLabel: "", peakDateLabel: "", timeLabels: [] };
    }

    // Get decay curve samples
    const samples = calculateSingleEntryCurve(entry, 5, CAFFEINE_HALF_LIFE_HOURS);
    
    const entryMs = new Date(entry.timestamp).getTime();
    const endMs = entryMs + 12 * 3600000;
    const maxMg = entry.caffeineAmount;
    
    // Find peak
    let peakMg = 0;
    let peakIdx = 0;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].mg > peakMg) {
        peakMg = samples[i].mg;
        peakIdx = i;
      }
    }

    // Convert samples to canvas points
    const points: { x: number; y: number }[] = samples.map((sample) => {
      const ratio = (sample.t - entryMs) / (endMs - entryMs);
      const x = ratio * width;
      const yRatio = sample.mg > 0 ? Math.min(sample.mg / maxMg, 1) : 0;
      const y = maxY - yRatio * (maxY - minY);
      return { x, y };
    });

    // Generate smooth path
    const pathStr = generateSmoothPath(points, 0.3);
    const areaStr = `${pathStr} L ${width} ${maxY} L 0 ${maxY} Z`;

    // Peak position
    const peak = { x: points[peakIdx].x, y: points[peakIdx].y };

    // Time labels
    const date = new Date(entry.timestamp);
    const peakTime = new Date(samples[peakIdx].t);
    const now = new Date();
    const peakPassed = peakTime.getTime() < now.getTime();
    
    const peakTimeLabel = peakTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    
    const peakDateLabel = peakPassed ? peakTime.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }) : "";

    const startLabel = date.toLocaleTimeString("en-US", { hour: "numeric" });
    const endLabel = new Date(endMs).toLocaleTimeString("en-US", { hour: "numeric" });

    const timeLabels = [
      { x: 0, label: startLabel },
      { x: width * 0.25, label: new Date(entryMs + 3 * 3600000).toLocaleTimeString("en-US", { hour: "numeric" }) },
      { x: width * 0.5, label: new Date(entryMs + 6 * 3600000).toLocaleTimeString("en-US", { hour: "numeric" }) },
      { x: width * 0.75, label: new Date(entryMs + 9 * 3600000).toLocaleTimeString("en-US", { hour: "numeric" }) },
      { x: width, label: endLabel },
    ];

    return {
      path: pathStr,
      area: areaStr,
      peak,
      peakTimeLabel,
      peakDateLabel,
      timeLabels,
    };
  }, [entry, height, width, maxY, minY]);

  return { width, height, path, area, peak, peakTimeLabel, peakDateLabel, curveColor, caffeineStats, timeLabels };
}

export function CaffeineLogPopup({
  visible,
  entry,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: CaffeineLogPopupProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetHeight = Math.min(SHEET_MAX_HEIGHT, SCREEN_HEIGHT - 40);
  const translateY = useSharedValue(sheetHeight);

  const curveColor = theme.darkBrown2; // matches home graph stroke color
  const areaStart = isDark ? theme.backgroundTertiary : theme.accentGold + "1A";
  const areaEnd = isDark ? theme.backgroundSecondary : theme.accentGold + "0D";

  const { width, height, path, area, peak, peakTimeLabel, peakDateLabel, caffeineStats, timeLabels } = useDecayPath(entry, curveColor);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0);
    } else {
      translateY.value = sheetHeight;
    }
  }, [visible, translateY, sheetHeight]);

  const closeSheet = () => {
    translateY.value = withTiming(sheetHeight, { duration: 180 }, () => {
      runOnJS(onClose)();
    });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const next = startY.value + event.translationY;
      translateY.value = Math.min(Math.max(0, next), sheetHeight);
    })
    .onEnd((event) => {
      const shouldClose = translateY.value > sheetHeight * 0.5 || event.velocityY > 1200;
      if (shouldClose) {
        translateY.value = withTiming(sheetHeight, { duration: 180 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible || !entry) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheetContainer, sheetStyle]}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: theme.backgroundRoot,
                  maxHeight: sheetHeight,
                  paddingBottom: Spacing["2xl"] + insets.bottom,
                },
              ]}
            >
              <View style={styles.handle} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Spacing.lg }}
              >
                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSecondary }]}>
                    {entry.imageUri && resolveImageSource(entry.imageUri) ? (
                      <Image
                        source={resolveImageSource(entry.imageUri)}
                        style={styles.icon}
                        resizeMode="cover"
                      />
                    ) : getCaffeineSourceImage(entry.category) ? (
                      <Image
                        source={getCaffeineSourceImage(entry.category)}
                        style={styles.icon}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.iconEmoji}>☕</Text>
                    )}
                  </View>
                  <View style={styles.headerTextWrap}>
                    <Text style={[styles.mutedText, { color: theme.mutedGrey }]}>
                      You drank {getServingLabel(entry.servingSize).quantity} {getServingLabel(entry.servingSize).unit} of
                    </Text>
                    <Text style={[styles.title, { color: theme.text }]}>{entry.name}</Text>
                  </View>
                </View>

                {/* Graph */}
                <View style={styles.graphWrap}>
                  <Svg width={width} height={height + 30}>
                    <Defs>
                      <LinearGradient id="decayArea" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={areaStart} stopOpacity="0.6" />
                        <Stop offset="1" stopColor={areaEnd} stopOpacity="0.1" />
                      </LinearGradient>
                    </Defs>
                    <Path d={area} fill="url(#decayArea)" />
                    <Path d={path} stroke={curveColor} strokeWidth={3} fill="none" />

                    {/* Peak marker */}
                    <Circle cx={peak.x} cy={peak.y} r={6} fill={theme.danger} />
                    {peakDateLabel && (
                      <SvgText
                        x={peak.x}
                        y={peak.y - 25}
                        fontSize={11}
                        fill={theme.danger}
                        textAnchor="middle"
                      >
                        {peakDateLabel}
                      </SvgText>
                    )}
                    <SvgText
                      x={peak.x}
                      y={peak.y - (peakDateLabel ? 12 : 10)}
                      fontSize={12}
                      fill={theme.danger}
                      textAnchor="middle"
                    >
                      {peakTimeLabel}
                    </SvgText>

                    {/* X-axis time labels */}
                    {timeLabels.map((item, idx) => (
                      <SvgText
                        key={idx}
                        x={item.x}
                        y={height + 20}
                        fontSize={11}
                        fill={theme.mutedGrey}
                        textAnchor={idx === 0 ? "start" : idx === timeLabels.length - 1 ? "end" : "middle"}
                      >
                        {item.label}
                      </SvgText>
                    ))}
                  </Svg>
                  <View style={styles.graphRightText}>
                    <Text style={[styles.addsText, { color: theme.darkBrown }]}>adds {caffeineStats.currentMg} mg</Text>
                    <Text style={[styles.nowText, { color: theme.mutedGrey }]}>now</Text>
                  </View>
                  {/* Start/End time labels */}
                  <View style={styles.graphTimeRow}>
                    <Text style={[styles.graphTimeLabel, { color: theme.mutedGrey }]}>{caffeineStats.peakTimeLabel}</Text>
                    <Text style={[styles.graphTimeLabel, { color: theme.mutedGrey }]}>{caffeineStats.currentTimeLabel}</Text>
                  </View>
                </View>

                {/* Breakdown */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Drink contribution to caffeine levels
                  </Text>
                  <View style={[styles.divider, { borderBottomColor: theme.divider }]} />
                  <Row label={`At peak (${caffeineStats.peakTimeLabel})`} value={`${caffeineStats.peakMg} mg`} themeColor={theme} />
                  <Row label="Now" value={`${caffeineStats.currentMg} mg`} themeColor={theme} />
                  <Row label="In total (over time)" value={`${caffeineStats.totalMg} mg`} themeColor={theme} />
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <ActionButton
                    label="Edit"
                    icon="edit-3"
                    onPress={() => onEdit?.(entry)}
                    themeColor={theme.text}
                    bg={theme.backgroundSecondary}
                  />
                  <ActionButton
                    label="Duplicate"
                    icon="copy"
                    onPress={() => onDuplicate?.(entry)}
                    themeColor={theme.text}
                    bg={theme.backgroundSecondary}
                  />
                  <ActionButton
                    label="Delete"
                    icon="trash"
                    onPress={() => onDelete?.(entry)}
                    themeColor={theme.danger}
                    bg={theme.backgroundSecondary}
                  />
                </View>
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

type RowProps = {
  label: string;
  value: string;
  themeColor: any;
};

function Row({ label, value, themeColor }: RowProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: themeColor.text }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: themeColor.text }]}>{value}</Text>
    </View>
  );
}

type ActionButtonProps = {
  label: string;
  icon: any;
  onPress?: () => void;
  themeColor: string;
  bg: string;
};

function ActionButton({ label, icon, onPress, themeColor, bg }: ActionButtonProps) {
  return (
    <Pressable style={[styles.actionButton, { backgroundColor: bg }]} onPress={onPress}>
      <Feather name={icon} size={18} color={themeColor} />
      <Text style={[styles.actionLabel, { color: themeColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
    paddingTop: Spacing.lg,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  iconEmoji: {
    fontSize: 28,
    lineHeight: 28,
  },
  headerTextWrap: {
    flex: 1,
  },
  mutedText: {
    fontSize: 14,
    fontWeight: "500",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  graphWrap: {
    marginBottom: Spacing.lg,
  },
  graphRightText: {
    position: "absolute",
    right: 0,
    top: 16,
    alignItems: "flex-end",
  },
  addsText: {
    fontSize: 20,
    fontWeight: "800",
  },
  nowText: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  graphTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  graphTimeLabel: {
    fontSize: 11,
  },
});

