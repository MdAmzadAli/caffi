import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, Text, Image, SectionList, NativeScrollEvent, NativeSyntheticEvent, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { HomeGraphController } from "@/components/HomeGraphController";
import { RingProgress } from "@/components/RingProgress";
import { CollapsibleInfoCards, ExpandButton } from "@/components/CollapsibleInfoCards";
import { StickyConsumptionTitle } from "@/components/StickyConsumptionTitle";
import { StickyDateHeader } from "@/components/StickyDateHeader";
import { CaffeineLogPopup } from "@/components/CaffeineLogPopup";
import { CustomDrinkModal } from "@/components/CustomDrinkModal";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useCaffeineStore, DrinkEntry } from "@/store/caffeineStore";
import {
  calculateRecommendations,
  getHoursUntilBedtime,
} from "@/utils/recommendationEngine";
import { CaffeineEvent } from "@/utils/graphUtils";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { DUMMY_ENTRIES } from "@/utils/dummy_logs";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, "Home">;
};

interface SectionData {
  title: string;
  data: DrinkEntry[];
  dateKey: string;
}

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<DrinkEntry, SectionData>);

function formatDateHeader(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const entryDate = new Date(date);
  entryDate.setHours(0, 0, 0, 0);
  
  if (entryDate.getTime() === today.getTime()) {
    return "Today";
  } else if (entryDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[entryDate.getDay()];
    const day = entryDate.getDate().toString().padStart(2, "0");
    const month = (entryDate.getMonth() + 1).toString().padStart(2, "0");
    const year = entryDate.getFullYear();
    return `${dayName.toUpperCase()}, ${day}/${month}/${year}`;
  }
}

