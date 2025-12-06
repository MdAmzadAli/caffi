import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable, Text, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { HomeGraphController } from "@/components/HomeGraphController";
import { RingProgress } from "@/components/RingProgress";
import { RecommendationCards } from "@/components/RecommendationCards";
import { ConsumptionList } from "@/components/ConsumptionList";
import EditDrinkModal from "@/components/EditDrinkModal";
import { useCaffeineStore, DrinkEntry } from "@/store/caffeineStore";
import {
  calculateRecommendations,
  getHoursUntilBedtime,
} from "@/utils/recommendationEngine";
import { CaffeineEvent } from "@/utils/graphUtils";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, "Home">;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const {
    profile,
    entries,
    getTodayEntries,
    getTodayCaffeine,
    getActiveCaffeine,
    deleteEntry,
  } = useCaffeineStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DrinkEntry | null>(null);

  const todayEntries = useMemo(() => getTodayEntries(), [entries]);
  const todayCaffeine = useMemo(() => getTodayCaffeine(), [entries]);
  const activeCaffeine = useMemo(() => getActiveCaffeine(), [entries]);

  const caffeineEvents: CaffeineEvent[] = useMemo(() => {
    return entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      mg: entry.caffeineAmount,
      timestampISO: new Date(entry.timestamp).toISOString(),
    }));
  }, [entries]);

  const recommendations = useMemo(() => {
    const hoursUntilBed = getHoursUntilBedtime(profile.sleepTime);
    return calculateRecommendations({
      consumedTodayMg: todayCaffeine,
      upcomingHoursUntilBed: hoursUntilBed,
      currentCaffeineMg: activeCaffeine,
      optimalDailyMg: profile.optimalCaffeine,
      halfLifeHours: 5.5,
      sleepThresholdMg: 100,
    });
  }, [todayCaffeine, activeCaffeine, profile]);

  const handleEditEntry = (entry: DrinkEntry) => {
    setSelectedEntry(entry);
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setSelectedEntry(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.bg }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoContainer, { backgroundColor: theme.backgroundTertiary, borderColor: theme.accentGold }]}>
            <Feather name="coffee" size={20} color={theme.darkBrown} />
          </View>
          <Text style={[styles.appTitle, { color: theme.darkBrown }]}>Caffeine Clock</Text>
        </View>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.getParent()?.navigate("SettingsTab" as never)}
        >
          <Feather name="settings" size={22} color={theme.mutedGrey} />
        </Pressable>
      </View>

      <ScreenScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <HomeGraphController
          events={caffeineEvents}
          bedtime={profile.sleepTime}
          sleepThresholdMg={100}
          halfLifeHours={5.5}
          isDark={isDark}
        />

        <View style={styles.ringRow}>
          <RingProgress
            consumedTodayMg={todayCaffeine}
            optimalDailyMg={profile.optimalCaffeine}
            sizePx={72}
          />
        </View>

        <View style={styles.mainContent}>
          <View style={styles.recommendationsSection}>
            <RecommendationCards recommendations={recommendations} />
          </View>

          <View style={styles.consumptionSection}>
            <Text style={[styles.sectionTitle, { color: theme.darkBrown }]}>My consumption</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.mutedGrey }]}>TODAY</Text>
            <ConsumptionList
              entries={todayEntries}
              onEntryPress={handleEditEntry}
              onDeleteEntry={deleteEntry}
            />
          </View>
        </View>
      </ScreenScrollView>

      <EditDrinkModal
        visible={editModalVisible}
        entry={selectedEntry}
        onClose={handleCloseEditModal}
      />
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
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  ringRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  mainContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    minHeight: 400,
  },
  recommendationsSection: {
    marginBottom: Spacing.xl,
  },
  consumptionSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
});
