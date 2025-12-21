import React, { useEffect, useMemo } from "react";
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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

// Build a simple decay curve for the single entry to mirror home graph color
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
    currentMg: Math.round(currentMg * 10) / 10,
    totalMg: Math.round(totalMg * 10) / 10,
    peakTimeLabel,
    currentTimeLabel,
    hoursElapsed,
  };
}

function useDecayPath(entry: DrinkEntry | null, curveColor: string) {
  const width = Dimensions.get("window").width - Spacing.lg * 2;
  const height = 160;

  const caffeineStats = useMemo(() => calculateCaffeineStats(entry), [entry]);

  const { path, area, peak, peakTimeLabel, timeLabels } = useMemo(() => {
    if (!entry) {
      return { path: "", area: "", peak: { x: 0, y: height }, peakTimeLabel: "", timeLabels: [] };
    }
    
    const entryTime = new Date(entry.timestamp);
    const now = new Date();
    const hoursElapsed = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
    const hoursToShow = Math.max(12, hoursElapsed + 2);
    
    const startX = 0;
    const startY = height;
    const peakX = width * 0.08;
    const peakY = height * 0.15;
    
    const nowX = Math.min((hoursElapsed / hoursToShow) * width, width * 0.95);
    const decayFactor = Math.pow(0.5, hoursElapsed / CAFFEINE_HALF_LIFE_HOURS);
    const nowY = height * 0.15 + (height * 0.7) * (1 - decayFactor);
    
    const endX = width;
    const endDecayFactor = Math.pow(0.5, hoursToShow / CAFFEINE_HALF_LIFE_HOURS);
    const endY = height * 0.15 + (height * 0.7) * (1 - endDecayFactor);

    const cp1x = width * 0.02;
    const cp1y = height * 0.1;
    const cp2x = width * 0.12;
    const cp2y = height * 0.05;

    const cp3x = width * 0.35;
    const cp3y = height * 0.35;

    const pathStr = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${peakX} ${peakY} S ${cp3x} ${cp3y}, ${endX} ${endY}`;
    const areaStr = `${pathStr} L ${endX} ${height} L ${startX} ${height} Z`;

    const date = new Date(entry.timestamp);
    const timeLabel = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const startLabel = new Date(entryTime.getTime() - 1000 * 60 * 60).toLocaleTimeString("en-US", { hour: "numeric" });
    const endLabel = new Date(entryTime.getTime() + hoursToShow * 1000 * 60 * 60).toLocaleTimeString("en-US", { hour: "numeric" });
    
    const midHours = [2, 4, 6, 8, 10];
    const labels = midHours
      .filter(h => h < hoursToShow)
      .map(h => ({
        x: (h / hoursToShow) * width,
        label: new Date(entryTime.getTime() + h * 1000 * 60 * 60).toLocaleTimeString("en-US", { hour: "numeric" }),
      }));

    return {
      path: pathStr,
      area: areaStr,
      peak: { x: peakX, y: peakY },
      peakTimeLabel: timeLabel,
      timeLabels: [
        { x: 0, label: startLabel },
        ...labels,
        { x: width, label: endLabel },
      ],
    };
  }, [entry, height, width]);

  return { width, height, path, area, peak, peakTimeLabel, curveColor, caffeineStats, timeLabels };
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

  const { width, height, path, area, peak, peakTimeLabel, caffeineStats, timeLabels } = useDecayPath(entry, curveColor);
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
                    <Image
                      source={require("@/assets/images/icon.png")}
                      style={styles.icon}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.headerTextWrap}>
                    <Text style={[styles.mutedText, { color: theme.mutedGrey }]}>
                      You drank 1 cup of
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
                    <SvgText
                      x={peak.x}
                      y={peak.y - 10}
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

