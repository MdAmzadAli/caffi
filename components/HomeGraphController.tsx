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

const GRAPH_COLORS = {
  bg: "#FAF8F3",
  darkBrown: "#5C4A3B",
  darkBrown2: "#6A513B",
  accentGold: "#C9A36A",
};

interface HomeGraphControllerProps {
  events: CaffeineEvent[];
  bedtime: string;
  halfLifeHours?: number;
  sleepThresholdMg?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function HomeGraphController({
  events,
  bedtime,
  halfLifeHours = 5.5,
  sleepThresholdMg = 100,
}: HomeGraphControllerProps) {
  const [isOffCenter, setIsOffCenter] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const buttonScale = useSharedValue(1);

  const now = useMemo(() => new Date().toISOString(), []);

  const handleScrollOffsetChange = useCallback((offCenter: boolean) => {
    setIsOffCenter(offCenter);
  }, []);

  const handleJumpToNow = useCallback(() => {
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );

    if (scrollViewRef.current) {
      const nowMs = Date.now();
      const viewWindowHours = 24;
      const centerMs = nowMs;
      const halfWindowMs = (viewWindowHours / 2) * 3600000;
      const startMs = centerMs - halfWindowMs;
      const endMs = centerMs + halfWindowMs;
      const scrollContentWidth = SCREEN_WIDTH * (viewWindowHours / 11);

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
        viewWindowHours={24}
        onScrollOffsetChange={handleScrollOffsetChange}
        scrollViewRef={scrollViewRef}
      />

      {isOffCenter && (
        <Animated.View style={[styles.jumpButtonContainer, jumpButtonStyle]}>
          <Pressable style={styles.jumpButton} onPress={handleJumpToNow}>
            <Feather name="chevrons-right" size={16} color={GRAPH_COLORS.darkBrown} />
            <Text style={styles.jumpButtonText}>Now</Text>
          </Pressable>
        </Animated.View>
      )}

      <View style={styles.edgeFadeLeft} pointerEvents="none" />
      <View style={styles.edgeFadeRight} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  jumpButtonContainer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    zIndex: 100,
  },
  jumpButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  jumpButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: GRAPH_COLORS.darkBrown,
  },
  edgeFadeLeft: {
    position: "absolute",
    left: 48,
    top: 0,
    bottom: 28,
    width: 20,
    backgroundColor: "transparent",
  },
  edgeFadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 28,
    width: 20,
    backgroundColor: "transparent",
  },
});

export default HomeGraphController;