function formatTime(timestamp: Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const CATEGORY_ICONS: Record<string, string> = {
  coffee: "☕",
  tea: "🍵",
  energy: "⚡",
  soda: "🥤",
  chocolate: "🍫",
  custom: "🧋",
};

const getCategoryImageSource = (category: string) => {
  const imageMap: Record<string, any> = {
    coffee: require("@/assets/CaffeineSourceImages/coffee.png"),
    tea: require("@/assets/CaffeineSourceImages/tea.jpg"),
    energy: require("@/assets/CaffeineSourceImages/energy.png"),
    soda: require("@/assets/CaffeineSourceImages/soda.png"),
    chocolate: require("@/assets/CaffeineSourceImages/chocolate.png"),
  };
  return imageMap[category] || imageMap.coffee;
};

function getEntryIcon(category: string): string {
  return CATEGORY_ICONS[category] || "☕";
}

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
    addEntry,
    getAllDrinks,
  } = useCaffeineStore();

  const [popupVisible, setPopupVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DrinkEntry | null>(null);
  const [isEditingFromPopup, setIsEditingFromPopup] = useState(false);
  const [currentStickyDate, setCurrentStickyDate] = useState<string>("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const [graphHeight, setGraphHeight] = useState(0);
  const [titleHeight, setTitleHeight] = useState(0);
  
  // Scroll animation values
  const scrollY = useSharedValue(0);
  const scrollViewRef = useRef<any>(null);
  const savedScrollOffset = useRef(0);
  const COLLAPSE_THRESHOLD = 100; // Scroll threshold to trigger collapse
  const DEFAULT_GRAPH_HEIGHT = Dimensions.get("window").height * 0.36; // Graph height (36% of screen)
  const HEADER_HEIGHT = 60; // Screen header height
  const RING_ROW_HEIGHT = 72; // Ring progress row height
  const GRAPH_BOTTOM_PADDING = Spacing.xl; // Keep sticky content below x-axis labels

  const todayEntries = useMemo(() => getTodayEntries(), [entries]);
  const todayCaffeine = useMemo(() => getTodayCaffeine(), [entries]);
  const activeCaffeine = useMemo(() => getActiveCaffeine(), [entries]);

  // Combine real entries with dummy data for testing
  const allEntries = useMemo(() => {
    return [...entries, ...DUMMY_ENTRIES].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [entries]);

  const caffeineEvents: CaffeineEvent[] = useMemo(() => {
    return entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      mg: entry.caffeineAmount,
      timestampISO: new Date(entry.timestamp).toISOString(),
      category: entry.category,
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
      sleepThresholdMg: 40,
    });
  }, [todayCaffeine, activeCaffeine, profile]);

  const sections = useMemo(() => {
    if (allEntries.length === 0) return [];

    // Group entries by date
    const grouped = new Map<string, DrinkEntry[]>();
    
    allEntries.forEach((entry) => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      const dateKey = entryDate.toISOString();
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(entry);
    });

    // Convert to sections array and sort by date (newest first)
    const sectionsArray: SectionData[] = Array.from(grouped.entries())
      .map(([dateKey, data]) => {
        // Sort entries within each section by time (newest first)
        const sortedData = [...data].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return {
          title: formatDateHeader(new Date(dateKey)),
          data: sortedData,
          dateKey,
        };
      })
      .sort((a, b) => {
        // Sort sections by date (newest first)
        return new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime();
      });

    return sectionsArray;
  }, [allEntries]);

  // Initialize and update current sticky date when sections change
  useEffect(() => {
    if (sections.length > 0) {
      if (!currentStickyDate) {
        // Initialize with first section
        setCurrentStickyDate(sections[0].title);
      }
    }
  }, [sections, currentStickyDate]);

  const handleSelectEntry = (entry: DrinkEntry) => {
    setSelectedEntry(entry);
    setPopupVisible(true);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
    if (!isEditingFromPopup) {
      setSelectedEntry(null);
    }
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    if (isEditingFromPopup) {
      setPopupVisible(false);
    }
    setIsEditingFromPopup(false);
    setSelectedEntry(null);
  };

  const handleEditEntry = (entry: DrinkEntry) => {
    setIsEditingFromPopup(true);
    setEditModalVisible(true);
  };

  const handleDuplicateEntry = (entry: DrinkEntry) => {
    const allDrinks = getAllDrinks();
    const drink = allDrinks.find((d) => d.id === entry.drinkId);
    if (drink) {
      addEntry(drink, entry.servingSize, entry.notes, entry.isFavorite);
    }
    setPopupVisible(false);
    setSelectedEntry(null);
  };

  const handleDeleteEntry = (entry: DrinkEntry) => {
    deleteEntry(entry.id);
    setPopupVisible(false);
    setSelectedEntry(null);
  };

  // Track current visible section for sticky date header
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      // Get the first viewable item's section
      const firstItem = viewableItems.find((item: any) => item.isViewable) || viewableItems[0];
      if (firstItem?.section?.title) {
        setCurrentStickyDate(firstItem.section.title);
      }
    }
  }, []);

  // Also update on scroll to ensure we track the correct section
  const scrollHandlerWithDateTracking = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      // Update current date based on scroll position
      // This will be handled by onViewableItemsChanged, but we can add fallback logic here if needed
    },
  });

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
    minimumViewTime: 100,
  }).current;


  // Handle expand button press
  const handleExpand = () => {
    // Save current scroll position
    savedScrollOffset.current = scrollY.value;
    
    // Scroll back to top to show info cards
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: true,
        viewOffset: 0,
      });
    }
    
    // Reset scroll value after animation
    setTimeout(() => {
      scrollY.value = 0;
    }, 300);
  };

  const renderItem = ({ item }: { item: DrinkEntry }) => {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.entryRow,
          {
            backgroundColor: theme.backgroundSecondary,
          },
          pressed && { backgroundColor: theme.backgroundTertiary },
        ]}
        onPress={() => handleSelectEntry(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.backgroundTertiary }]}>
          {CATEGORY_IMAGES[item.category] ? (
            <Image
              source={CATEGORY_IMAGES[item.category]}
              style={styles.entryImage}
            />
          ) : (
            <Text style={styles.entryEmoji}>{getEntryIcon(item.category)}</Text>
          )}
        </View>

        <View style={styles.entryInfo}>
          <Text style={[styles.entryName, { color: theme.darkBrown }]}>
            {item.name}
          </Text>
          <Text style={[styles.entryTime, { color: theme.mutedGrey }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>

        <Text style={[styles.entryMg, { color: theme.darkBrown }]}>
          {item.caffeineAmount} mg
        </Text>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => {
    return (
      <View style={[styles.sectionHeader, { backgroundColor: theme.bg }]}>
        <Text style={[styles.sectionHeaderText, { color: theme.mutedGrey }]}>
          {section.title}
        </Text>
      </View>
    );
  };

  const ListHeaderComponent = () => {
    const titleOpacity = useAnimatedStyle(() => {
      const progress = Math.min(scrollY.value / COLLAPSE_THRESHOLD, 1);
      return {
        opacity: interpolate(
          progress,
          [0.7, 1],
          [1, 0],
          Extrapolation.CLAMP
        ),
      };
    });

    return (
      <>
        <View style={styles.mainContent}>
          <CollapsibleInfoCards
            recommendations={recommendations}
            scrollY={scrollY}
            collapseThreshold={COLLAPSE_THRESHOLD}
            onExpand={handleExpand}
            graphHeight={effectiveGraphHeight}
            headerHeight={effectiveHeaderHeight}
            topInset={insets.top}
          />

          <Animated.View style={[styles.consumptionHeader, titleOpacity]}>
            <Text style={[styles.sectionTitle, { color: theme.darkBrown }]}>My consumption</Text>
          </Animated.View>
        </View>
      </>
    );
  };

  if (allEntries.length === 0) {
    return (
      <View style={[styles.outerContainer, { backgroundColor: theme.bg }]}>
        <SafeAreaView
          style={[
            styles.safeArea,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
          edges={[]}
        >
          <ScreenHeader title="Caffi" showIcon={true} />
          <View style={styles.container}>
            <ListHeaderComponent />
            <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="coffee" size={32} color={theme.mutedGrey} />
              <Text style={[styles.emptyText, { color: theme.mutedGrey }]}>No drinks logged</Text>
              <Text style={[styles.emptySubtext, { color: theme.mutedGrey }]}>Tap + to add your first drink</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const effectiveHeaderHeight = headerHeight || HEADER_HEIGHT;
  const effectiveGraphHeight = graphHeight || DEFAULT_GRAPH_HEIGHT;
  // Calculate sticky offset: measured header + measured graph + a small responsive gap
  const stickyOffset = effectiveHeaderHeight + effectiveGraphHeight + Spacing.sm;

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.bg }]}>
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
        edges={[]}
      >
        <View
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <ScreenHeader title="Caffi" showIcon={true} />
        </View>
        
        {/* Fixed Graph Section */}
        <View
          style={[
            styles.fixedGraphContainer,
            { paddingBottom: GRAPH_BOTTOM_PADDING },
          ]}
        >
          <HomeGraphController
            events={caffeineEvents}
            bedtime={profile.sleepTime}
            sleepThresholdMg={40}
            optimalCaffeineMg={profile.optimalCaffeine}
            halfLifeHours={5.5}
            isDark={isDark}
            onHeight={setGraphHeight}
          />
        </View>

        {/* Sticky Consumption Title Overlay */}
        <StickyConsumptionTitle
          scrollY={scrollY}
          collapseThreshold={COLLAPSE_THRESHOLD}
          stickyOffset={stickyOffset}
          onHeight={setTitleHeight}
        />

        {/* Sticky Date Header */}
        <StickyDateHeader
          scrollY={scrollY}
          collapseThreshold={COLLAPSE_THRESHOLD}
          stickyOffset={stickyOffset}
          currentDate={currentStickyDate}
          titleHeight={titleHeight}
        />

        {/* Expand Button - positioned outside scroll view */}
        <ExpandButton
          scrollY={scrollY}
          collapseThreshold={COLLAPSE_THRESHOLD}
          onExpand={handleExpand}
          graphHeight={effectiveGraphHeight}
          headerHeight={effectiveHeaderHeight}
          topInset={insets.top}
        />

        {/* Scrollable Content */}
        <View style={styles.container}>
          <AnimatedSectionList
            ref={scrollViewRef}
            sections={sections}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={ListHeaderComponent}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandlerWithDateTracking}
            scrollEventThrottle={16}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        </View>
      </SafeAreaView>

      <CaffeineLogPopup
        visible={popupVisible}
        entry={selectedEntry}
        onClose={handleClosePopup}
        onEdit={handleEditEntry}
        onDuplicate={handleDuplicateEntry}
        onDelete={handleDeleteEntry}
      />

      <CustomDrinkModal
        visible={editModalVisible}
        editEntry={selectedEntry}
        onClose={handleCloseEditModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  fixedGraphContainer: {
    zIndex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
    paddingTop: 0,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
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
  },
  recommendationsSection: {
    marginBottom: Spacing.xl,
  },
  consumptionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    width: "100%",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  entryImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  entryEmoji: {
    fontSize: 22,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    fontWeight: "400",
  },
  entryMg: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 13,
  },
});
