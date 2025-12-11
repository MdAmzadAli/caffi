import React, { useMemo } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { StatsStackParamList } from "@/navigation/StatsStackNavigator";

type StatsNavigationProp = NativeStackNavigationProp<StatsStackParamList>;

export default function StatisticsScreen() {
  const { theme } = useTheme();
  const { entries } = useCaffeineStore();
  const navigation = useNavigation<StatsNavigationProp>();

  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const result: { day: string; value: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTotal = entries
        .filter((e) => {
          const t = new Date(e.timestamp);
          return t >= date && t < nextDate;
        })
        .reduce((sum, e) => sum + e.caffeineAmount, 0);

      result.push({ day: days[date.getDay()], value: dayTotal });
    }
    return result;
  }, [entries]);

  const maxValue = Math.max(...weeklyData.map((d) => d.value), 1);

  return (
    <ScreenScrollView header={<ScreenHeader title="Analytics" />}>
      <Text style={[styles.subtitle, { color: theme.text }]}>Spotlight</Text>

      <Pressable
        style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}
        onPress={() => navigation.navigate("CaffeineIntakeDetail")}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Feather name="bar-chart-2" size={18} color={theme.mutedGrey} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Daily caffeine intake
            </Text>
          </View>
          <Feather name="arrow-right" size={20} color={theme.mutedGrey} />
        </View>

        <View style={styles.chartContainer}>
          {weeklyData.map((item, idx) => (
            <View key={idx} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                {item.value > 0 && (
                  <>
                    <Text style={[styles.barLabel, { color: theme.backgroundRoot }]}>
                      {item.value}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: (item.value / maxValue) * 120,
                          backgroundColor: theme.accentGold,
                        },
                      ]}
                    />
                  </>
                )}
                {item.value === 0 && (
                  <View
                    style={[
                      styles.barEmpty,
                      { backgroundColor: theme.divider },
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.dayLabel, { color: theme.mutedGrey }]}>
                {item.day}
              </Text>
            </View>
          ))}
        </View>
      </Pressable>

      <MenuItem
        icon="coffee"
        label="Caffeine by source"
        theme={theme}
      />
      <MenuItem
        icon="clock"
        label="Sleep target"
        theme={theme}
      />
      <MenuItem
        icon="refresh-cw"
        label="Consumption by time of day"
        theme={theme}
      />
    </ScreenScrollView>
  );
}

function MenuItem({
  icon,
  label,
  theme,
  onPress,
}: {
  icon: any;
  label: string;
  theme: any;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.menuItem, { borderBottomColor: theme.divider }]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Feather name={icon} size={20} color={theme.mutedGrey} />
        <Text style={[styles.menuItemLabel, { color: theme.text }]}>{label}</Text>
      </View>
      <Feather name="arrow-right" size={20} color={theme.mutedGrey} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    paddingTop: 20,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: 32,
    borderRadius: 4,
  },
  barEmpty: {
    width: 32,
    height: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 12,
    marginTop: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
