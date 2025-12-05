import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { DrinkEntry } from "@/store/caffeineStore";

interface DrinkTimelineItemProps {
  entry: DrinkEntry;
  onDelete: () => void;
  onEdit?: () => void;
  showDate?: boolean;
}

export function DrinkTimelineItem({
  entry,
  onDelete,
  onEdit,
  showDate = false,
}: DrinkTimelineItemProps) {
  const { theme } = useTheme();

  const formatTime = () => {
    const date = new Date(entry.timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Drink",
      `Remove ${entry.name} from your log?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ],
    );
  };

  const getCategoryIcon = (): keyof typeof Feather.glyphMap => {
    switch (entry.category) {
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
    <View style={styles.container}>
      <Pressable
        onPress={onEdit}
        style={[
          styles.itemContainer,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        <View style={styles.timeColumn}>
          <ThemedText type="small" muted>
            {formatTime()}
          </ThemedText>
        </View>
        <View style={styles.iconContainer}>
          <Feather
            name={getCategoryIcon()}
            size={18}
            color={Colors.light.accent}
          />
        </View>
        <View style={styles.contentColumn}>
          <ThemedText type="body" style={styles.drinkName}>
            {entry.name}
          </ThemedText>
          <ThemedText type="caption" muted>
            {entry.servingSize}ml
          </ThemedText>
        </View>
        <View style={styles.caffeineColumn}>
          <ThemedText
            type="body"
            style={[styles.caffeineAmount, { color: Colors.light.accent }]}
          >
            {entry.caffeineAmount}
          </ThemedText>
          <ThemedText type="caption" muted>
            mg
          </ThemedText>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          style={styles.deleteIconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="trash-2" size={16} color={Colors.light.danger} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
    overflow: "hidden",
    borderRadius: BorderRadius.sm,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  timeColumn: {
    width: 60,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.light.accent}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  contentColumn: {
    flex: 1,
  },
  drinkName: {
    fontWeight: "500",
    marginBottom: 2,
  },
  caffeineColumn: {
    alignItems: "flex-end",
  },
  caffeineAmount: {
    fontWeight: "600",
  },
  deleteIconButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
