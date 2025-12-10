import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

interface CustomDrinkModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd?: () => void;
}

const UNITS = ["cup", "shot", "ml", "oz"];
const TIME_OPTIONS = ["5 minutes", "10 minutes", "15 minutes", "30 minutes", "1 hour"];

export function CustomDrinkModal({ visible, onClose, onAdd }: CustomDrinkModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { addEntry, profile } = useCaffeineStore();

  const [drinkName, setDrinkName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("cup");
  const [caffeineMg, setCaffeineMg] = useState("10");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeToFinish, setTimeToFinish] = useState("10 minutes");

  const translateY = useSharedValue(MODAL_HEIGHT);
  const startY = useSharedValue(0);

  const totalCaffeine = useMemo(() => {
    const mg = parseInt(caffeineMg) || 0;
    return mg * quantity;
  }, [caffeineMg, quantity]);

  const peakTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 45);
    return now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }, []);

  const willDisruptSleep = useMemo(() => {
    const now = new Date();
    const sleepTimeDate = new Date();
    const sleepTimeParts = profile.sleepTime?.split(":") || ["22", "00"];
    sleepTimeDate.setHours(parseInt(sleepTimeParts[0]) || 22, parseInt(sleepTimeParts[1]) || 0, 0, 0);
    if (sleepTimeDate < now) {
      sleepTimeDate.setDate(sleepTimeDate.getDate() + 1);
    }
    const hoursUntilSleep = (sleepTimeDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilSleep < 6 && totalCaffeine > 50;
  }, [totalCaffeine, profile.sleepTime]);

  const resetState = () => {
    setDrinkName("");
    setQuantity(1);
    setSelectedUnit("cup");
    setCaffeineMg("10");
    setTimeToFinish("10 minutes");
  };

  useEffect(() => {
    if (visible) {
      translateY.value = MODAL_HEIGHT;
      setTimeout(() => {
        translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
      }, 50);
    } else {
      translateY.value = MODAL_HEIGHT;
    }
  }, [visible, translateY]);

  const closeModal = () => {
    translateY.value = withTiming(MODAL_HEIGHT, { duration: 200 }, () => {
      runOnJS(resetState)();
      runOnJS(onClose)();
    });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextY = Math.max(0, startY.value + event.translationY);
      translateY.value = nextY;
    })
    .onEnd((event) => {
      const shouldClose = translateY.value > MODAL_HEIGHT * 0.35 || event.velocityY > 800;
      if (shouldClose) {
        translateY.value = withTiming(MODAL_HEIGHT, { duration: 200 }, () => {
          runOnJS(resetState)();
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleAdd = () => {
    if (drinkName.trim() && totalCaffeine > 0) {
      const customDrink = {
        id: `custom-${Date.now()}`,
        name: drinkName.trim(),
        category: "custom" as const,
        caffeinePer100ml: (parseInt(caffeineMg) || 0),
        defaultServingMl: 100,
        icon: "coffee",
        sizes: [{ name: selectedUnit, ml: 100 }],
      };
      addEntry(customDrink, 100 * quantity, undefined, false);
      closeModal();
      onAdd?.();
    }
  };

  const incrementQuantity = () => setQuantity((q) => Math.min(q + 1, 10));
  const decrementQuantity = () => setQuantity((q) => Math.max(q - 1, 1));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeModal} />

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.modalContent,
              sheetStyle,
              {
                backgroundColor: theme.backgroundRoot,
                paddingBottom: insets.bottom + Spacing.lg,
              },
            ]}
          >
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: Colors.light.accent }]} />
            </View>

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.topSection}>
                <Pressable style={[styles.chooseIconBox, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="plus" size={28} color={theme.textMuted} />
                  <ThemedText type="caption" muted>Choose</ThemedText>
                </Pressable>

                <View style={styles.nameInputSection}>
                  <ThemedText type="caption" muted>
                    You are drinking {quantity} {selectedUnit} of
                  </ThemedText>
                  <TextInput
                    style={[styles.nameInput, { color: theme.text, borderBottomColor: theme.divider }]}
                    placeholder="Enter name"
                    placeholderTextColor={theme.textMuted}
                    value={drinkName}
                    onChangeText={setDrinkName}
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              <View style={styles.quantityRow}>
                <ThemedText type="h1" style={styles.quantityNumber}>{quantity}</ThemedText>
                <View style={styles.quantityButtons}>
                  <Pressable
                    onPress={incrementQuantity}
                    style={[styles.quantityBtn, { borderColor: theme.textMuted }]}
                  >
                    <Feather name="plus" size={20} color={theme.textMuted} />
                  </Pressable>
                  <Pressable
                    onPress={decrementQuantity}
                    style={[styles.quantityBtn, { borderColor: theme.textMuted }]}
                  >
                    <Feather name="minus" size={20} color={theme.textMuted} />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              <View style={styles.unitCaffeineRow}>
                <Pressable
                  onPress={() => setShowUnitPicker(!showUnitPicker)}
                  style={styles.unitSelector}
                >
                  <Feather name="chevron-down" size={16} color={theme.textMuted} />
                  <ThemedText type="body">{selectedUnit}</ThemedText>
                </Pressable>

                <View style={styles.caffeineInputWrapper}>
                  <TextInput
                    style={[styles.caffeineInput, { color: theme.text }]}
                    value={caffeineMg}
                    onChangeText={setCaffeineMg}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <ThemedText type="body" muted> mg</ThemedText>
                </View>
              </View>

              {showUnitPicker && (
                <View style={[styles.pickerDropdown, { backgroundColor: theme.backgroundSecondary }]}>
                  {UNITS.map((unit) => (
                    <Pressable
                      key={unit}
                      onPress={() => {
                        setSelectedUnit(unit);
                        setShowUnitPicker(false);
                      }}
                      style={[
                        styles.pickerItem,
                        selectedUnit === unit && { backgroundColor: `${Colors.light.accent}20` },
                      ]}
                    >
                      <ThemedText type="body">{unit}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              <View style={styles.timeRow}>
                <ThemedText type="body">Started drinking:</ThemedText>
                <Pressable style={[styles.timeChip, { borderColor: Colors.light.accent }]}>
                  <Feather name="calendar" size={14} color={Colors.light.accent} />
                  <ThemedText type="small" style={{ color: Colors.light.accent }}>now</ThemedText>
                </Pressable>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              <View style={styles.timeRow}>
                <ThemedText type="body">Time to finish:</ThemedText>
                <Pressable
                  onPress={() => setShowTimePicker(!showTimePicker)}
                  style={[styles.timeChip, { borderColor: Colors.light.accent }]}
                >
                  <Feather name="clock" size={14} color={Colors.light.accent} />
                  <ThemedText type="small" style={{ color: Colors.light.accent }}>{timeToFinish}</ThemedText>
                </Pressable>
              </View>

              {showTimePicker && (
                <View style={[styles.pickerDropdown, { backgroundColor: theme.backgroundSecondary }]}>
                  {TIME_OPTIONS.map((time) => (
                    <Pressable
                      key={time}
                      onPress={() => {
                        setTimeToFinish(time);
                        setShowTimePicker(false);
                      }}
                      style={[
                        styles.pickerItem,
                        timeToFinish === time && { backgroundColor: `${Colors.light.accent}20` },
                      ]}
                    >
                      <ThemedText type="body">{time}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              <ThemedView
                elevation={1}
                style={[
                  styles.peakInfoCard,
                  willDisruptSleep && { backgroundColor: `${Colors.light.warning}10` },
                ]}
              >
                <View style={styles.peakInfoHeader}>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    Your caffeine will peak at:
                  </ThemedText>
                  <ThemedText
                    type="h3"
                    style={{ color: willDisruptSleep ? Colors.light.warning : Colors.light.accent }}
                  >
                    {totalCaffeine} mg
                  </ThemedText>
                </View>
                <ThemedText type="caption" muted>
                  This item will peak at {peakTime}.{" "}
                  {willDisruptSleep
                    ? "This may disrupt your sleep time."
                    : "This won't disrupt your sleep time."}
                </ThemedText>
              </ThemedView>

              <Pressable
                onPress={handleAdd}
                style={[
                  styles.addButton,
                  { opacity: drinkName.trim() && totalCaffeine > 0 ? 1 : 0.5 },
                ]}
                disabled={!drinkName.trim() || totalCaffeine <= 0}
              >
                <ThemedText type="body" style={styles.addButtonText}>Add</ThemedText>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    maxHeight: MODAL_HEIGHT,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chooseIconBox: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  nameInputSection: {
    flex: 1,
    paddingTop: Spacing.xs,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "600",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  quantityNumber: {
    fontSize: 48,
    fontWeight: "300",
  },
  quantityButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quantityBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  unitCaffeineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  unitSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  caffeineInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  caffeineInput: {
    fontSize: 18,
    fontWeight: "600",
    minWidth: 50,
    textAlign: "right",
  },
  pickerDropdown: {
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    overflow: "hidden",
  },
  pickerItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  peakInfoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  peakInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
