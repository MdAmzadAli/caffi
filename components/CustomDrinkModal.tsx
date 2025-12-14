import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Image,
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
import { ImagePickerModal } from "@/components/ImagePickerModal";
import { TimePickerModal } from "@/components/TimePickerModal";
import { TimeToFinishModal } from "@/components/TimeToFinishModal";
import { useCaffeineStore, DrinkEntry } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface CustomDrinkModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd?: () => void;
  editEntry?: DrinkEntry | null;
  prefillDrink?: { name: string; caffeinePer100ml: number; defaultServingMl: number; category?: string; sizes?: { name: string; ml: number }[] } | null;
}

const getUnitForDrink = (name: string, category?: string, sizes?: { name: string; ml: number }[]): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("espresso") || lowerName.includes("shot")) return "shot";
  if (lowerName.includes("can") || category === "energy" || category === "soda") return "can";
  if (lowerName.includes("bottle")) return "bottle";
  if (sizes?.[0]?.name) return sizes[0].name;
  if (category === "tea" || category === "coffee" || category === "chocolate") return "cup";
  return "cup";
};

const UNITS = ["cup", "shot", "ml", "oz", "teaspoon", "tablespoon", "glass", "can", "bottle", "scoop", "pint", "liter", "fl oz", "mug"];

