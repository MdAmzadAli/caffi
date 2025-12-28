import React, { useMemo, useState, useRef } from "react";
import { View, StyleSheet, Text, Pressable, ScrollView, Modal, TouchableWithoutFeedback } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getActiveAtTime, getSleepWindowStatusMessage, CaffeineEvent } from "@/utils/graphUtils";

interface DayData {
  day: number;
  caffeineAtSleep: number | null;
  statusColor: string;
  isToday: boolean;
}

const CAFFEINE_HALF_LIFE_HOURS = 5;

export default function SleepTargetScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { entries, profile } = useCaffeineStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showInfo, setShowInfo] = useState(false);
  const infoIconRef = useRef<View>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });

  const optimalCaffeine = profile.optimalCaffeine || 100;
  const sleepTime = profile.sleepTime || "23:00";
  const [sleepHour, sleepMinute] = sleepTime.split(":").map(Number);
  const halfLifeHours = 5.5;

  const handleInfoPress = () => {
    infoIconRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setPopoverPos({ top: pageY + height + 5, right: Spacing.lg });
      setShowInfo(true);
    });
  };

  const getMaxCaffeineInSleepWindow = (date: Date): number => {
    const sleepDateTime = new Date(date);
    sleepDateTime.setHours(sleepHour, sleepMinute, 0, 0);
    const endSleepWindow = new Date(sleepDateTime.getTime() + 6 * 3600000);

    const graphEvents: CaffeineEvent[] = entries.map((e) => ({
      id: e.id,
      name: e.name,
      mg: e.caffeineAmount,
      timestampISO: typeof e.timestamp === 'string' ? e.timestamp : new Date(e.timestamp).toISOString(),
    }));

    let maxCaffeine = 0;
    const stepMs = 15 * 60 * 1000;
    for (let t = sleepDateTime.getTime(); t <= endSleepWindow.getTime(); t += stepMs) {
      const mg = getActiveAtTime(graphEvents, t, halfLifeHours);
      if (mg > maxCaffeine) maxCaffeine = mg;
    }
    return Math.round(maxCaffeine);
  };

  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: (DayData | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isFuture = date > today;
      const isToday = date.getTime() === today.getTime();

      if (isFuture) {
        days.push({
          day,
          caffeineAtSleep: null,
          statusColor: theme.mutedGrey,
          isToday,
        });
      } else {
        const caffeineAtSleep = getMaxCaffeineInSleepWindow(date);
        const { color } = getSleepWindowStatusMessage(caffeineAtSleep);
        const hexColor =
          color === "green"
            ? theme.blue
            : color === "brown"
              ? theme.accentGold
              : "#D9534F"; // dangerRed

        days.push({
          day,
          caffeineAtSleep,
          statusColor: hexColor,
          isToday,
        });
      }
    }

    return days;
  }, [currentMonth, entries, optimalCaffeine, sleepHour, sleepMinute, theme, halfLifeHours]);

  const { successDays, currentStreak } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let countSuccess = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const caffeine = getMaxCaffeineInSleepWindow(checkDate);
      const isSuccess = caffeine < 30; // Threshold for green status

      if (checkDate.getMonth() === currentMonth.getMonth() && 
          checkDate.getFullYear() === currentMonth.getFullYear()) {
        if (isSuccess) countSuccess++;
      }

      if (i === 0 || (streak > 0 || (i === 1 && getMaxCaffeineInSleepWindow(today) < 30))) {
        if (isSuccess) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    return { successDays: countSuccess, currentStreak: streak };
  }, [entries, currentMonth, sleepHour, sleepMinute]);

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Analytic</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Sleep target</Text>
        <Text style={[styles.description, { color: theme.mutedGrey }]}>
          How often are you going to bed with safe caffeine amounts?
        </Text>

        <View style={styles.navigatorContainer}>
          <View style={[styles.monthNavigator, { backgroundColor: theme.cardBg }]}>
            <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
              <Feather name="chevron-left" size={20} color={theme.text} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
            <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
              <Feather name="chevron-right" size={20} color={theme.text} />
            </Pressable>
          </View>
          <View ref={infoIconRef}>
            <Pressable 
              onPress={handleInfoPress}
              hitSlop={12}
              style={styles.infoIcon}
            >
              <Feather name="info" size={20} color={theme.mutedGrey} />
            </Pressable>
          </View>
        </View>

        <Modal
          visible={showInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfo(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowInfo(false)}>
            <View style={styles.modalOverlay}>
              <View style={[
                styles.popover, 
                { 
                  backgroundColor: theme.cardBg,
                  top: popoverPos.top,
                  right: popoverPos.right
                }
              ]}>
                <Text style={[styles.popoverTitle, { color: theme.text }]}>What this represents</Text>
                <Text style={[styles.popoverText, { color: theme.text }]}>
                  The mg value below each date shows the <Text style={{fontWeight: '700'}}>peak caffeine level</Text> predicted during your 6-hour sleep window (bedtime to +6 hours).
                </Text>
                <View style={styles.popoverLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.blue }]} />
                    <Text style={[styles.legendLabel, { color: theme.text }]}>Safe ( &lt; 30mg)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.accentGold }]} />
                    <Text style={[styles.legendLabel, { color: theme.text }]}>Warning (30-40mg)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#D9534F" }]} />
                    <Text style={[styles.legendLabel, { color: theme.text }]}>High ( &gt; 40mg)</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View style={styles.calendarGrid}>
          {weekDays.map((d) => (
            <View key={d} style={styles.weekDayHeader}>
              <Text style={[styles.weekDayText, { color: theme.mutedGrey }]}>{d}</Text>
            </View>
          ))}

          {monthData.map((dayData, idx) => (
            <View key={idx} style={styles.dayCell}>
              {dayData ? (
                <View style={styles.dayCellContent}>
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: dayData.isToday ? theme.accentGold : theme.text },
                    ]}
                  >
                    {dayData.day}
                  </Text>
                  {dayData.caffeineAtSleep !== null && (
                    <Text style={[styles.caffeineLabel, { color: dayData.statusColor }]}>
                      {dayData.caffeineAtSleep} mg
                    </Text>
                  )}
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <Text style={[styles.summaryText, { color: theme.text }]}>
          Days where you had less than 30 mg at your chosen bedtime window.
        </Text>

        <View style={styles.streakSection}>
          <Text style={[styles.streakLabel, { color: theme.text }]}>Current streak:</Text>
          <View style={styles.streakValue}>
            <Feather name="check-circle" size={24} color={theme.blue} />
            <Text style={[styles.streakNumber, { color: theme.text }]}>
              {currentStreak} days
            </Text>
          </View>
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  navigatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  monthNavigator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    flex: 1,
    marginRight: Spacing.md,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  infoIcon: {
    padding: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
  },
  popover: {
    position: 'absolute',
    width: 260,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  popoverTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  popoverText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  popoverLegend: {
    gap: 4,
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
  legendLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: Spacing.xl,
  },
  weekDayHeader: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: 'uppercase',
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 2,
  },
  dayCellContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  caffeineLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing["2xl"],
  },
  streakSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  streakValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: "700",
  },
});
