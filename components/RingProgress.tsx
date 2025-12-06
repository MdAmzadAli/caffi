import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  AccessibilityProps,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors, Shadows } from "@/constants/theme";

interface RingProgressProps {
  consumedTodayMg: number;
  optimalDailyMg: number;
  sizePx?: number;
  onPress?: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function RingProgress({
  consumedTodayMg,
  optimalDailyMg,
  sizePx = 72,
  onPress,
}: RingProgressProps) {
  const strokeWidth = 8;
  const radius = (sizePx - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const rawPercent = (consumedTodayMg / optimalDailyMg) * 100;
  const percent = Math.min(Math.max(rawPercent, 0), 150);
  const displayPercent = Math.round(rawPercent);
  const isOverLimit = rawPercent > 100;

  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(Math.min(percent, 100) / 100, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [percent]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const ringColor = isOverLimit ? Colors.light.red : Colors.light.accentGold;
  const accessibilityLabel = `Today: ${consumedTodayMg} milligrams of ${optimalDailyMg} milligrams (${displayPercent}%)`;

  const content = (
    <View
      style={[
        styles.container,
        { width: sizePx, height: sizePx },
        isOverLimit && styles.overLimitGlow,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.min(displayPercent, 100),
      }}
    >
      <Svg width={sizePx} height={sizePx}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop
              offset="0"
              stopColor={isOverLimit ? Colors.light.red : Colors.light.accentGold}
            />
            <Stop
              offset="1"
              stopColor={isOverLimit ? "#E85D4E" : Colors.light.green}
            />
          </LinearGradient>
        </Defs>

        <Circle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          stroke={Colors.light.divider}
          strokeWidth={strokeWidth}
          fill="white"
        />

        <AnimatedCircle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${sizePx / 2}, ${sizePx / 2}`}
        />
      </Svg>

      <View style={styles.centerContent}>
        <Text
          style={[styles.consumedText, isOverLimit && { color: Colors.light.red }]}
        >
          {consumedTodayMg}
        </Text>
        <Text style={styles.subtitleText}>
          {isOverLimit ? "Over limit" : `of ${optimalDailyMg}`}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pressable: {
    ...Shadows.small,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 100,
    ...Shadows.small,
  },
  overLimitGlow: {
    shadowColor: Colors.light.red,
    shadowOpacity: 0.3,
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  consumedText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.darkBrown,
  },
  subtitleText: {
    fontSize: 8,
    color: Colors.light.mutedGrey,
    marginTop: -2,
  },
});