export function CustomDrinkModal({ visible, onClose, onAdd, editEntry, prefillDrink }: CustomDrinkModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { addEntry, updateEntry, profile } = useCaffeineStore();
  const { height: windowHeight } = useWindowDimensions();
  
  const MODAL_HEIGHT = windowHeight * 0.75;
  const isEditMode = !!editEntry;

  const [drinkName, setDrinkName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("cup");
  const [caffeineMg, setCaffeineMg] = useState("10");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showTimeToFinishModal, setShowTimeToFinishModal] = useState(false);
  const [timeToFinishMinutes, setTimeToFinishMinutes] = useState(10);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [startTimeLabel, setStartTimeLabel] = useState("now");

  useEffect(() => {
    if (editEntry && visible) {
      setDrinkName(editEntry.name || "");
      setQuantity(1);
      setCaffeineMg(editEntry.caffeineAmount?.toString() || "10");
      setSelectedUnit("cup");
      setStartTime(new Date(editEntry.timestamp));
      const entryDate = new Date(editEntry.timestamp);
      const now = new Date();
      const isToday = entryDate.toDateString() === now.toDateString();
      if (isToday) {
        const timeDiff = Math.abs(now.getTime() - entryDate.getTime());
        if (timeDiff < 60000) {
          setStartTimeLabel("now");
        } else {
          setStartTimeLabel(entryDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
        }
      } else {
        setStartTimeLabel(entryDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
      }
    } else if (prefillDrink && visible && !editEntry) {
      setDrinkName(prefillDrink.name);
      setQuantity(1);
      const bestUnit = getUnitForDrink(prefillDrink.name, prefillDrink.category, prefillDrink.sizes);
      setSelectedUnit(bestUnit);
      const caffeine = Math.round((prefillDrink.caffeinePer100ml * prefillDrink.defaultServingMl) / 100);
      setCaffeineMg(caffeine.toString());
      setStartTime(new Date());
      setStartTimeLabel("now");
    }
  }, [editEntry, prefillDrink, visible]);

  const translateY = useSharedValue(MODAL_HEIGHT);
  const startY = useSharedValue(0);

  const totalCaffeine = useMemo(() => {
    if (prefillDrink && selectedUnit === "ml") {
      return (prefillDrink.caffeinePer100ml / 100) * quantity;
    }
    const mg = parseInt(caffeineMg) || 0;
    return mg * quantity;
  }, [caffeineMg, quantity, selectedUnit, prefillDrink]);

  const formatCaffeine = (value: number) => value.toFixed(3).replace(/\.?0+$/, '') || '0';

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
    setTimeToFinishMinutes(10);
    setSelectedImage(null);
    setStartTime(new Date());
    setStartTimeLabel("now");
  };

  const handleSelectImage = (imageUri: string) => {
    setSelectedImage(imageUri);
  };

  const handleSelectStartTime = (date: Date, label: string) => {
    setStartTime(date);
    setStartTimeLabel(label);
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
      if (isEditMode && editEntry) {
        updateEntry(editEntry.id, {
          name: drinkName.trim(),
          caffeineAmount: totalCaffeine,
          timestamp: startTime,
        });
        closeModal();
        onAdd?.();
      } else {
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

        {showUnitPicker && (
          <Pressable
            style={[StyleSheet.absoluteFillObject, { zIndex: 5 }]}
            onPress={() => setShowUnitPicker(false)}
          />
        )}

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.modalContent,
              sheetStyle,
              {
                backgroundColor: theme.backgroundRoot,
                paddingBottom: insets.bottom + Spacing.lg,
                maxHeight: MODAL_HEIGHT,
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
                <Pressable 
                  onPress={() => setShowImagePicker(true)}
                  style={[styles.chooseIconBox, { backgroundColor: theme.backgroundSecondary }]}
                >
                  {selectedImage ? (
                    selectedImage.startsWith("preset:") ? (
                      <View style={styles.selectedPresetIcon}>
                        <Feather name="coffee" size={32} color={Colors.light.accent} />
                      </View>
                    ) : (
                      <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                    )
                  ) : (
                    <>
                      <Feather name="plus" size={28} color={theme.textMuted} />
                      <ThemedText type="caption" muted>Choose</ThemedText>
                    </>
                  )}
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

              {prefillDrink ? (
                <View style={styles.prefillUnitSection}>
                  <Pressable
                    onPress={() => setSelectedUnit(getUnitForDrink(prefillDrink.name, prefillDrink.category, prefillDrink.sizes))}
                    style={styles.radioRow}
                  >
                    <View style={[styles.radioCircle, selectedUnit !== "ml" && styles.radioCircleActive]}>
                      {selectedUnit !== "ml" && <View style={styles.radioInner} />}
                    </View>
                    <ThemedText type="body" style={{ flex: 1 }}>
                      {getUnitForDrink(prefillDrink.name, prefillDrink.category, prefillDrink.sizes)}
                    </ThemedText>
                    <View style={styles.caffeineInputWrapper}>
                      <ThemedText type="body" style={{ color: theme.text }}>
                        {(parseInt(caffeineMg) || 0) * quantity}
                      </ThemedText>
                      <ThemedText type="body" muted> mg</ThemedText>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedUnit("ml")}
                    style={styles.radioRow}
                  >
                    <View style={[styles.radioCircle, selectedUnit === "ml" && styles.radioCircleActive]}>
                      {selectedUnit === "ml" && <View style={styles.radioInner} />}
                    </View>
                    <ThemedText type="body" style={{ flex: 1 }}>ml</ThemedText>
                    <View style={styles.caffeineInputWrapper}>
                      <ThemedText type="body" style={{ color: theme.text }}>
                        {formatCaffeine((prefillDrink.caffeinePer100ml / 100) * quantity)}
                      </ThemedText>
                      <ThemedText type="body" muted> mg</ThemedText>
                    </View>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.unitCaffeineRow}>
                  <View style={styles.unitSelectorContainer}>
                    <Pressable
                      onPress={() => {
                        setShowUnitPicker(!showUnitPicker);
                      }}
                      style={styles.unitSelector}
                    >
                      <Feather name="chevron-down" size={16} color={theme.textMuted} />
                      <ThemedText type="body">{selectedUnit}</ThemedText>
                    </Pressable>

                    {showUnitPicker && (
                      <View style={[styles.unitPickerDropdown, { backgroundColor: theme.backgroundSecondary }]}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
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
                        </ScrollView>
                      </View>
                    )}
                  </View>

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
              )}

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              <View style={styles.timeRow}>
                <ThemedText type="body">Started drinking:</ThemedText>
                <Pressable 
                  onPress={() => setShowStartTimePicker(true)}
                  style={[styles.timeChip, { borderColor: Colors.light.accent }]}
                >
                  <Feather name="calendar" size={14} color={Colors.light.accent} />
                  <ThemedText type="small" style={{ color: Colors.light.accent }}>{startTimeLabel}</ThemedText>
                </Pressable>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              <View style={styles.timeRow}>
                <ThemedText type="body">Time to finish:</ThemedText>
                <Pressable
                  onPress={() => setShowTimeToFinishModal(true)}
                  style={[styles.timeChip, { borderColor: Colors.light.accent }]}
                >
                  <Feather name="clock" size={14} color={Colors.light.accent} />
                  <ThemedText type="small" style={{ color: Colors.light.accent }}>{timeToFinishMinutes} minutes</ThemedText>
                </Pressable>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              <View
                style={[
                  styles.peakInfoCard,
                  { backgroundColor: `${Colors.light.accent}15` },
                ]}
              >
                <View style={styles.peakInfoHeader}>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    Your caffeine will peak at:
                  </ThemedText>
                  <ThemedText
                    type="h3"
                    style={{ color: Colors.light.accent }}
                  >
                    {formatCaffeine(totalCaffeine)} mg
                  </ThemedText>
                </View>
                <ThemedText type="caption" muted>
                  This item will peak at {peakTime}.{" "}
                  {willDisruptSleep
                    ? "This may disrupt your sleep time."
                    : "This won't disrupt your sleep time."}
                </ThemedText>
              </View>

              <Pressable
                onPress={handleAdd}
                style={[
                  styles.addButton,
                  { opacity: drinkName.trim() && totalCaffeine > 0 ? 1 : 0.5 },
                ]}
                disabled={!drinkName.trim() || totalCaffeine <= 0}
              >
                <ThemedText type="body" style={styles.addButtonText}>{isEditMode ? "Save" : "Add"}</ThemedText>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>

      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={handleSelectImage}
      />

      <TimePickerModal
        visible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        onSelectTime={handleSelectStartTime}
        initialDate={startTime}
      />

      <TimeToFinishModal
        visible={showTimeToFinishModal}
        onClose={() => setShowTimeToFinishModal(false)}
        onSelectTime={(minutes) => setTimeToFinishMinutes(minutes)}
        initialMinutes={timeToFinishMinutes}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
    overflow: "hidden",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.md,
  },
  selectedPresetIcon: {
    width: "100%",
    height: "100%",
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
    zIndex: 10,
  },
  unitSelectorContainer: {
    position: "relative",
    zIndex: 10,
  },
  unitSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  prefillUnitSection: {
    gap: Spacing.sm,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: Colors.light.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.accent,
  },
  unitPickerDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    minWidth: 100,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
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
    height: 90,
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
