import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  FadeOut,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { DrinkEntry } from "@/store/caffeineStore";

interface DrinkTimelineItemProps {
  entry: DrinkEntry;
  onDelete: () => void;
  showDate?: boolean;
}

const DELETE_THRESHOLD = -80;

export function DrinkTimelineItem({
  entry,
  onDelete,
  showDate = false,
}: DrinkTimelineItemProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const [showDelete, setShowDelete] = useState(false);

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

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, DELETE_THRESHOLD);
      }
    })
    .onEnd((event) => {
      if (event.translationX < DELETE_THRESHOLD / 2) {
        translateX.value = withSpring(DELETE_THRESHOLD);
        runOnJS(setShowDelete)(true);
      } else {
        translateX.value = withSpring(0);
        runOnJS(setShowDelete)(false);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -20 ? 1 : 0,
  }));

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

  const resetSwipe = () => {
    translateX.value = withSpring(0);
    setShowDelete(false);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.deleteContainer, deleteButtonStyle]}>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Feather name="trash-2" size={20} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <View
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
              onPress={handleDelete}
              style={styles.deleteIconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="trash-2" size={16} color={theme.textMuted} />
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
    overflow: "hidden",
    borderRadius: BorderRadius.sm,
  },
  deleteContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: Colors.light.danger,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  deleteButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
