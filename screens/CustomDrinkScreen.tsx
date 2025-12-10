import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCaffeineStore, DrinkItem } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";

type CustomDrinkScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "CustomDrink">;
};

type Category = "coffee" | "tea" | "energy" | "soda" | "chocolate" | "custom";

const CATEGORIES: { key: Category; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "coffee", label: "Coffee", icon: "coffee" },
  { key: "tea", label: "Tea", icon: "droplet" },
  { key: "energy", label: "Energy", icon: "zap" },
  { key: "soda", label: "Soda", icon: "droplet" },
  { key: "chocolate", label: "Chocolate", icon: "square" },
  { key: "custom", label: "Other", icon: "circle" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CustomDrinkScreen({
  navigation,
}: CustomDrinkScreenProps) {
  const { theme } = useTheme();
  const { addCustomDrink } = useCaffeineStore();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("coffee");
  const [caffeinePer100ml, setCaffeinePer100ml] = useState("");
  const [defaultServingMl, setDefaultServingMl] = useState("");

  const caffeineMg = caffeinePer100ml && defaultServingMl
    ? Math.round((parseInt(caffeinePer100ml) * parseInt(defaultServingMl)) / 100)
    : 0;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a name for your drink.");
      return;
    }
    if (!caffeinePer100ml || parseInt(caffeinePer100ml) <= 0) {
      Alert.alert(
        "Invalid Caffeine",
        "Please enter a valid caffeine amount per 100ml.",
      );
      return;
    }
    if (!defaultServingMl || parseInt(defaultServingMl) <= 0) {
      Alert.alert("Invalid Serving Size", "Please enter a valid serving size.");
      return;
    }

    const selectedCat = CATEGORIES.find((c) => c.key === category);

    addCustomDrink({
      name: name.trim(),
      category,
      caffeinePer100ml: parseInt(caffeinePer100ml),
      defaultServingMl: parseInt(defaultServingMl),
      icon: selectedCat?.icon || "circle",
    });

    navigation.goBack();
  };

  return (
    <ScreenKeyboardAwareScrollView header={<ScreenHeader title="Add Custom Drink" showBackButton={true} />}>
      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          DRINK NAME
        </ThemedText>
        <ThemedView elevation={1} style={styles.card}>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="e.g., Homemade Espresso"
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
          />
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          CATEGORY
        </ThemedText>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <CategoryButton
              key={cat.key}
              label={cat.label}
              icon={cat.icon}
              isActive={category === cat.key}
              onPress={() => setCategory(cat.key)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          CAFFEINE CONTENT
        </ThemedText>
        <ThemedView elevation={1} style={styles.card}>
          <View style={styles.inputRow}>
            <ThemedText type="body">Caffeine per 100ml</ThemedText>
            <View style={styles.inputWithUnit}>
              <TextInput
                style={[styles.numberInput, { color: theme.text }]}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                value={caffeinePer100ml}
                onChangeText={setCaffeinePer100ml}
                keyboardType="number-pad"
              />
              <ThemedText muted>mg</ThemedText>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.inputRow}>
            <ThemedText type="body">Default serving size</ThemedText>
            <View style={styles.inputWithUnit}>
              <TextInput
                style={[styles.numberInput, { color: theme.text }]}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                value={defaultServingMl}
                onChangeText={setDefaultServingMl}
                keyboardType="number-pad"
              />
              <ThemedText muted>ml</ThemedText>
            </View>
          </View>
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" muted style={styles.sectionLabel}>
          PREVIEW
        </ThemedText>
        <ThemedView elevation={1} style={styles.previewCard}>
          <View style={styles.previewIcon}>
            <Feather
              name={CATEGORIES.find((c) => c.key === category)?.icon || "circle"}
              size={24}
              color={Colors.light.accent}
            />
          </View>
          <View style={styles.previewInfo}>
            <ThemedText type="body" style={styles.previewName}>
              {name || "Your Drink Name"}
            </ThemedText>
            <ThemedText type="small" muted>
              {caffeineMg}mg per {defaultServingMl || "0"}ml serving
            </ThemedText>
          </View>
        </ThemedView>
      </View>

      <Pressable
        onPress={handleSave}
        style={({ pressed }) => [
          styles.saveButton,
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <ThemedText type="body" style={styles.saveButtonText}>
          Save Custom Drink
        </ThemedText>
      </Pressable>
    </ScreenKeyboardAwareScrollView>
  );
}

interface CategoryButtonProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  isActive: boolean;
  onPress: () => void;
}

function CategoryButton({
  label,
  icon,
  isActive,
  onPress,
}: CategoryButtonProps) {
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
        styles.categoryButton,
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
        size={20}
        color={isActive ? "#FFFFFF" : theme.text}
      />
      <ThemedText
        type="small"
        style={[
          styles.categoryButtonLabel,
          { color: isActive ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  textInput: {
    fontSize: 16,
    padding: Spacing.lg,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    gap: Spacing.xs,
  },
  categoryButtonLabel: {
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  inputWithUnit: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  numberInput: {
    fontSize: 16,
    textAlign: "right",
    minWidth: 60,
    padding: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginLeft: Spacing.lg,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.backgroundDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  saveButton: {
    backgroundColor: Colors.light.accent,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
