import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Text as SvgText } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DrinkEntry } from "@/store/caffeineStore";
import { getCaffeineSourceImage, resolveImageSource } from "@/utils/getCaffeineSourceImage";
import { getServingLabel } from "@/utils/getServingLabel";
import { calculateSingleEntryCurve } from "@/utils/singleEntryCurve";
import { generateSmoothPath, remainingAfterHours } from "@/utils/graphUtils";
import { useRealTimeNow } from "@/hooks/useRealTimeNow";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { BottomSheetModal } from "./BottomSheetModal";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.63;
const CAFFEINE_HALF_LIFE_HOURS = 5;

type CaffeineLogPopupProps = {
  visible: boolean;
  entry: DrinkEntry | null;
  onClose: () => void;
  onEdit?: (entry: DrinkEntry) => void;
  onDuplicate?: (entry: DrinkEntry) => void;
  onDelete?: (entry: DrinkEntry) => void;
};

function formatRelativeDate(date: Date, formatDate: (d: Date) => string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return formatDate(date);
}

function calculateCaffeineStats(entry: DrinkEntry | null, nowMs: number, formatDate: (d: Date) => string) {
  if (!entry) return { peakMg: 0, currentMg: 0, totalMg: 0, peakTimeLabel: "", peakDateLabel: "", currentTimeLabel: "", hoursElapsed: 0 };
  const now = new Date(nowMs);
  const entryTime = new Date(entry.timestamp);
  const hoursElapsed = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
  const totalMg = entry.caffeineAmount;
  const currentMg = remainingAfterHours(totalMg, hoursElapsed, CAFFEINE_HALF_LIFE_HOURS);
  const samples = calculateSingleEntryCurve(entry, 5, CAFFEINE_HALF_LIFE_HOURS);
  let peakMg = 0, peakIdx = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].mg > peakMg) { peakMg = samples[i].mg; peakIdx = i; }
  }
  const peakTime = new Date(samples[peakIdx].t);
  const peakTimeLabel = peakTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const peakPassed = peakTime.getTime() < now.getTime();
  const peakDateLabel = peakPassed ? formatRelativeDate(peakTime, formatDate) : "";
  const currentTimeLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { peakMg: Math.round(peakMg * 10) / 10, currentMg: Math.round(currentMg * 10) / 10, totalMg: Math.round(totalMg * 10) / 10, peakTimeLabel, peakDateLabel, currentTimeLabel, hoursElapsed };
}

function useDecayPath(entry: DrinkEntry | null, curveColor: string, formatDate: (d: Date) => string) {
  const width = Dimensions.get("window").width - Spacing.lg * 2;
  const height = 160;
  const maxY = height - 10;
  const minY = 10;
  const realTimeNow = useRealTimeNow();
  const caffeineStats = useMemo(() => calculateCaffeineStats(entry, realTimeNow, formatDate), [entry, realTimeNow, formatDate]);
  const data = useMemo(() => {
    if (!entry) return { path: "", area: "", peak: { x: 0, y: height }, peakTimeLabel: "", peakDateLabel: "", timeLabels: [] };
    const samples = calculateSingleEntryCurve(entry, 5, CAFFEINE_HALF_LIFE_HOURS);
    const entryMs = new Date(entry.timestamp).getTime();
    const endMs = entryMs + 12 * 3600000;
    const maxMg = entry.caffeineAmount;
    let peakMg = 0, peakIdx = 0;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].mg > peakMg) { peakMg = samples[i].mg; peakIdx = i; }
    }
    const points = samples.map((sample) => {
      const ratio = (sample.t - entryMs) / (endMs - entryMs);
      const x = ratio * width;
      const yRatio = sample.mg > 0 ? Math.min(sample.mg / maxMg, 1) : 0;
      const y = maxY - yRatio * (maxY - minY);
      return { x, y };
    });
    const pathStr = generateSmoothPath(points, 0.3);
    const areaStr = `${pathStr} L ${width} ${maxY} L 0 ${maxY} Z`;
    const peak = { x: points[peakIdx].x, y: points[peakIdx].y };
    const peakTime = new Date(samples[peakIdx].t);
    const now = new Date();
    const peakPassed = peakTime.getTime() < now.getTime();
    const peakTimeLabel = peakTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const peakDateLabel = peakPassed ? formatRelativeDate(peakTime, formatDate) : "";
    const timeLabels = [
      { x: 0, label: new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "numeric" }) },
      { x: width * 0.25, label: new Date(entryMs + 3 * 3600000).toLocaleTimeString("en-US", { hour: "numeric" }) },
      { x: width * 0.5, label: new Date(entryMs + 6 * 3600000).toLocaleTimeString("en-US", { hour: "numeric" }) },
      { x: width * 0.75, label: new Date(entryMs + 9 * 3600000).toLocaleTimeString("en-US", { hour: "numeric" }) },
      { x: width, label: new Date(endMs).toLocaleTimeString("en-US", { hour: "numeric" }) },
    ];
    return { path: pathStr, area: areaStr, peak, peakTimeLabel, peakDateLabel, timeLabels };
  }, [entry, height, width, maxY, minY, formatDate]);
  return { width, height, ...data, curveColor, caffeineStats };
}

