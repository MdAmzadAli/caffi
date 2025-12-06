import React from "react";
import { View, StyleSheet, Text, Image, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Spacing, BorderRadius } from "@/constants/theme";
import { DrinkEntry } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";

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
  const { theme } = useTheme();

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
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="coffee" size={32} color={theme.mutedGrey} />
        <Text style={[styles.emptyText, { color: theme.mutedGrey }]}>No drinks logged today</Text>
        <Text style={[styles.emptySubtext, { color: theme.mutedGrey }]}>Tap + to add your first drink</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map((entry) => (
        <Pressable
          key={entry.id}
          style={({ pressed }) => [
            styles.entryRow, 
            { 
              backgroundColor: theme.backgroundSecondary,
              borderWidth: 1,
              borderColor: theme.divider,
            },
            pressed && { backgroundColor: theme.backgroundTertiary }
          ]}
          onPress={() => onEntryPress?.(entry)}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.backgroundTertiary }]}>
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
            <Text style={[styles.entryName, { color: theme.darkBrown }]}>
              {entry.name}, {entry.servingSize}ml
            </Text>
            <Text style={[styles.entryTime, { color: theme.mutedGrey }]}>{formatTime(entry.timestamp)}</Text>
          </View>

          <Text style={[styles.entryMg, { color: theme.darkBrown }]}>{entry.caffeineAmount} mg</Text>
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
    borderRadius: BorderRadius.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
  },
  entryMg: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 13,
  },
});
