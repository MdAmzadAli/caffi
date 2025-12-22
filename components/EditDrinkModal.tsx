import React, { useState, useEffect } from "react";
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
  FadeIn,
  SlideInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCaffeineStore, DrinkEntry } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface EditDrinkModalProps {
  visible: boolean;
  entry: DrinkEntry | null;
  onClose: () => void;
}

export default function EditDrinkModal({ visible, entry, onClose }: EditDrinkModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { updateEntry, getAllDrinks } = useCaffeineStore();

  const [servingSize, setServingSize] = useState<string>("");
  const [caffeineAmount, setCaffeineAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (entry) {
      setServingSize(entry.servingSize.toString());
      setCaffeineAmount(entry.caffeineAmount.toString());
      setNotes(entry.notes || "");
    }
  }, [entry]);

  const handleSave = () => {
    if (!entry) return;

    const newServingSize = parseInt(servingSize) || entry.servingSize;
    const newCaffeineAmount = parseInt(caffeineAmount) || entry.caffeineAmount;

    updateEntry(entry.id, {
      servingSize: newServingSize,
      caffeineAmount: newCaffeineAmount,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!entry) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.lg,
              maxHeight: SCREEN_HEIGHT * 0.7,
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <ThemedText type="h3">Edit Drink</ThemedText>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ThemedView elevation={1} style={styles.drinkCard}>
              <View style={styles.drinkHeader}>
                <View style={styles.drinkIconLarge}>
                  <Feather
                    name={getCategoryIcon(entry.category)}
                    size={28}
                    color={Colors.light.accent}
                  />
                </View>
                <View style={styles.drinkInfo}>
                  <ThemedText type="h4">{entry.name}</ThemedText>
                  <ThemedText type="small" muted>
                    {entry.category}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.inputSection}>
                <ThemedText type="small" muted style={styles.inputLabel}>
                  SERVING SIZE (ml)
                </ThemedText>
                <View
                  style={[
                    styles.inputBox,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={servingSize}
                    onChangeText={setServingSize}
                    keyboardType="numeric"
                    placeholder="Enter size in ml"
                    placeholderTextColor={theme.textMuted}
                  />
                  <ThemedText type="small" muted>
                    ml
                  </ThemedText>
                </View>
              </View>

              <View style={styles.inputSection}>
                <ThemedText type="small" muted style={styles.inputLabel}>
                  CAFFEINE AMOUNT (mg)
                </ThemedText>
                <View
                  style={[
                    styles.inputBox,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={caffeineAmount}
                    onChangeText={setCaffeineAmount}
                    keyboardType="numeric"
                    placeholder="Enter caffeine in mg"
                    placeholderTextColor={theme.textMuted}
                  />
                  <ThemedText type="small" muted>
                    mg
                  </ThemedText>
                </View>
              </View>

              <View style={styles.inputSection}>
                <ThemedText type="small" muted style={styles.inputLabel}>
                  NOTES (optional)
                </ThemedText>
                <View
                  style={[
                    styles.inputBox,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add a note..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                  />
                </View>
              </View>
            </ThemedView>

            <View style={styles.buttonRow}>
              <Pressable
                onPress={handleClose}
                style={[
                  styles.button,
                  styles.cancelButton,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <ThemedText type="body" style={styles.cancelButtonText}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[
                  styles.button,
                  styles.saveButton,
                  { backgroundColor: Colors.light.accent },
                ]}
              >
                <ThemedText type="body" style={styles.saveButtonText}>
                  Save Changes
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function getCategoryIcon(category: string): keyof typeof Feather.glyphMap {
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
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.divider,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    flex: 1,
  },
  drinkCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  drinkHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  drinkIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.light.accent}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  drinkInfo: {
    flex: 1,
  },
  inputSection: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  cancelButton: {},
  saveButton: {},
  cancelButtonText: {
    fontWeight: "600",
  },
  saveButtonText: {
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
