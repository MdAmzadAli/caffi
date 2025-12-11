import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface StickyDateHeaderProps {
  scrollY: Animated.SharedValue<number>;
  collapseThreshold: number;
  stickyOffset: number;
  currentDate: string;
  titleHeight?: number;
}

export function StickyDateHeader({
  scrollY,
  collapseThreshold,
  stickyOffset,
  currentDate,
  titleHeight,
}: StickyDateHeaderProps) {
  const { theme } = useTheme();

  const stickyStyle = useAnimatedStyle(() => {
    const progress = Math.min(scrollY.value / collapseThreshold, 1);
    const isSticky = scrollY.value >= collapseThreshold;
    
    if (!isSticky || !currentDate) {
      return {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        opacity: 0,
        pointerEvents: "none" as const,
      };
    }

    const titleHeightValue = titleHeight ?? 28; // measured height fallback
    const dateOffset = stickyOffset + titleHeightValue + Spacing.xs;

    return {
      position: "absolute" as const,
      top: dateOffset,
      left: Spacing.lg,
      right: Spacing.lg,
      zIndex: 9,
      backgroundColor: theme.bg,
      paddingTop: 0,
      paddingBottom: Spacing.sm,
      marginTop: 0,
      marginBottom: 0,
      opacity: interpolate(
        progress,
        [0.8, 1],
        [0, 1],
        Extrapolation.CLAMP
      ),
      pointerEvents: "auto" as const,
    };
  });

  if (!currentDate) return null;

  return (
    <Animated.View style={stickyStyle}>
      <Text style={[styles.dateText, { color: theme.mutedGrey }]}>
        {currentDate}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

