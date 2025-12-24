import React, { useState, useMemo, useEffect, useCallback, useLayoutEffect, useRef, memo } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutChangeEvent,
  ActivityIndicator,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CustomDrinkModal } from "@/components/CustomDrinkModal";
import { useCaffeineStore, DrinkItem, DrinkEntry } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SEARCH_BAR_HEIGHT = 60;

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

const getImageSourceForDrinkModal = (item: DrinkItem | DrinkEntry): { uri?: string; source?: any } => {
  const imgUri = (item as any).imageUri;
  if (imgUri) {
    if (imgUri.startsWith("preset:")) {
      const { PRESET_IMAGES } = require("@/components/ImagePickerModal");
      const preset = PRESET_IMAGES.find((p: any) => p.id === imgUri.replace("preset:", ""));
      return preset ? { source: preset.image } : { source: getCategoryImageSource((item as any).category) };
    }
    return { uri: imgUri };
  }
  return { source: getCategoryImageSource((item as any).category) };
};

interface AddDrinkModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToCustomDrink?: () => void;
}

type Category = "coffee" | "tea" | "energy" | "soda" | "chocolate" | "custom";

const QUICK_CATEGORIES: { key: Category; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "coffee", label: "Coffee", icon: "coffee" },
  { key: "tea", label: "Tea", icon: "droplet" },
  { key: "energy", label: "Energy", icon: "zap" },
  { key: "soda", label: "Soda", icon: "droplet" },
  { key: "chocolate", label: "Chocolate", icon: "square" },
];

