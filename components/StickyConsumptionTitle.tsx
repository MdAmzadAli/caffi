import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface StickyConsumptionTitleProps {
  scrollY: Animated.SharedValue<number>;
  collapseThreshold: number;
  stickyOffset: number;
  onHeight?: (height: number) => void;
}

export function StickyConsumptionTitle({
  scrollY,
  collapseThreshold,
  stickyOffset,
  onHeight,
}: StickyConsumptionTitleProps) {
  const { theme } = useTheme();

  const stickyStyle = useAnimatedStyle(() => {
    const progress = Math.min(scrollY.value / collapseThreshold, 1);
    const isSticky = scrollY.value >= collapseThreshold;
    
    if (!isSticky) {
      return {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        opacity: 0,
        pointerEvents: "none" as const,
      };
    }

    return {
      position: "absolute" as const,
      top: stickyOffset,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: theme.bg,
      paddingTop: Spacing.xs,
      paddingBottom: 0,
      paddingHorizontal: Spacing.lg,
      opacity: interpolate(
        progress,
        [0.8, 1],
        [0, 1],
        Extrapolation.CLAMP
      ),
      pointerEvents: "auto" as const,
    };
  });

  return (
    <Animated.View
      style={stickyStyle}
      onLayout={(event) => onHeight?.(event.nativeEvent.layout.height)}
    >
      <Text style={[styles.title, { color: theme.darkBrown }]}>
        My consumption
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
});