export function CaffeineLogPopup({ visible, entry, onClose, onEdit, onDuplicate, onDelete }: CaffeineLogPopupProps) {
  const { theme, isDark } = useTheme();
  const { addEntry } = useCaffeineStore();
  const { formatDate } = useFormattedDate();
  const insets = useSafeAreaInsets();
  const sheetHeight = Math.min(SHEET_MAX_HEIGHT, SCREEN_HEIGHT - 40);
  const curveColor = theme.darkBrown2;
  const areaStart = isDark ? theme.backgroundTertiary : theme.accentGold + "1A";
  const areaEnd = isDark ? theme.backgroundSecondary : theme.accentGold + "0D";
  const [shouldRenderGraph, setShouldRenderGraph] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShouldRenderGraph(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShouldRenderGraph(false);
    }
  }, [visible]);

  const { width, height, path, area, peak, peakTimeLabel, peakDateLabel, caffeineStats, timeLabels } = useDecayPath(
    shouldRenderGraph ? entry : null, 
    curveColor,
    formatDate
  );

  if (!entry) return null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      maxHeight={sheetHeight}
    >
      <View
        style={{ paddingBottom: Spacing.lg }}
      >
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSecondary }]}>
            {entry.imageUri && resolveImageSource(entry.imageUri) ? (
              <Image source={resolveImageSource(entry.imageUri)} style={styles.icon} resizeMode="cover" />
            ) : getCaffeineSourceImage(entry.category) ? (
              <Image source={getCaffeineSourceImage(entry.category)} style={styles.icon} resizeMode="cover" />
            ) : (
              <Text style={styles.iconEmoji}>☕</Text>
            )}
          </View>
          <View style={styles.headerTextWrap}>
            {(() => {
              const INBUILT_CATEGORIES = ["coffee", "tea", "energy", "soda", "chocolate"];
              const isCustom = entry.category === "custom" || !INBUILT_CATEGORIES.includes(entry.category);
              const drink = !isCustom ? require("@/store/caffeineStore").DRINK_DATABASE.find((d: any) => d.id === entry.drinkId && d.category === entry.category) : null;
              const label = getServingLabel(entry.servingSize, entry.unit, drink?.defaultServingMl, isCustom);
              return (
                <Text style={[styles.mutedText, { color: theme.mutedGrey }]}>
                  You {entry.category === "chocolate" ? "ate" : "drank"} {label.quantity} {label.unit} of
                </Text>
              );
            })()}
            <Text style={[styles.title, { color: theme.text }]}>{entry.name}</Text>
          </View>
        </View>

        <View style={styles.graphWrap}>
          <View style={{ width, height: height + 30 }}>
            {shouldRenderGraph && (
              <Svg width={width} height={height + 30}>
              <Defs>
                <LinearGradient id="decayArea" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={areaStart} stopOpacity="0.6" />
                  <Stop offset="1" stopColor={areaEnd} stopOpacity="0.1" />
                </LinearGradient>
              </Defs>
              <Path d={area} fill="url(#decayArea)" />
              <Path d={path} stroke={curveColor} strokeWidth={3} fill="none" />
              <Circle cx={peak.x} cy={peak.y} r={6} fill={theme.danger} />
              {peakDateLabel && (
                <SvgText x={peak.x} y={peak.y - 25} fontSize={11} fontWeight={500} fill={theme.danger} textAnchor="middle">{peakDateLabel}</SvgText>
              )}
              <SvgText x={peak.x} y={peak.y - (peakDateLabel ? 12 : 10)} fontWeight={500}  fontSize={12} fill={theme.danger} textAnchor="middle">{peakTimeLabel}</SvgText>
              {timeLabels.map((item, idx) => (
                <SvgText key={idx} x={item.x} y={height + 20} fontSize={11} fill={theme.mutedGrey} textAnchor={idx === 0 ? "start" : idx === timeLabels.length - 1 ? "end" : "middle"}>
                  {item.label}
                </SvgText>
              ))}
               </Svg>
                )}
              </View>
          <View style={styles.graphRightText}>
            <Text style={[styles.addsText, { color: theme.darkBrown }]}>adds {parseFloat(caffeineStats.currentMg.toFixed(1))} mg</Text>
            <Text style={[styles.nowText, { color: theme.mutedGrey }]}>now</Text>
          </View>
          <View style={styles.graphTimeRow}>
            <Text style={[styles.graphTimeLabel, { color: theme.mutedGrey }]}>
              {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Drink contribution to caffeine levels</Text>
          <View style={[styles.divider, { borderBottomColor: theme.divider }]} />
          <Row label={`At peak (${caffeineStats.peakTimeLabel})`} value={`${parseFloat(caffeineStats.peakMg.toFixed(1))} mg`} themeColor={theme} />
          <Row label="Now" value={`${parseFloat(caffeineStats.currentMg.toFixed(1))} mg`} themeColor={theme} />
          <Row label="In total (over time)" value={`${parseFloat(caffeineStats.totalMg.toFixed(1))} mg`} themeColor={theme} />
        </View>

        <View style={styles.actionsRow}>
          <ActionButton label="Edit" icon="edit-3" onPress={() => onEdit?.(entry)} themeColor={theme.text} bg={theme.backgroundSecondary} />
          <ActionButton label="Duplicate" icon="copy" onPress={() => {
            if (entry) {
              const INBUILT_CATEGORIES = ["coffee", "tea", "energy", "soda", "chocolate"];
              const isCustom = entry.category === "custom" || !INBUILT_CATEGORIES.includes(entry.category);
              const drinkSnapshot = {
                id: entry.drinkId,
                name: entry.name,
                category: entry.category as any,
                caffeinePer100ml: isCustom ? entry.caffeineAmount / entry.servingSize : (entry.caffeineAmount / entry.servingSize) * 100,
                defaultServingMl: entry.servingSize,
                icon: "coffee" as const,
                sizes: [],
                imageUri: entry.imageUri,
              };
              addEntry(drinkSnapshot, entry.servingSize, entry.notes, entry.isFavorite, new Date(), entry.unit, entry.imageUri);
              onClose();
            }
          }} themeColor={theme.text} bg={theme.backgroundSecondary} />
          <ActionButton label="Delete" icon="trash" onPress={() => onDelete?.(entry)} themeColor={theme.danger} bg={theme.backgroundSecondary} />
        </View>
      </View>
    </BottomSheetModal>
  );
}

