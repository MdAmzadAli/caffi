import React, { useMemo, useState, useRef } from "react";
import { View, StyleSheet, Text, Pressable, ScrollView, Modal, LayoutRectangle } from "react-native";
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
  const infoButtonRef = useRef<View>(null);
  const [infoButtonLayout, setInfoButtonLayout] = useState<LayoutRectangle | null>(null);

  const optimalCaffeine = profile.optimalCaffeine || 100;
  const sleepTime = profile.sleepTime || "23:00";
  const [sleepHour, sleepMinute] = sleepTime.split(":").map(Number);
  const halfLifeHours = 5.5;

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
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let checkDate = new Date(yesterday);
    let streakBroken = false;

    // Check last 365 days starting from yesterday
    for (let i = 0; i < 365; i++) {
      const dateString = checkDate.toISOString().split('T')[0];
      const hasEntryForDay = entries.some(e => {
        const entryDate = new Date(e.timestamp);
        // Compare year, month, date specifically to avoid timezone ISO string issues
        return entryDate.getFullYear() === checkDate.getFullYear() &&
               entryDate.getMonth() === checkDate.getMonth() &&
               entryDate.getDate() === checkDate.getDate();
      });

      const caffeine = getMaxCaffeineInSleepWindow(checkDate);
      const isSuccess = hasEntryForDay && caffeine <= 40;

      if (checkDate.getMonth() === currentMonth.getMonth() && 
          checkDate.getFullYear() === currentMonth.getFullYear()) {
        if (isSuccess) countSuccess++;
      }

      if (!streakBroken) {
        if (isSuccess) {
          streak++;
        } else {
          streakBroken = true;
        }
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Success days in the calendar should still include today if it's currently successful
    const todayCaffeine = getMaxCaffeineInSleepWindow(today);
    const hasEntryToday = entries.some(e => {
      const entryDate = new Date(e.timestamp);
      return entryDate.getFullYear() === today.getFullYear() &&
             entryDate.getMonth() === today.getMonth() &&
             entryDate.getDate() === today.getDate();
    });
    
    if (today.getMonth() === currentMonth.getMonth() && 
        today.getFullYear() === currentMonth.getFullYear()) {
      if (hasEntryToday && todayCaffeine <= 40) {
        countSuccess++;
      }
    }

    return { successDays: countSuccess, currentStreak: streak };
  }, [entries, currentMonth, sleepHour, sleepMinute, halfLifeHours]);

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const handleInfoPress = () => {
    infoButtonRef.current?.measureInWindow((x, y, width, height) => {
      setInfoButtonLayout({ x, y, width, height });
      setShowInfo(true);
    });
  };

  const weekDays = ["1", "2", "3", "4", "5", "6", "7"];

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

        <View style={styles.monthNavigatorContainer}>
          <View style={styles.monthNavigator}>
            <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
              <Feather name="chevron-left" size={20} color={theme.text} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
            <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
              <Feather name="chevron-right" size={20} color={theme.text} />
            </Pressable>
          </View>
          <Pressable 
            ref={infoButtonRef}
            onPress={handleInfoPress}
            style={styles.infoButton}
            hitSlop={12}
          >
            <Feather name="info" size={20} color={theme.mutedGrey} />
          </Pressable>
        </View>

        <Modal
          visible={showInfo}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowInfo(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowInfo(false)}>
            {infoButtonLayout && (
              <View 
                style={[
                  styles.infoModal, 
                  { 
                    top: infoButtonLayout.y + infoButtonLayout.height,
                    right: Spacing.lg,
                    backgroundColor: theme.backgroundRoot,
                    // backgroundColor: theme.card,
                    // borderColor: theme.border,
                    // zIndex: 9999,
                  }
                ]}
              >
                <Text style={[styles.infoTitle, { color: theme.text }]}>Peak Caffeine</Text>
                <Text style={[styles.infoText, { color: theme.mutedGrey }]}>
                  The value below each date shows the maximum caffeine level (peak) from your bedtime to 6 hours after.
                </Text>
                <View style={styles.legendContainer}>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: theme.blue }]} />
                    <Text style={[styles.legendLabel, { color: theme.text }]}>Safe (&lt;30mg)</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: theme.accentGold }]} />
                    <Text style={[styles.legendLabel, { color: theme.text }]}>Warning (30-40mg)</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: "#D9534F" }]} />
                    <Text style={[styles.legendLabel, { color: theme.text }]}>High (&gt;40mg)</Text>
                  </View>
                </View>
              </View>
            )}
          </Pressable>
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
          Days when caffeine intake was under 40 mg during your sleep window (from sleep time to 6 hours after).
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
  monthNavigatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  monthNavigator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: "48%",
  },
  infoButton: {
    padding: Spacing.xs,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 120,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
  },
  infoModal: {
    position: "absolute",
    width: 240,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 0.4,
    // backgroundColor:"#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    // opacity: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  legendContainer: {
    gap: Spacing.xs,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: "500",
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
