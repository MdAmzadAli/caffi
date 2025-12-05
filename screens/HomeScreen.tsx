import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CaffeineRing } from "@/components/CaffeineRing";
import { QuickStatCard } from "@/components/QuickStatCard";
import { DrinkTimelineItem } from "@/components/DrinkTimelineItem";
import EditDrinkModal from "@/components/EditDrinkModal";
import { useCaffeineStore, DrinkEntry } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, "Home">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme } = useTheme();
  const {
    profile,
    entries,
    getTodayEntries,
    getTodayCaffeine,
    getActiveCaffeine,
    getLastDrink,
    getSleepImpact,
    deleteEntry,
  } = useCaffeineStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DrinkEntry | null>(null);

  const todayEntries = React.useMemo(() => getTodayEntries(), [entries]);
  const todayCaffeine = React.useMemo(() => getTodayCaffeine(), [entries]);
  const activeCaffeine = React.useMemo(() => getActiveCaffeine(), [entries]);
  const lastDrink = React.useMemo(() => getLastDrink(), [entries]);
  const sleepImpact = React.useMemo(() => getSleepImpact(), [entries, profile]);

  const handleEditEntry = (entry: DrinkEntry) => {
    setSelectedEntry(entry);
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setSelectedEntry(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 17) greeting = "Good afternoon";
    
    if (profile.name && profile.name.trim()) {
      return `${greeting}, ${profile.name}`;
    }
    return greeting;
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  const formatLastDrinkTime = () => {
    if (!lastDrink) return "No drinks yet";
    const timestamp = new Date(lastDrink.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const percentage = Math.min((todayCaffeine / profile.optimalCaffeine) * 100, 100);

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h4">{getGreeting()}</ThemedText>
        <ThemedText type="small" muted>
          {formatDate()}
        </ThemedText>
      </View>

      <View style={styles.ringContainer}>
        <CaffeineRing
          percentage={percentage}
          currentMg={todayCaffeine}
          limitMg={profile.optimalCaffeine}
        />
      </View>

      <View style={styles.statsRow}>
        <QuickStatCard
          icon="activity"
          label="Active"
          value={`${activeCaffeine} mg`}
          sublabel="in blood"
        />
        <QuickStatCard
          icon="coffee"
          label="Last drink"
          value={lastDrink?.name || "None"}
          sublabel={formatLastDrinkTime()}
        />
        <QuickStatCard
          icon="moon"
          label="Sleep"
          value={sleepImpact.message}
          status={sleepImpact.level as "good" | "warning" | "danger"}
        />
      </View>

      <View style={styles.actionsRow}>
        <ActionButton
          icon="bar-chart-2"
          label="View Stats"
          onPress={() => navigation.navigate("Statistics")}
        />
      </View>

      <View style={styles.timelineSection}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Today
        </ThemedText>
        {todayEntries.length === 0 ? (
          <ThemedView elevation={1} style={styles.emptyState}>
            <Feather name="coffee" size={32} color={theme.textMuted} />
            <ThemedText muted style={styles.emptyText}>
              You haven't added any drinks today
            </ThemedText>
            <ThemedText type="small" muted>
              Tap the + button to add your first one
            </ThemedText>
          </ThemedView>
        ) : (
          todayEntries.map((entry) => (
            <DrinkTimelineItem
              key={entry.id}
              entry={entry}
              onDelete={() => deleteEntry(entry.id)}
              onEdit={() => handleEditEntry(entry)}
            />
          ))
        )}
      </View>

      <EditDrinkModal
        visible={editModalVisible}
        entry={selectedEntry}
        onClose={handleCloseEditModal}
      />
    </ScreenScrollView>
  );
}

interface ActionButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.actionButton,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <Feather name={icon} size={20} color={Colors.light.accent} />
      <ThemedText type="small" style={styles.actionLabel}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  ringContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  actionLabel: {
    fontWeight: "500",
  },
  timelineSection: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emptyText: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
