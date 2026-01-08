import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  useWindowDimensions,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ImagePickerModal, PRESET_IMAGES } from "@/components/ImagePickerModal";
import { TimePickerModal } from "@/components/TimePickerModal";
import { GlowIndicator } from "@/components/GlowIndicator";
import { useCaffeineStore, DrinkEntry, DRINK_DATABASE } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { useFormattedTime } from "@/hooks/useFormattedTime";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { BottomSheetModal } from "@/components/BottomSheetModal";
import {
  CaffeineEvent,
  getPeakCaffeineWithNewEntry,
  getMaxCaffeineInSleepWindow,
  getCaffeineLimitStatus,
  getSleepImpactStatus,
  parseBedtimeToMs,
} from "@/utils/graphUtils";

interface CustomDrinkModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd?: () => void;
  editEntry?: DrinkEntry | null;
  prefillDrink?: { id?: string; name: string; caffeinePer100ml: number; defaultServingMl: number; category?: string; sizes?: { name: string; ml: number }[] } | null;
  editCustomDrink?: { id: string; name: string; caffeinePer100ml: number; defaultServingMl: number; category?: string; sizes?: { name: string; ml: number }[] } | null;
  onSaveCustomDrink?: (drink?: any) => void;
  isLoggingMode?: boolean;
  initialQuantityAfterEdit?: number;
  preserveCustomDrinkQuantities?: Record<string, number>;
}

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

const getUnitForDrink = (name: string, category?: string, sizes?: { name: string; ml: number }[]): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("espresso") || lowerName.includes("shot")) return "shot";
  if (lowerName.includes("can") || category === "energy" || category === "soda") return "can";
  if (lowerName.includes("bottle")) return "bottle";
  if (sizes?.[0]?.name) return sizes[0].name;
  if (category === "tea" || category === "coffee") return "cup";
  if( category === "chocolate") return "bar";
  return "cup";
};

const getInbuiltDrinkCaffeinePer100ml = (id: string, category: string): number | null => {
  const drink = DRINK_DATABASE.find(d => d.id === id && d.category === category);
  return drink ? drink.caffeinePer100ml : null;
};

