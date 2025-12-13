import React from "react";
import { StyleSheet, Text } from "react-native";
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

  const titleHeightValue = titleHeight ?? 28;
  const dateOffset = stickyOffset + titleHeightValue - Spacing.xs;

  const stickyStyle = useAnimatedStyle(() => {
    const progress = Math.min(scrollY.value / collapseThreshold, 1);
    const isSticky = scrollY.value >= collapseThreshold;
    
    return {
      opacity: isSticky && currentDate
        ? interpolate(progress, [0.8, 1], [0, 1], Extrapolation.CLAMP)
        : 0,
      pointerEvents: isSticky ? "auto" : "none",
    } as any;
  });

  if (!currentDate) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: dateOffset, backgroundColor: theme.bg },
        stickyStyle,
      ]}
    >
      <Text style={[styles.dateText, { color: theme.mutedGrey }]}>
        {currentDate}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9,
    paddingTop: 0,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
