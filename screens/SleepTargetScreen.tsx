import React, { useMemo, useState } from "react";
import { View, StyleSheet, Text, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type ViewMode = "Week" | "Month";

interface DayData {
  day: number;
  caffeineAtSleep: number | null;
  isBelowOptimal: boolean;
  isToday: boolean;
}

const CAFFEINE_HALF_LIFE_HOURS = 5;

export default function SleepTargetScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { entries, profile } = useCaffeineStore();
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const optimalCaffeine = profile.optimalCaffeine || 100;
  const sleepTime = profile.sleepTime || "23:00";
  const [sleepHour, sleepMinute] = sleepTime.split(":").map(Number);

  const getCaffeineAtSleepTime = (date: Date): number => {
    const sleepDateTime = new Date(date);
    sleepDateTime.setHours(sleepHour, sleepMinute, 0, 0);

    let caffeine = 0;
    entries.forEach((entry) => {
      const entryTime = new Date(entry.timestamp);
      if (entryTime <= sleepDateTime) {
        const hoursElapsed =
          (sleepDateTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
        if (hoursElapsed >= 0 && hoursElapsed < 48) {
          const remainingFactor = Math.pow(0.5, hoursElapsed / CAFFEINE_HALF_LIFE_HOURS);
          caffeine += entry.caffeineAmount * remainingFactor;
        }
      }
    });
    return Math.round(caffeine);
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
        days.push({ day, caffeineAtSleep: null, isBelowOptimal: false, isToday });
      } else {
        const caffeineAtSleep = getCaffeineAtSleepTime(date);
        days.push({
          day,
          caffeineAtSleep,
          isBelowOptimal: caffeineAtSleep < optimalCaffeine,
          isToday,
        });
      }
    }

    return days;
  }, [currentMonth, entries, optimalCaffeine, sleepHour, sleepMinute]);

  const { successDays, currentStreak } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let countSuccess = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const caffeine = getCaffeineAtSleepTime(checkDate);
      const isSuccess = caffeine < optimalCaffeine;

      if (checkDate.getMonth() === currentMonth.getMonth() && 
          checkDate.getFullYear() === currentMonth.getFullYear()) {
        if (isSuccess) countSuccess++;
      }

      if (i === 0 || streak > 0) {
        if (isSuccess) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    return { successDays: countSuccess, currentStreak: streak };
  }, [entries, optimalCaffeine, currentMonth, sleepHour, sleepMinute]);

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
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

        <View style={styles.modeSelector}>
          {(["Week", "Month"] as ViewMode[]).map((mode) => (
            <Pressable
              key={mode}
              style={[
                styles.modeButton,
                viewMode === mode
                  ? { backgroundColor: theme.accentGold }
                  : { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: viewMode === mode ? "#FFFFFF" : theme.text },
                ]}
              >
                {mode}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.monthNavigator}>
          <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
          <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
            <Feather name="chevron-right" size={20} color={theme.text} />
          </Pressable>
        </View>

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
                    <>
                      {dayData.isBelowOptimal && (
                        <Feather
                          name="check-circle"
                          size={18}
                          color={theme.blue}
                          style={styles.checkIcon}
                        />
                      )}
                      <Text style={[styles.caffeineLabel, { color: theme.mutedGrey }]}>
                        {dayData.caffeineAtSleep} mg
                      </Text>
                    </>
                  )}
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <Text style={[styles.summaryText, { color: theme.text }]}>
          Days where you had less than {optimalCaffeine} mg at your chosen bedtime.
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
  modeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  modeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  monthNavigator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
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
  checkIcon: {
    marginTop: 2,
  },
  caffeineLabel: {
    fontSize: 10,
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