const formatDateWithTime = (date: Date): string => {
  const now = new Date();
  const entryDate = new Date(date);
  entryDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const timePart = new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  
  if (entryDate.getTime() === now.getTime()) {
    return `Today, ${timePart}`;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (entryDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${timePart}`;
  }
  
  const datePart = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${datePart}, ${timePart}`;
};

const INBUILT_CATEGORIES = ["coffee", "tea", "energy", "soda", "chocolate"];

export function CustomDrinkModal({ visible, onClose, onAdd, editEntry, prefillDrink, editCustomDrink, onSaveCustomDrink, isLoggingMode, initialQuantityAfterEdit, preserveCustomDrinkQuantities }: CustomDrinkModalProps) {
  const { theme } = useTheme();
  const { formatTime } = useFormattedTime();
  const { formatDate } = useFormattedDate();
  const insets = useSafeAreaInsets();
  const { addEntry, updateEntry, addCustomDrink, updateCustomDrink, profile, entries, customDrinks } = useCaffeineStore();
  const { height: windowHeight } = useWindowDimensions();
  const HALF_LIFE_HOURS = 5;
  
  const isEditMode = !!editEntry;
  const isEditingCustomDrink = !!editCustomDrink;
  const isEditingInbuiltSource = isEditMode && editEntry && INBUILT_CATEGORIES.includes(editEntry.category);

  const [drinkName, setDrinkName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("cup");
  const [caffeineMg, setCaffeineMg] = useState("10");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [startTimeLabel, setStartTimeLabel] = useState("now");

  useEffect(() => {
    if (editEntry && visible) {
      setDrinkName(editEntry.name || "");
      setStartTime(new Date(editEntry.timestamp));
      setSelectedImage(editEntry.imageUri || null);
      
      if (isEditingInbuiltSource) {
        const drink = DRINK_DATABASE.find(d => d.id === editEntry.drinkId && d.category === editEntry.category);
        if (drink) {
          const unit = editEntry.unit || getUnitForDrink(drink.name, drink.category);
          const qty = unit === "ml" ? editEntry.servingSize : Math.round((editEntry.caffeineAmount / ((drink.caffeinePer100ml * drink.defaultServingMl) / 100)) * 10) / 10;
          setQuantity(Math.max(1, qty) || 1);
          setCaffeineMg(Math.round(drink.caffeinePer100ml * drink.defaultServingMl / 100).toString());
          setSelectedUnit(unit);
        }
      } else {
        const customDrink = customDrinks.find(d => d.id === editEntry.drinkId || d.name.toLowerCase() === editEntry.name.toLowerCase());
        if (customDrink || editEntry.category === "custom") {
          const qty = editEntry.servingSize;
          const perUnitMg = Math.round((editEntry.caffeineAmount / Math.max(1, qty)) * 10) / 10;
          setQuantity(Math.max(1, qty) || 1);
          setCaffeineMg(perUnitMg.toString());
          setSelectedUnit(editEntry.unit || "cup");
        } else {
          setQuantity(1);
          setCaffeineMg(editEntry.caffeineAmount?.toString() || "10");
          setSelectedUnit(editEntry.unit || "cup");
        }
      }
      const timeDiff = Math.abs(new Date().getTime() - new Date(editEntry.timestamp).getTime());
      setStartTimeLabel(timeDiff < 60000 ? "now" : formatDateWithTime(editEntry.timestamp));
    } else if (editCustomDrink && visible) {
      setDrinkName(editCustomDrink.name);
      setQuantity(preserveCustomDrinkQuantities?.[editCustomDrink.id] || 1);
      const bestUnit = getUnitForDrink(editCustomDrink.name, editCustomDrink.category, editCustomDrink.sizes);
      setSelectedUnit(bestUnit);
      setCaffeineMg(editCustomDrink.caffeinePer100ml.toString());
      setStartTime(new Date());
      setStartTimeLabel("now");
      const imgUri = (editCustomDrink as any).imageUri;
      if (imgUri) {
        setSelectedImage(imgUri);
      }
    } else if (prefillDrink && visible && !editEntry) {
      setDrinkName(prefillDrink.name);
      setQuantity(initialQuantityAfterEdit ?? 1);
      const bestUnit = getUnitForDrink(prefillDrink.name, prefillDrink.category, prefillDrink.sizes);
      setSelectedUnit(bestUnit);
      
      let caffeine = 0;
      if (prefillDrink.category === "custom") {
        caffeine = prefillDrink.caffeinePer100ml;
      } else {
        caffeine = (prefillDrink.caffeinePer100ml * prefillDrink.defaultServingMl) / 100;
      }
      
      setCaffeineMg(caffeine.toString());
      setStartTime(new Date());
      setStartTimeLabel("now");
      const imgUri = (prefillDrink as any).imageUri;
      if (imgUri) {
        setSelectedImage(imgUri);
      } else if (prefillDrink.category) {
        setSelectedImage(`category:${prefillDrink.category}`);
      }
    }
  }, [editEntry, prefillDrink, editCustomDrink, visible, initialQuantityAfterEdit]);

  const totalCaffeine = useMemo(() => {
    if (selectedUnit === "ml") {
      if (prefillDrink && prefillDrink.category !== "custom") {
        return (prefillDrink.caffeinePer100ml / 100) * quantity;
      } else if (isEditingInbuiltSource && editEntry) {
        const cpml = getInbuiltDrinkCaffeinePer100ml(editEntry.drinkId, editEntry.category);
        return cpml ? (cpml / 100) * quantity : 0;
      }
    }
    const mg = parseFloat(caffeineMg) || 0;
    return mg * quantity;
  }, [caffeineMg, quantity, selectedUnit, prefillDrink, isEditingInbuiltSource, editEntry]);

  const caffeineEvents: CaffeineEvent[] = useMemo(() => {
    const filteredEntries = isEditMode && editEntry 
      ? entries.filter((e) => e.id !== editEntry.id)
      : entries;
    return filteredEntries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      mg: entry.caffeineAmount,
      timestampISO: new Date(entry.timestamp).toISOString(),
    }));
  }, [entries, isEditMode, editEntry]);

  const caffeineLimitStatus = useMemo(() => {
    if (!totalCaffeine || totalCaffeine <= 0) return "safe" as const;
    const peakMg = getPeakCaffeineWithNewEntry(
      caffeineEvents,
      totalCaffeine,
      startTime.getTime(),
      HALF_LIFE_HOURS
    );
    return getCaffeineLimitStatus(peakMg, profile.optimalCaffeine);
  }, [caffeineEvents, totalCaffeine, startTime, profile.optimalCaffeine]);

  const sleepDateLabel = useMemo(() => {
    const [hours, minutes] = (profile.sleepTime || "23:00").split(":").map(Number);
    const sleepDate = new Date(startTime);
    sleepDate.setHours(hours, minutes, 0, 0);
    if (sleepDate.getTime() <= startTime.getTime()) {
      sleepDate.setDate(sleepDate.getDate() + 1);
    }
    
    const d = new Date(sleepDate);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.getTime() === today.getTime()) return "Today";
    if (d.getTime() === yesterday.getTime()) return "Yesterday";
    if (d.getTime() === tomorrow.getTime()) return "Tomorrow";

    return formatDate(sleepDate);
  }, [startTime, profile.sleepTime, formatDate]);

  const sleepImpactStatus = useMemo(() => {
    if (!totalCaffeine || totalCaffeine <= 0) return "safe" as const;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (startTime.getTime() < todayStart.getTime()) return "safe" as const;
    const sleepTimeMs = parseBedtimeToMs(profile.sleepTime || "23:00", startTime);
    const maxCaffeineInSleepWindow = getMaxCaffeineInSleepWindow(
      caffeineEvents,
      totalCaffeine,
      startTime.getTime(),
      sleepTimeMs,
      HALF_LIFE_HOURS
    );
    return getSleepImpactStatus(maxCaffeineInSleepWindow);
  }, [caffeineEvents, totalCaffeine, startTime, profile.sleepTime]);

  const resetState = () => {
    setDrinkName("");
    setQuantity(1);
    setSelectedUnit("cup");
    setCaffeineMg("10");
    setSelectedImage(null);
    setStartTime(new Date());
    setStartTimeLabel("now");
  };

  const handleAdd = () => {
    if (drinkName.trim() && totalCaffeine > 0) {
      if (isEditMode && editEntry) {
        const updates: any = {
          name: drinkName.trim(),
          caffeineAmount: totalCaffeine,
          timestamp: startTime,
          imageUri: selectedImage || undefined,
          unit: selectedUnit,
        };
        if (editEntry.category === "custom") {
          updates.servingSize = quantity;
        } else if (isEditingInbuiltSource) {
          const drink = DRINK_DATABASE.find(d => d.id === editEntry.drinkId && d.category === editEntry.category);
          if (drink) {
            updates.servingSize = selectedUnit === "ml" ? quantity : drink.defaultServingMl * quantity;
          }
        }
        updateEntry(editEntry.id, updates);
        onClose();
        resetState();
        onAdd?.();
      } else if (isEditingCustomDrink && editCustomDrink) {
        updateCustomDrink(editCustomDrink.id, {
          name: drinkName.trim(),
          caffeinePer100ml: parseFloat(caffeineMg) || 0,
          sizes: [{ name: selectedUnit, ml: 100 }],
          imageUri: selectedImage || undefined,
        });
        onSaveCustomDrink?.({
          ...editCustomDrink,
          name: drinkName.trim(),
          caffeinePer100ml: parseFloat(caffeineMg) || 0,
          sizes: [{ name: selectedUnit, ml: 100 }],
          imageUri: selectedImage || undefined,
          quantity,
        });
      } else if (prefillDrink?.id) {
        const isCustom = prefillDrink.category === "custom";
        const servingSize = isCustom ? quantity : (selectedUnit === "ml" ? quantity : prefillDrink.defaultServingMl * quantity);
        const drinkToLog = { ...prefillDrink, name: drinkName.trim() };
        const finalImage = selectedImage || (prefillDrink.category ? `category:${prefillDrink.category}` : undefined);
        addEntry(drinkToLog as any, servingSize, undefined, false, startTime, selectedUnit, finalImage);
        onClose();
        resetState();
        onAdd?.();
      } else {
        const savedDrink = addCustomDrink({
          name: drinkName.trim(),
          category: "custom" as const,
          caffeinePer100ml: (parseFloat(caffeineMg) || 0),
          defaultServingMl: quantity,
          icon: "coffee",
          sizes: [{ name: selectedUnit, ml: 1 }],
          imageUri: selectedImage || undefined,
        }, quantity);
        addEntry(savedDrink, quantity, undefined, false, startTime, selectedUnit);
        onSaveCustomDrink?.(savedDrink && { ...savedDrink, quantity });
        onClose();
        resetState();
        onAdd?.();
      }
    }
  };

  const startTimeLabelDisplay = useMemo(() => {
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - startTime.getTime());
    if (timeDiff < 60000) return "now";
    
    const d = new Date(startTime);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const timeStr = formatTime(startTime);
    if (d.getTime() === today.getTime()) return `Today, ${timeStr}`;
    if (d.getTime() === yesterday.getTime()) return `Yesterday, ${timeStr}`;
    
    return `${formatDate(startTime)}, ${timeStr}`;
  }, [startTime, formatDate, formatTime]);

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={styles.scrollContent}>
        <View style={styles.topSection}>
          <Pressable 
            onPress={() => !isLoggingMode && setShowImagePicker(true)}
            disabled={isLoggingMode}
            style={[styles.chooseIconBox, { backgroundColor: theme.backgroundSecondary }]}
          >
            {selectedImage ? (
              selectedImage.startsWith("category:") ? (
                <Image 
                  source={getCategoryImageSource(selectedImage.replace("category:", ""))} 
                  style={styles.selectedImage} 
                  resizeMode="cover" 
                />
              ) : selectedImage.startsWith("preset:") ? (
                (() => {
                  const preset = PRESET_IMAGES.find(p => p.id === selectedImage.replace("preset:", ""));
                  return preset ? (
                    <Image source={preset.image} style={styles.selectedImage} resizeMode="cover" />
                  ) : (
                    <Feather name="coffee" size={32} color={Colors.light.accent} />
                  );
                })()
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
              You are {(prefillDrink?.category === "chocolate" || editEntry?.category === "chocolate") ? "eating" : "drinking"} {quantity} {selectedUnit} of
            </ThemedText>
            <TextInput
              style={[styles.nameInput, { color: !isLoggingMode ? theme.text : theme.textMuted, borderBottomColor: theme.divider }]}
              placeholder="Enter name"
              placeholderTextColor={theme.textMuted}
              value={drinkName}
              onChangeText={setDrinkName}
              editable={!isLoggingMode}
            />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

        <View style={styles.quantityRow}>
          <ThemedText type="h1" style={styles.quantityNumber}>{quantity}</ThemedText>
          <View style={styles.quantityButtons}>
            <Pressable
              onPress={() => setQuantity(q => q + 1)}
              style={[styles.quantityBtn, { borderColor: theme.textMuted }]}
            >
              <Feather name="plus" size={20} color={theme.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => setQuantity(q => Math.max(q - 1, 1))}
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
              <View style={[styles.radioCircle, (selectedUnit !== "ml" || prefillDrink.category === "custom") && styles.radioCircleActive]}>
                {(selectedUnit !== "ml" || prefillDrink.category === "custom") && <View style={styles.radioInner} />}
              </View>
              <ThemedText type="body" style={{ flex: 1 }}>
                {getUnitForDrink(prefillDrink.name, prefillDrink.category, prefillDrink.sizes)}
              </ThemedText>
              <View style={styles.caffeineInputWrapper}>
                <ThemedText type="body" style={{ color: theme.text }}>
                  {Math.round((parseFloat(caffeineMg) || 0) * quantity)}
                </ThemedText>
                <ThemedText type="body" muted> mg</ThemedText>
              </View>
            </Pressable>
            {prefillDrink.category !== "custom" && prefillDrink.category !== "chocolate" && (
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
                    {Math.round(totalCaffeine)}
                  </ThemedText>
                  <ThemedText type="body" muted> mg</ThemedText>
                </View>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.unitAndCaffeineRow}>
            <Pressable 
              onPress={() => setShowUnitPicker(true)}
              style={[styles.unitSelector, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText type="body">{selectedUnit}</ThemedText>
              <Feather name="chevron-down" size={16} color={theme.textMuted} />
            </Pressable>

            <View style={styles.mgInputWrapper}>
              <TextInput
                style={[styles.mgInput, { color: theme.text }]}
                value={caffeineMg}
                onChangeText={setCaffeineMg}
                keyboardType="numeric"
              />
              <ThemedText type="body" muted>mg / {selectedUnit}</ThemedText>
            </View>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

        <View style={styles.timeSection}>
          <Pressable 
            onPress={() => setShowStartTimePicker(true)}
            style={styles.timeSelector}
          >
            <Feather name="clock" size={18} color={theme.textMuted} />
            <ThemedText type="body" style={styles.timeLabel}>Started at {startTimeLabelDisplay}</ThemedText>
            <Feather name="chevron-right" size={18} color={theme.textMuted} />
          </Pressable>
        </View>

        <View style={styles.indicatorsGrid}>
          <View style={[styles.indicatorCard, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.indicatorHeader}>
              <ThemedText type="small" muted>CAFFEINE LIMIT</ThemedText>
              <GlowIndicator status={caffeineLimitStatus} icon="coffee" label="Limit" />
            </View>
            <ThemedText type="body" style={styles.indicatorValue}>
              {Math.round(totalCaffeine)} mg
            </ThemedText>
          </View>

          <View style={[styles.indicatorCard, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.indicatorHeader}>
              <ThemedText type="small" muted>SLEEP IMPACT</ThemedText>
              <GlowIndicator status={sleepImpactStatus} icon="moon" label="Sleep" />
            </View>
            <ThemedText type="body" style={styles.indicatorValue}>
              {sleepDateLabel}
            </ThemedText>
          </View>
        </View>

        <Pressable
          onPress={handleAdd}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: Colors.light.accent, opacity: pressed ? 0.9 : 1 }
          ]}
        >
          <ThemedText style={styles.addButtonText}>
            {isEditMode ? "Save Changes" : (isEditingCustomDrink ? "Save Drink" : "Log Drink")}
          </ThemedText>
        </Pressable>
      </View>

      <TimePickerModal
        visible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        onSelectTime={(date, label) => {
          setStartTime(date);
          setStartTimeLabel(label);
          setShowStartTimePicker(false);
        }}
        initialDate={startTime}
      />

      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={(uri) => {
          setSelectedImage(uri);
          setShowImagePicker(false);
        }}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: Spacing.md,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  chooseIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  nameInputSection: {
    flex: 1,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "600",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  divider: {
    height: 1,
    width: "100%",
    opacity: 0.5,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xl,
  },
  quantityNumber: {
    fontSize: 48,
    fontWeight: "700",
  },
  quantityButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  quantityBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  prefillUnitSection: {
    paddingVertical: Spacing.md,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.3,
  },
  radioCircleActive: {
    opacity: 1,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.accent,
  },
  caffeineInputWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  unitAndCaffeineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
  },
  unitSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  mgInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  mgInput: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "right",
    minWidth: 50,
  },
  timeSection: {
    paddingVertical: Spacing.lg,
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timeLabel: {
    flex: 1,
  },
  indicatorsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  indicatorCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  indicatorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  indicatorValue: {
    fontWeight: "700",
    marginTop: 2,
  },
  addButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
