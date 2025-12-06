import React from "react";
import { View, StyleSheet, Text, Image, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { DrinkEntry } from "@/store/caffeineStore";

interface ConsumptionListProps {
  entries: DrinkEntry[];
  onEntryPress?: (entry: DrinkEntry) => void;
  onDeleteEntry?: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  coffee: "☕",
  tea: "🍵",
  energy: "⚡",
  soda: "🥤",
  chocolate: "🍫",
  custom: "🧋",
};

const CATEGORY_IMAGES: Record<string, any> = {
  coffee: require("@/attached_assets/generated_images/caffi_app_icon_coffee_cup.png"),
};

export function ConsumptionList({
  entries,
  onEntryPress,
  onDeleteEntry,
}: ConsumptionListProps) {
  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEntryIcon = (category: string) => {
    return CATEGORY_ICONS[category] || "☕";
  };

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="coffee" size={32} color={Colors.light.mutedGrey} />
        <Text style={styles.emptyText}>No drinks logged today</Text>
        <Text style={styles.emptySubtext}>Tap + to add your first drink</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map((entry) => (
        <Pressable
          key={entry.id}
          style={({ pressed }) => [styles.entryRow, pressed && styles.entryPressed]}
          onPress={() => onEntryPress?.(entry)}
        >
          <View style={styles.iconContainer}>
            {CATEGORY_IMAGES[entry.category] ? (
              <Image
                source={CATEGORY_IMAGES[entry.category]}
                style={styles.entryImage}
              />
            ) : (
              <Text style={styles.entryEmoji}>{getEntryIcon(entry.category)}</Text>
            )}
          </View>

          <View style={styles.entryInfo}>
            <Text style={styles.entryName}>
              {entry.name}, {entry.servingSize}ml
            </Text>
            <Text style={styles.entryTime}>{formatTime(entry.timestamp)}</Text>
          </View>

          <Text style={styles.entryMg}>{entry.caffeineAmount} mg</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.sm,
  },
  entryPressed: {
    backgroundColor: Colors.light.backgroundTertiary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  entryImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  entryEmoji: {
    fontSize: 22,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.light.darkBrown,
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    color: Colors.light.mutedGrey,
  },
  entryMg: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.darkBrown,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.mutedGrey,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.light.mutedGrey,
  },
});
