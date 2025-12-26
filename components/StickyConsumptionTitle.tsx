import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
const STICKY_ENTER_OFFSET = 6;
const STICKY_EXIT_OFFSET = 10;
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

  // Derived sticky state with hysteresis
  const stickyVisible = useDerivedValue(() => {
    if (scrollY.value > collapseThreshold + STICKY_ENTER_OFFSET) {
      return 1;
    }
    if (scrollY.value < collapseThreshold - STICKY_EXIT_OFFSET) {
      return 0;
    }
    return undefined;
  });

  const animatedOpacity = useDerivedValue(() => {
    return withTiming(stickyVisible.value ?? 0, {
      duration: 180,
    });
  });

  const stickyStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedOpacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { top: stickyOffset, backgroundColor: theme.bg },
        stickyStyle,
      ]}
      onLayout={(event) => onHeight?.(event.nativeEvent.layout.height)}
      pointerEvents="none"
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