function Row({ label, value, themeColor }: { label: string; value: string; themeColor: any }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: themeColor.text }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: themeColor.text }]}>{value}</Text>
    </View>
  );
}

function ActionButton({ label, icon, onPress, themeColor, bg }: { label: string; icon: any; onPress?: () => void; themeColor: string; bg: string }) {
  return (
    <Pressable style={[styles.actionButton, { backgroundColor: bg }]} onPress={onPress}>
      <Feather name={icon} size={18} color={themeColor} />
      <Text style={[styles.actionLabel, { color: themeColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg },
  iconWrap: { width: 52, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: Spacing.md, overflow: "hidden" },
  icon: { width: 52, height: 52, borderRadius: 14 },
  iconEmoji: { fontSize: 28, lineHeight: 28 },
  headerTextWrap: { flex: 1 },
  mutedText: { fontSize: 14, fontWeight: "500" },
  title: { fontSize: 22, fontWeight: "800", marginTop: 2 },
  graphWrap: { marginBottom: Spacing.lg },
  graphRightText: { position: "absolute", right: 0, top: 16, alignItems: "flex-end" },
  addsText: { fontSize: 20, fontWeight: "800" },
  nowText: { fontSize: 14, marginTop: 2 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: Spacing.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: Spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.xs },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: "800" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", gap: Spacing.sm },
  actionButton: { flex: 1, height: 64, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 4 },
  actionLabel: { fontSize: 13, fontWeight: "600" },
  graphTimeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.xs },
  graphTimeLabel: { fontSize: 11 },
});
