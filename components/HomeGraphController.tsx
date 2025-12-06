import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, Text, ScrollView, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { CaffeineGraphNew } from "./CaffeineGraphNew";
import { CaffeineEvent, parseBedtimeToMs } from "@/utils/graphUtils";

interface HomeGraphControllerProps {
  events: CaffeineEvent[];
  bedtime: string;
  halfLifeHours?: number;
  sleepThresholdMg?: number;
  isDark?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const LIGHT_COLORS = {
  bg: "#FFFFFF",
  darkBrown: "#5C4A3B",
};

const DARK_COLORS = {
  bg: "#2A2420",
  darkBrown: "#F5EBDD",
};

const HOURS_VISIBLE = 11;
const TOTAL_WINDOW_HOURS = 168;

export function HomeGraphController({
  events,
  bedtime,
  halfLifeHours = 5.5,
  sleepThresholdMg = 100,
  isDark = false,
}: HomeGraphControllerProps) {
  const [isOffCenter, setIsOffCenter] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const buttonScale = useSharedValue(1);

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const now = useMemo(() => new Date().toISOString(), []);

  const handleScrollOffsetChange = useCallback((offCenter: boolean, direction: 'left' | 'right' | null) => {
    setIsOffCenter(offCenter);
    setScrollDirection(direction);
  }, []);

  const handleJumpToNow = useCallback(() => {
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );

    if (scrollViewRef.current) {
      const nowMs = Date.now();
      const viewWindowHours = TOTAL_WINDOW_HOURS;
      const centerMs = nowMs;
      const halfWindowMs = (viewWindowHours / 2) * 3600000;
      const startMs = centerMs - halfWindowMs;
      const endMs = centerMs + halfWindowMs;
      const scrollContentWidth = SCREEN_WIDTH * (viewWindowHours / HOURS_VISIBLE);

      const nowPosition = ((nowMs - startMs) / (endMs - startMs)) * scrollContentWidth;
      const scrollX = Math.max(0, nowPosition - SCREEN_WIDTH / 2);

      scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
    }
    setIsOffCenter(false);
  }, [buttonScale]);

  const jumpButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      <CaffeineGraphNew
        events={events}
        now={now}
        bedtime={bedtime}
        halfLifeHours={halfLifeHours}
        sleepThresholdMg={sleepThresholdMg}
        viewWindowHours={TOTAL_WINDOW_HOURS}
        onScrollOffsetChange={handleScrollOffsetChange}
        scrollViewRef={scrollViewRef}
        isDark={isDark}
      />

      {isOffCenter && scrollDirection === 'right' && (
        <Animated.View style={[styles.arrowButtonRight, jumpButtonStyle]}>
          <Pressable 
            style={[
              styles.arrowButton, 
              { 
                backgroundColor: colors.bg,
                shadowColor: "#000",
              }
            ]} 
            onPress={handleJumpToNow}
          >
            <Feather name="chevron-right" size={18} color={colors.darkBrown} />
          </Pressable>
        </Animated.View>
      )}

      {isOffCenter && scrollDirection === 'left' && (
        <Animated.View style={[styles.arrowButtonLeft, jumpButtonStyle]}>
          <Pressable 
            style={[
              styles.arrowButton, 
              { 
                backgroundColor: colors.bg,
                shadowColor: "#000",
              }
            ]} 
            onPress={handleJumpToNow}
          >
            <Feather name="chevron-left" size={18} color={colors.darkBrown} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  arrowButtonRight: {
    position: "absolute",
    right: 8,
    top: "50%",
    marginTop: -16,
    zIndex: 100,
  },
  arrowButtonLeft: {
    position: "absolute",
    left: 8,
    top: "50%",
    marginTop: -16,
    zIndex: 100,
  },
  arrowButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default HomeGraphController;
