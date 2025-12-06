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
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, "Home">;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Feather name="coffee" size={20} color={Colors.light.darkBrown} />
          </View>
          <Text style={styles.appTitle}>Caffeine Clock</Text>
        </View>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.getParent()?.navigate("SettingsTab" as never)}
        >
          <Feather name="settings" size={22} color={Colors.light.mutedGrey} />
        </Pressable>
      </View>

      <ScreenScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.graphContainer}>
          <HomeGraphController
            events={caffeineEvents}
            bedtime={profile.sleepTime}
            sleepThresholdMg={100}
            halfLifeHours={5.5}
          />
        </View>

        <View style={styles.mainContent}>
          <View style={styles.ringPositionContainer}>
            <RingProgress
              consumedTodayMg={todayCaffeine}
              optimalDailyMg={profile.optimalCaffeine}
              sizePx={72}
            />
          </View>

          <View style={styles.recommendationsSection}>
            <RecommendationCards recommendations={recommendations} />
          </View>

          <View style={styles.consumptionSection}>
            <Text style={styles.sectionTitle}>My consumption</Text>
            <Text style={styles.sectionSubtitle}>TODAY</Text>
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
    backgroundColor: Colors.light.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.white,
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
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.light.accentGold,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.darkBrown,
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
  graphContainer: {
    marginBottom: Spacing.md,
  },
  mainContent: {
    backgroundColor: Colors.light.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    minHeight: 400,
    ...Shadows.medium,
  },
  ringPositionContainer: {
    position: "absolute",
    top: -36,
    right: Spacing.xl,
    zIndex: 10,
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
    color: Colors.light.darkBrown,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.mutedGrey,
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
});