export default function AddDrinkModal({ visible, onClose, onNavigateToCustomDrink }: AddDrinkModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { addEntry, deleteEntry, getAllDrinks, getFavoriteDrinks, profile, entries, customDrinks } = useCaffeineStore();

  const INITIAL_HEIGHT = windowHeight * 0.8;
  const maxExpandedHeight = windowHeight;
  
  const [showCustomDrinkModal, setShowCustomDrinkModal] = useState(false);
  const [prefillDrink, setPrefillDrink] = useState<DrinkItem | null>(null);
  const [editingCustomDrink, setEditingCustomDrink] = useState<DrinkItem | null>(null);

  const handleAddCustomDrink = () => {
    setPrefillDrink(null);
    setShowCustomDrinkModal(true);
  };

  const handleCustomDrinkAdded = () => {
    setShowCustomDrinkModal(false);
    setPrefillDrink(null);
    setEditingCustomDrink(null);
    handleCloseAnimated();
  };

  const handleEditCustomDrink = (drink: DrinkItem) => {
    setEditingCustomDrink(drink);
    setPrefillDrink(null);
    setShowCustomDrinkModal(true);
  };

  const handleSaveCustomDrink = () => {
    setEditingCustomDrink(null);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>("coffee");
  const [selectedDrink, setSelectedDrink] = useState<DrinkItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const scrollY = useSharedValue(0);
  const quickAddY = useSharedValue(0);
  const customDrinksY = useSharedValue(0);
  const categoryHeaderY = useSharedValue(0);
  const activeSectionY = useSharedValue(0);
  const [currentStickyLabel, setCurrentStickyLabel] = useState<string>("");

  const allDrinks = getAllDrinks();
  const favoriteDrinks = getFavoriteDrinks();

  const recentEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const seen = new Set<string>();
    return sorted.filter(entry => {
      if (seen.has(entry.name)) return false;
      seen.add(entry.name);
      return true;
    }).slice(0, 5);
  }, [entries]);

  const filteredDrinks = useMemo(() => {
    let drinks = allDrinks;

    if (selectedCategory) {
      drinks = drinks.filter((d) => d.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      drinks = drinks.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.category.toLowerCase().includes(query),
      );
    }

    return drinks;
  }, [allDrinks, selectedCategory, searchQuery]);

  // Pagination for infinite scroll
  const PAGE_SIZE = 25;
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const isLoadingMore = useRef(false);

  // Reset pagination when filters change or modal reopens
  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [selectedCategory, searchQuery, visible]);

  const displayedDrinks = useMemo(() => {
    return filteredDrinks.slice(0, displayedCount);
  }, [filteredDrinks, displayedCount]);

  const hasMoreDrinks = displayedCount < filteredDrinks.length;

  const loadMoreDrinks = useCallback(() => {
    if (isLoadingMore.current || !hasMoreDrinks) return;
    isLoadingMore.current = true;
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + PAGE_SIZE, filteredDrinks.length));
      isLoadingMore.current = false;
    }, 100);
  }, [hasMoreDrinks, filteredDrinks.length]);

  const caffeineMg = selectedDrink && selectedSize
    ? Math.round((selectedDrink.caffeinePer100ml * selectedSize) / 100)
    : 0;

  const warningLevel = useMemo(() => {
    if (!caffeineMg) return null;
    const todayTotal = 0;
    const projectedTotal = todayTotal + caffeineMg;
    const percentage = (projectedTotal / profile.dailyLimit) * 100;

    if (percentage > 100) return "danger";
    if (percentage > 80) return "warning";
    return null;
  }, [caffeineMg, profile.dailyLimit]);

  const handleSelectDrink = (drink: DrinkItem) => {
    setPrefillDrink(drink);
    setShowCustomDrinkModal(true);
  };

  const handleQuickAdd = (entry: DrinkEntry) => {
    const drink = allDrinks.find(d => d.id === entry.drinkId) || {
      id: entry.drinkId,
      name: entry.name,
      category: entry.category as Category,
      caffeinePer100ml: (entry.caffeineAmount / entry.servingSize) * 100,
      defaultServingMl: entry.servingSize,
      icon: "coffee",
      sizes: [],
    };
    addEntry(drink, entry.servingSize, entry.notes, entry.isFavorite, new Date());
    handleCloseAnimated();
  };

  const handleAdd = () => {
    if (selectedDrink && selectedSize) {
      addEntry(selectedDrink, selectedSize, notes || undefined, isFavorite);
      handleCloseAnimated();
    }
  };

  const resetState = () => {
    setSearchQuery("");
    setSelectedCategory("coffee");
    setSelectedDrink(null);
    setSelectedSize(null);
    setNotes("");
    setIsFavorite(false);
    scrollY.value = 0;
    quickAddY.value = 0;
    customDrinksY.value = 0;
    categoryHeaderY.value = 0;
    activeSectionY.value = 0;
    setCurrentStickyLabel("");
  };

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      const currentY = e.contentOffset.y;
      
      let activeLabel = "";
      let activeY = 0;
      if (categoryHeaderY.value > 0 && currentY >= categoryHeaderY.value) {
        activeLabel = searchQuery ? "RESULTS" : selectedCategory!.toUpperCase();
        activeY = categoryHeaderY.value;
      } else if (customDrinksY.value > 0 && currentY >= customDrinksY.value) {
        activeLabel = "MY CUSTOM DRINKS";
        activeY = customDrinksY.value;
      } else if (quickAddY.value > 0 && currentY >= quickAddY.value) {
        activeLabel = "QUICK ADD";
        activeY = quickAddY.value;
      }
      activeSectionY.value = activeY;
      runOnJS(setCurrentStickyLabel)(activeLabel);
    },
  });

  const handleInfiniteScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 200 && hasMoreDrinks) {
      loadMoreDrinks();
    }
  };

  const translateY = useSharedValue(INITIAL_HEIGHT);
  const sheetHeight = useSharedValue(INITIAL_HEIGHT);
  const startY = useSharedValue(0);
  const startHeight = useSharedValue(INITIAL_HEIGHT);
  const borderRadius = useSharedValue(BorderRadius.lg);
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCloseAnimated = useCallback(
    (after?: () => void) => {
      if (isClosing) return;
      setIsClosing(true);
      translateY.value = withTiming(INITIAL_HEIGHT, { duration: 180 }, () => {
        runOnJS(resetState)();
        runOnJS(onClose)();
        runOnJS(setIsClosing)(false);
        runOnJS(setIsExpanded)(false);
        if (after) runOnJS(after)();
      });
      sheetHeight.value = withTiming(INITIAL_HEIGHT, { duration: 180 });
      borderRadius.value = withTiming(BorderRadius.lg, { duration: 180 });
    },
    [isClosing, onClose, translateY, sheetHeight, borderRadius],
  );

  const collapseToNormal = useCallback(() => {
    sheetHeight.value = withSpring(INITIAL_HEIGHT, { damping: 18, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    borderRadius.value = withSpring(BorderRadius.lg, { damping: 18, stiffness: 200 });
    setIsExpanded(false);
  }, [sheetHeight, translateY, borderRadius]);

  useLayoutEffect(() => {
    if (visible) {
      setIsExpanded(false);
      translateY.value = withSpring(0);
    } else {
      translateY.value = INITIAL_HEIGHT;
      sheetHeight.value = INITIAL_HEIGHT;
    }
  }, [visible, translateY, sheetHeight]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
      startHeight.value = sheetHeight.value;
    })
    .onUpdate((event) => {
      const { translationY } = event;
      
      if (translationY > 0) {
        const nextY = Math.min(startY.value + translationY, INITIAL_HEIGHT);
        translateY.value = nextY;
      } else {
        const heightIncrease = Math.abs(translationY);
        const newHeight = Math.min(startHeight.value + heightIncrease, maxExpandedHeight);
        sheetHeight.value = newHeight;
        
        const progress = (newHeight - INITIAL_HEIGHT) / (maxExpandedHeight - INITIAL_HEIGHT);
        borderRadius.value = interpolate(progress, [0, 1], [BorderRadius.lg, 0], Extrapolation.CLAMP);
      }
    })
    .onEnd((event) => {
      const { translationY, velocityY } = event;
      
      if (translationY > 0) {
        const shouldClose = translateY.value > INITIAL_HEIGHT * 0.4 || velocityY > 800;
        if (shouldClose) {
          translateY.value = withTiming(INITIAL_HEIGHT, { duration: 180 }, () => {
            runOnJS(resetState)();
            runOnJS(onClose)();
            runOnJS(setIsClosing)(false);
            runOnJS(setIsExpanded)(false);
          });
          sheetHeight.value = withTiming(INITIAL_HEIGHT, { duration: 180 });
        } else {
          translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
        }
      } else {
        const shouldExpand = sheetHeight.value > INITIAL_HEIGHT + 60 || velocityY < -600;
        if (shouldExpand) {
          sheetHeight.value = withSpring(maxExpandedHeight, { damping: 18, stiffness: 200 });
          borderRadius.value = withSpring(0, { damping: 18, stiffness: 200 });
          runOnJS(setIsExpanded)(true);
        } else {
          sheetHeight.value = withSpring(INITIAL_HEIGHT, { damping: 18, stiffness: 200 });
          borderRadius.value = withSpring(BorderRadius.lg, { damping: 18, stiffness: 200 });
          runOnJS(setIsExpanded)(false);
        }
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: sheetHeight.value,
    borderTopLeftRadius: borderRadius.value,
    borderTopRightRadius: borderRadius.value,
  }));

  const animatedStickyStyle = useAnimatedStyle(() => {
    if (activeSectionY.value <= 0) return { opacity: 0 };
    const opacity = interpolate(
      scrollY.value,
      [activeSectionY.value - 4, activeSectionY.value + 12],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const handleClose = () => handleCloseAnimated();

  return (
    <Modal
      visible={visible || isClosing}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => handleCloseAnimated()}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>

      <View style={styles.modalOverlay}>
        <Pressable style={[styles.backdrop, { backgroundColor: isExpanded ? "transparent" : "rgba(0, 0, 0, 0.5)" }]} onPress={() => handleCloseAnimated()} />

        {/* <GestureDetector gesture={panGesture}> */}
          <Animated.View
            style={[
              styles.modalContent,
              sheetStyle,
              {
                backgroundColor: theme.backgroundRoot,
                paddingBottom: insets.bottom + Spacing.lg,
                paddingTop: isExpanded ? insets.top : Spacing.sm,
              },
            ]}
          >
            {!isExpanded && <View style={styles.handle} />}
            <GestureDetector gesture={panGesture}>
            <View style={styles.header}>
              {isExpanded ? (
                <Pressable onPress={handleClose} style={styles.backButton}>
                  <Feather name="arrow-left" size={24} color={theme.text} />
                </Pressable>
              ) : null}
              <ThemedText type="h4" style={isExpanded ? styles.expandedTitle : undefined}>Add Drink</ThemedText>
              {onNavigateToCustomDrink && !isExpanded && (
                <Pressable onPress={handleAddCustomDrink} style={styles.addCustomButton}>
                  <Feather name="plus" size={24} color={Colors.light.accent} />
                </Pressable>
              )}
              {isExpanded && onNavigateToCustomDrink && (
                <Pressable onPress={handleAddCustomDrink} style={styles.addCustomButton}>
                  <Feather name="plus" size={24} color={Colors.light.accent} />
                </Pressable>
              )}
            </View>
            </GestureDetector>
            {!selectedDrink ? (
              <View style={styles.drinkListContainer}>
                {/* Fixed Search Bar - Always Visible */}
                <View style={[styles.fixedHeader, { backgroundColor: theme.backgroundRoot, position: "relative" }]}>
                  <View style={styles.searchRow}>
                    <View style={[styles.searchBox, { backgroundColor: theme.backgroundDefault }]}>
                      <Feather name="search" size={20} color={theme.textMuted} />
                      <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search drinks or brands..."
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")}>
                          <Feather name="x" size={20} color={theme.textMuted} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                  
                  {/* Sticky Section Header Overlay */}
                  <Animated.View style={[styles.stickyClone, { backgroundColor: theme.backgroundRoot }, animatedStickyStyle]}>
                    <ThemedText type="small" muted style={styles.sectionLabel}>
                      {currentStickyLabel}
                    </ThemedText>
                  </Animated.View>
                </View>

                {/* Scrollable Content - Categories Scroll With Content */}
                <Animated.ScrollView
                  style={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={handleInfiniteScroll}
                  onScrollEndDrag={handleInfiniteScroll}
                >
                  {/* Categories in ScrollView */}
                  <View style={styles.categoriesRow}>
                    {QUICK_CATEGORIES.map((cat) => (
                      <QuickCategoryCard
                        key={cat.key}
                        label={cat.label}
                        icon={cat.icon}
                        isActive={selectedCategory === cat.key}
                        onPress={() =>
                          setSelectedCategory(selectedCategory === cat.key ? null : cat.key)
                        }
                      />
                    ))}
                  </View>

                  {recentEntries.length > 0 && !searchQuery && (
                    <View 
                      style={styles.section}
                      onLayout={(e) => {
                        quickAddY.value = e.nativeEvent.layout.y;
                      }}
                    >
                      <ThemedText type="small" muted style={styles.sectionLabel}>
                        QUICK ADD
                      </ThemedText>
                      {recentEntries.map((entry) => (
                        <RecentEntryItem
                          key={entry.id}
                          entry={entry}
                          onPress={() => handleQuickAdd(entry)}
                        />
                      ))}
                    </View>
                  )}

                  {customDrinks.length > 0 && !searchQuery && (
                    <View 
                      style={styles.section}
                      onLayout={(e) => {
                        customDrinksY.value = e.nativeEvent.layout.y;
                      }}
                    >
                      <ThemedText type="small" muted style={styles.sectionLabel}>
                        MY CUSTOM DRINKS
                      </ThemedText>
                      {customDrinks.map((drink) => (
                        <CustomDrinkListItem
                          key={drink.id}
                          drink={drink}
                          onPress={() => handleSelectDrink(drink)}
                          onEdit={() => handleEditCustomDrink(drink)}
                        />
                      ))}
                    </View>
                  )}

                  <View 
                    style={styles.section}
                    onLayout={(e) => {
                      categoryHeaderY.value = e.nativeEvent.layout.y;
                    }}>
                    <ThemedText type="small" muted style={styles.sectionLabel}>
                      {searchQuery ? "RESULTS" : selectedCategory!.toUpperCase()}
                    </ThemedText>
                    {displayedDrinks.map((drink) => (
                      <MemoizedDrinkListItem
                        key={drink.id}
                        drink={drink}
                        onPress={() => handleSelectDrink(drink)}
                      />
                    ))}
                    {hasMoreDrinks && (
                      <View style={styles.loadingMore}>
                        <ActivityIndicator size="small" color={Colors.light.accent} />
                      </View>
                    )}
                  </View>
                </Animated.ScrollView>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
              <Pressable
                onPress={() => setSelectedDrink(null)}
                style={styles.backToDrinksButton}
              >
                <Feather name="arrow-left" size={20} color={Colors.light.accent} />
                <ThemedText type="body" style={{ color: Colors.light.accent }}>
                  Back to drinks
                </ThemedText>
              </Pressable>

              <ThemedView elevation={1} style={styles.selectedDrinkCard}>
                <View style={styles.selectedDrinkHeader}>
                  <View style={styles.drinkIconLarge}>
                    <Feather
                      name={selectedDrink.icon as keyof typeof Feather.glyphMap}
                      size={28}
                      color={Colors.light.accent}
                    />
                  </View>
                  <View style={styles.selectedDrinkInfo}>
                    <ThemedText type="h4">{selectedDrink.name}</ThemedText>
                    <ThemedText type="small" muted>
                      {selectedDrink.caffeinePer100ml}mg per 100ml
                    </ThemedText>
                  </View>
                </View>

                {selectedDrink.sizes && selectedDrink.sizes.length > 0 && (
                  <View style={styles.sizesSection}>
                    <ThemedText type="small" muted style={styles.sizesLabel}>
                      SIZE
                    </ThemedText>
                    <View style={styles.sizesRow}>
                      {selectedDrink.sizes.map((size) => (
                        <SizeButton
                          key={size.name}
                          label={size.name}
                          sublabel={`${size.ml}ml`}
                          isActive={selectedSize === size.ml}
                          onPress={() => setSelectedSize(size.ml)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.caffeinePreview}>
                  <ThemedText type="caption" muted>
                    CAFFEINE
                  </ThemedText>
                  <ThemedText
                    type="h2"
                    style={{
                      color:
                        warningLevel === "danger"
                          ? Colors.light.danger
                          : warningLevel === "warning"
                            ? Colors.light.warning
                            : Colors.light.accent,
                    }}
                  >
                    {caffeineMg} mg
                  </ThemedText>
                </View>

                {warningLevel && (
                  <View
                    style={[
                      styles.warningBanner,
                      {
                        backgroundColor:
                          warningLevel === "danger"
                            ? `${Colors.light.danger}20`
                            : `${Colors.light.warning}20`,
                      },
                    ]}
                  >
                    <Feather
                      name="alert-triangle"
                      size={16}
                      color={
                        warningLevel === "danger"
                          ? Colors.light.danger
                          : Colors.light.warning
                      }
                    />
                    <ThemedText
                      type="small"
                      style={{
                        color:
                          warningLevel === "danger"
                            ? Colors.light.danger
                            : Colors.light.warning,
                        flex: 1,
                      }}
                    >
                      {warningLevel === "danger"
                        ? "This will exceed your daily limit!"
                        : "You're approaching your daily limit. Consider a smaller size."}
                    </ThemedText>
                  </View>
                )}
              </ThemedView>

              <View style={styles.optionsSection}>
                <View
                  style={[
                    styles.notesInput,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <TextInput
                    style={[styles.notesTextInput, { color: theme.text }]}
                    placeholder="Add a note (optional)"
                    placeholderTextColor={theme.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                <Pressable
                  onPress={() => setIsFavorite(!isFavorite)}
                  style={[
                    styles.favoriteToggle,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <View style={styles.favoriteToggleContent}>
                    <Feather
                      name="heart"
                      size={20}
                      color={isFavorite ? Colors.light.danger : theme.textMuted}
                    />
                    <ThemedText type="body">Mark as favorite</ThemedText>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isFavorite
                          ? Colors.light.accent
                          : "transparent",
                        borderColor: isFavorite
                          ? Colors.light.accent
                          : theme.textMuted,
                      },
                    ]}
                  >
                    {isFavorite && (
                      <Feather name="check" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </Pressable>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={handleClose}
                  style={[
                    styles.cancelButton,
                    { borderColor: theme.textMuted },
                  ]}
                >
                  <ThemedText type="body" muted>
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleAdd}
                  style={[
                    styles.addButton,
                    { opacity: caffeineMg > 0 ? 1 : 0.5 },
                  ]}
                  disabled={caffeineMg <= 0}
                >
                  <ThemedText type="body" style={styles.addButtonText}>
                    Add to today
                  </ThemedText>
                </Pressable>
              </View>
            </ScrollView>
            )}
          </Animated.View>
        {/* </GestureDetector> */}
      </View>
      </GestureHandlerRootView>
      <CustomDrinkModal
        visible={showCustomDrinkModal}
        onClose={() => { setShowCustomDrinkModal(false); setPrefillDrink(null); setEditingCustomDrink(null); }}
        onAdd={handleCustomDrinkAdded}
        prefillDrink={prefillDrink}
        editCustomDrink={editingCustomDrink}
        onSaveCustomDrink={handleSaveCustomDrink}
      />
    </Modal>
  );
}

interface QuickCategoryCardProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  isActive: boolean;
  onPress: () => void;
}

function QuickCategoryCard({
  label,
  icon,
  isActive,
  onPress,
}: QuickCategoryCardProps) {
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
        styles.quickCategoryCard,
        {
          backgroundColor: isActive
            ? Colors.light.accent
            : theme.backgroundDefault,
        },
        animatedStyle,
      ]}
    >
      <Feather name={icon} size={24} color={isActive ? "#FFFFFF" : theme.text} />
      <ThemedText
        type="small"
        style={[
          styles.quickCategoryLabel,
          { color: isActive ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

interface DrinkListItemProps {
  drink: DrinkItem;
  onPress: () => void;
}

function DrinkListItem({ drink, onPress }: DrinkListItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const caffeineMg = Math.round(
    (drink.caffeinePer100ml * drink.defaultServingMl) / 100,
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.drinkListItem,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.drinkIcon}>
        <Image
          source={getCategoryImageSource(drink.category)}
          style={{ width: 40, height: 40, borderRadius: 20 }}
          resizeMode="cover"
        />
      </View>
      <View style={styles.drinkInfo}>
        <ThemedText type="body" style={styles.drinkName}>
          {drink.name}
        </ThemedText>
        <ThemedText type="caption" muted>
          {caffeineMg}mg / {drink.defaultServingMl}ml
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textMuted} />
    </AnimatedPressable>
  );
}

const MemoizedDrinkListItem = memo(DrinkListItem, (prev, next) => prev.drink.id === next.drink.id);

interface CustomDrinkListItemProps {
  drink: DrinkItem;
  onPress: () => void;
  onEdit: () => void;
}

function CustomDrinkListItem({ drink, onPress, onEdit }: CustomDrinkListItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const caffeineMg = Math.round(
    (drink.caffeinePer100ml * drink.defaultServingMl) / 100,
  );
  const servingLabel = drink.sizes?.[0]?.name || "cup";
  const imageSource = getImageSourceForDrinkModal(drink);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[styles.drinkListItem, { backgroundColor: theme.backgroundDefault }, animatedStyle]}
    >
      <View style={styles.drinkIcon}>
        <Image
          source={imageSource.source || { uri: imageSource.uri }}
          style={{ width: 40, height: 40, borderRadius: 20 }}
          resizeMode="cover"
        />
      </View>
      <View style={styles.drinkInfo}>
        <ThemedText type="body" style={styles.drinkName}>
          {drink.name}
        </ThemedText>
        <ThemedText type="caption" muted>
          {caffeineMg} mg / {servingLabel}
        </ThemedText>
      </View>
      <Pressable 
        onPress={(e) => { e.stopPropagation(); onEdit(); }}
        style={styles.editButton}
        hitSlop={8}
      >
        <Feather name="edit-2" size={16} color={Colors.light.accent} />
      </Pressable>
    </AnimatedPressable>
  );
}

interface RecentEntryItemProps {
  entry: DrinkEntry;
  onPress: () => void;
}

function RecentEntryItem({ entry, onPress }: RecentEntryItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const servingLabel = (() => {
    if (!entry.unit) {
      return entry.servingSize >= 100 ? `${(entry.servingSize / 100).toFixed(2).replace(/\.?0+$/, '')} cup` : `${entry.servingSize}ml`;
    }
    if (entry.unit === "ml") {
      return `${entry.servingSize}ml`;
    }
    const INBUILT_CATEGORIES = ["coffee", "tea", "energy", "soda", "chocolate"];
    const drink = INBUILT_CATEGORIES.includes(entry.category) ? require("@/store/caffeineStore").DRINK_DATABASE.find((d: any) => d.name.toLowerCase() === entry.name.toLowerCase() && d.category === entry.category) : null;
    const divisor = drink?.defaultServingMl || 100;
    return `${(entry.servingSize / divisor).toFixed(2).replace(/\.?0+$/, '')} ${entry.unit}`;
  })();
  const imageSource = getImageSourceForDrinkModal(entry);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[styles.drinkListItem, { backgroundColor: theme.backgroundDefault }, animatedStyle]}
    >
      <View style={styles.drinkIcon}>
        <Image
          source={imageSource.source || { uri: imageSource.uri }}
          style={{ width: 40, height: 40, borderRadius: 20 }}
          resizeMode="cover"
        />
      </View>
      <View style={styles.drinkInfo}>
        <ThemedText type="body" style={styles.drinkName}>
          {entry.name}, {servingLabel}
        </ThemedText>
        <ThemedText type="caption" muted>
          Recently added: {formatTime(entry.timestamp)}
        </ThemedText>
      </View>
      <ThemedText type="body" style={{ fontWeight: "600" }}>
        {entry.caffeineAmount} mg
      </ThemedText>
    </AnimatedPressable>
  );
}

interface SizeButtonProps {
  label: string;
  sublabel: string;
  isActive: boolean;
  onPress: () => void;
}

function SizeButton({ label, sublabel, isActive, onPress }: SizeButtonProps) {
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
        styles.sizeButton,
        {
          backgroundColor: isActive
            ? Colors.light.accent
            : theme.backgroundSecondary,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="small"
        style={[
          styles.sizeButtonLabel,
          { color: isActive ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
      <ThemedText
        type="caption"
        style={{ color: isActive ? "#FFFFFF" : theme.textMuted, opacity: 0.8 }}
      >
        {sublabel}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingTop: Spacing.sm,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: Colors.light.divider,
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  expandedTitle: {
    flex: 1,
  },
  addCustomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.light.accent}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  drinkListContainer: {
    flex: 1,
  },
  fixedHeader: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stickyClone: {
    position: "absolute",
    left: Spacing.xl,
    right: Spacing.xl,
    top: SEARCH_BAR_HEIGHT,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    flex: 1,
  },
  customDrinkButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  customDrinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.light.accent}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  customDrinkInfo: {
    flex: 1,
  },
  customDrinkLabel: {
    fontWeight: "500",
    marginBottom: 2,
  },
  searchContainer: {
    marginBottom: Spacing.lg,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  categoriesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  quickCategoryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  quickCategoryLabel: {
    fontWeight: "500",
    textAlign: "center",
    fontSize: 12,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  drinkListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  drinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.light.accent}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  drinkInfo: {
    flex: 1,
  },
  customDrinkRight: {
    alignItems: "flex-end",
  },
  editButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  drinkName: {
    fontWeight: "500",
    marginBottom: 2,
  },
  backToDrinksButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  selectedDrinkCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  selectedDrinkHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  drinkIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.light.accent}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDrinkInfo: {
    flex: 1,
  },
  sizesSection: {
    marginBottom: Spacing.lg,
  },
  sizesLabel: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  sizesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sizeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  sizeButtonLabel: {
    fontWeight: "600",
  },
  caffeinePreview: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  optionsSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  notesInput: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  notesTextInput: {
    fontSize: 16,
  },
  favoriteToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  favoriteToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    borderWidth: 1,
  },
  addButton: {
    flex: 2,
    backgroundColor: Colors.light.accent,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
