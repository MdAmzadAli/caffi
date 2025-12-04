import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  SlideInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCaffeineStore, DrinkItem, DRINK_DATABASE } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AddDrinkModalProps {
  visible: boolean;
  onClose: () => void;
}

type Category = "coffee" | "tea" | "energy" | "soda" | "chocolate" | "custom";

const QUICK_CATEGORIES: { key: Category; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "coffee", label: "Coffee", icon: "coffee" },
  { key: "tea", label: "Tea", icon: "droplet" },
  { key: "energy", label: "Energy", icon: "zap" },
  { key: "soda", label: "Soda", icon: "droplet" },
  { key: "chocolate", label: "Chocolate", icon: "square" },
];

export default function AddDrinkModal({ visible, onClose }: AddDrinkModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { addEntry, getAllDrinks, getFavoriteDrinks, profile } = useCaffeineStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<DrinkItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const allDrinks = getAllDrinks();
  const favoriteDrinks = getFavoriteDrinks();

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

    return drinks.slice(0, 10);
  }, [allDrinks, selectedCategory, searchQuery]);

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
    setSelectedDrink(drink);
    setSelectedSize(drink.defaultServingMl);
  };

  const handleAdd = () => {
    if (selectedDrink && selectedSize) {
      addEntry(selectedDrink, selectedSize, notes || undefined, isFavorite);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedDrink(null);
    setSelectedSize(null);
    setNotes("");
    setIsFavorite(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <ThemedText type="h4">Add Drink</ThemedText>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {!selectedDrink ? (
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.searchContainer}>
                <View
                  style={[
                    styles.searchBox,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
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

              <View style={styles.categoriesRow}>
                {QUICK_CATEGORIES.map((cat) => (
                  <QuickCategoryCard
                    key={cat.key}
                    label={cat.label}
                    icon={cat.icon}
                    isActive={selectedCategory === cat.key}
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory === cat.key ? null : cat.key,
                      )
                    }
                  />
                ))}
              </View>

              {favoriteDrinks.length > 0 && !searchQuery && !selectedCategory && (
                <View style={styles.section}>
                  <ThemedText type="small" muted style={styles.sectionLabel}>
                    FAVORITES
                  </ThemedText>
                  {favoriteDrinks.slice(0, 3).map((drink) => (
                    <DrinkListItem
                      key={drink.id}
                      drink={drink}
                      onPress={() => handleSelectDrink(drink)}
                    />
                  ))}
                </View>
              )}

              <View style={styles.section}>
                <ThemedText type="small" muted style={styles.sectionLabel}>
                  {searchQuery || selectedCategory ? "RESULTS" : "POPULAR"}
                </ThemedText>
                {filteredDrinks.map((drink) => (
                  <DrinkListItem
                    key={drink.id}
                    drink={drink}
                    onPress={() => handleSelectDrink(drink)}
                  />
                ))}
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Pressable
                onPress={() => setSelectedDrink(null)}
                style={styles.backButton}
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
      </View>
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
        <Feather
          name={drink.icon as keyof typeof Feather.glyphMap}
          size={20}
          color={Colors.light.accent}
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
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingTop: Spacing.sm,
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
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
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
    marginBottom: Spacing.xl,
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
  },
  section: {
    marginBottom: Spacing.lg,
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
  drinkName: {
    fontWeight: "500",
    marginBottom: 2,
  },
  backButton: {
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
