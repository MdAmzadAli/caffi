import React from "react";
import { StyleSheet, Text, View } from "react-native";
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
    const isSticky = scrollY.value >= collapseThreshold;
    
    return {
      opacity: isSticky
        ? withTiming(1, { duration: 150 })
        : withTiming(0, { duration: 150 }),
      pointerEvents: isSticky ? "auto" : "none",
    } as any;
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { top: stickyOffset, backgroundColor: theme.bg },
        stickyStyle,
      ]}
      onLayout={(event) => onHeight?.(event.nativeEvent.layout.height)}
    >
      <Text style={[styles.title, { color: theme.darkBrown }]}>
        My consumption
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Spacing.xs,
    paddingBottom: 0,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
});
