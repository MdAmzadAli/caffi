import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCaffeineStore, DrinkItem, DRINK_DATABASE } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Category = "all" | "coffee" | "tea" | "energy" | "soda" | "chocolate";

const CATEGORIES: { key: Category; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "all", label: "All", icon: "grid" },
  { key: "coffee", label: "Coffee", icon: "coffee" },
  { key: "tea", label: "Tea", icon: "droplet" },
  { key: "energy", label: "Energy", icon: "zap" },
  { key: "soda", label: "Soda", icon: "droplet" },
  { key: "chocolate", label: "Chocolate", icon: "square" },
];

export default function DrinkDatabaseScreen() {
  const { theme } = useTheme();
  const { addEntry, getAllDrinks, favorites, toggleFavorite } = useCaffeineStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [addedDrinkId, setAddedDrinkId] = useState<string | null>(null);

  const allDrinks = getAllDrinks();

  const filteredDrinks = useMemo(() => {
    let drinks = allDrinks;

    if (selectedCategory !== "all") {
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

  const groupedDrinks = useMemo(() => {
    const groups: { [key: string]: DrinkItem[] } = {};

    filteredDrinks.forEach((drink) => {
      const category = drink.category.charAt(0).toUpperCase() + drink.category.slice(1);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(drink);
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredDrinks]);

  const handleQuickAdd = (drink: DrinkItem) => {
    addEntry(drink, drink.defaultServingMl);
    setAddedDrinkId(drink.id);
    setTimeout(() => setAddedDrinkId(null), 1500);
  };

  const getCategoryIcon = (category: string): keyof typeof Feather.glyphMap => {
    switch (category) {
      case "coffee":
        return "coffee";
      case "tea":
        return "droplet";
      case "energy":
        return "zap";
      case "soda":
        return "droplet";
      case "chocolate":
        return "square";
      default:
        return "circle";
    }
  };

  return (
    <ScreenScrollView header={<ScreenHeader title="Drink Database" showBackButton={true} />}>
      <View style={styles.searchContainer}>
        <View
          style={[styles.searchBox, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="search" size={20} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search drinks..."
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.key}
            label={cat.label}
            icon={cat.icon}
            isActive={selectedCategory === cat.key}
            onPress={() => setSelectedCategory(cat.key)}
          />
        ))}
      </ScrollView>

      {filteredDrinks.length === 0 ? (
        <ThemedView elevation={1} style={styles.emptyState}>
          <Feather name="search" size={32} color={theme.textMuted} />
          <ThemedText muted style={styles.emptyText}>
            No drinks found
          </ThemedText>
          <ThemedText type="small" muted>
            Try a different search term
          </ThemedText>
        </ThemedView>
      ) : (
        groupedDrinks.map(([category, drinks]) => (
          <View key={category} style={styles.categorySection}>
            <ThemedText type="small" muted style={styles.categoryLabel}>
              {category.toUpperCase()}
            </ThemedText>
            <ThemedView elevation={1} style={styles.drinksCard}>
              {drinks.map((drink, index) => (
                <React.Fragment key={drink.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <DrinkListItem
                    drink={drink}
                    isFavorite={favorites.includes(drink.id)}
                    isAdded={addedDrinkId === drink.id}
                    onAdd={() => handleQuickAdd(drink)}
                    onToggleFavorite={() => toggleFavorite(drink.id)}
                  />
                </React.Fragment>
              ))}
            </ThemedView>
          </View>
        ))
      )}
    </ScreenScrollView>
  );
}

interface CategoryChipProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  isActive: boolean;
  onPress: () => void;
}

function CategoryChip({ label, icon, isActive, onPress }: CategoryChipProps) {
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
        styles.categoryChip,
        {
          backgroundColor: isActive
            ? Colors.light.accent
            : theme.backgroundDefault,
        },
        animatedStyle,
      ]}
    >
      <Feather
        name={icon}
        size={16}
        color={isActive ? "#FFFFFF" : theme.text}
      />
      <ThemedText
        type="small"
        style={[
          styles.categoryChipLabel,
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
  isFavorite: boolean;
  isAdded: boolean;
  onAdd: () => void;
  onToggleFavorite: () => void;
}

function DrinkListItem({
  drink,
  isFavorite,
  isAdded,
  onAdd,
  onToggleFavorite,
}: DrinkListItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const caffeineMg = Math.round(
    (drink.caffeinePer100ml * drink.defaultServingMl) / 100,
  );

  return (
    <View style={styles.drinkItem}>
      <Pressable onPress={onToggleFavorite} style={styles.favoriteButton}>
        <Feather
          name={isFavorite ? "heart" : "heart"}
          size={18}
          color={isFavorite ? Colors.light.danger : theme.textMuted}
          style={{ opacity: isFavorite ? 1 : 0.4 }}
        />
      </Pressable>

      <View style={styles.drinkInfo}>
        <ThemedText type="body" style={styles.drinkName}>
          {drink.name}
        </ThemedText>
        <ThemedText type="caption" muted>
          {caffeineMg}mg per {drink.defaultServingMl}ml
        </ThemedText>
      </View>

      <AnimatedPressable
        onPress={onAdd}
        onPressIn={() => {
          scale.value = withSpring(0.9);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.addButton,
          {
            backgroundColor: isAdded
              ? Colors.light.success
              : Colors.light.accent,
          },
          animatedStyle,
        ]}
      >
        <Feather
          name={isAdded ? "check" : "plus"}
          size={18}
          color="#FFFFFF"
        />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    marginBottom: Spacing.md,
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
  categoriesScroll: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.xl,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  categoryChipLabel: {
    fontWeight: "500",
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryLabel: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  drinksCard: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginLeft: 50,
  },
  drinkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  favoriteButton: {
    padding: Spacing.xs,
  },
  drinkInfo: {
    flex: 1,
  },
  drinkName: {
    fontWeight: "500",
    marginBottom: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
