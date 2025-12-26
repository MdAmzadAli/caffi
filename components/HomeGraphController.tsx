import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { CaffeineGraphNew } from "./CaffeineGraphNew";
import { CaffeineEvent } from "@/utils/graphUtils";

interface HomeGraphControllerProps {
  events: CaffeineEvent[];
  bedtime: string;
  halfLifeHours?: number;
  sleepThresholdMg?: number;
  optimalCaffeineMg?: number;
  yMax?: number;
  isDark?: boolean;
  onHeight?: (height: number) => void;
  onEventClick?: (event: CaffeineEvent) => void;
  onStackedEventsClick?: (events: CaffeineEvent[], position: { x: number; y: number }) => void;
}

const LIGHT_COLORS = {
  bg: "#FFFFFF",
  darkBrown: "#5C4A3B",
};

const DARK_COLORS = {
  bg: "#2A2420",
  darkBrown: "#F5EBDD",
};

const INITIAL_START_DAY = -3;
const INITIAL_END_DAY = 1;
const DAYS_TO_EXTEND = 5;

export function HomeGraphController({
  events,
  bedtime,
  halfLifeHours = 5.5,
  sleepThresholdMg = 100,
  optimalCaffeineMg = 200,
  yMax = 300,
  isDark = false,
  onHeight,
  onEventClick,
  onStackedEventsClick,
}: HomeGraphControllerProps) {
  const [isOffCenter, setIsOffCenter] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
  const [dayWindowStart, setDayWindowStart] = useState(INITIAL_START_DAY);
  const [dayWindowEnd, setDayWindowEnd] = useState(INITIAL_END_DAY);
  const [resetKey, setResetKey] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const buttonScale = useSharedValue(1);

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const now = useMemo(() => new Date().toISOString(), [resetKey]);

  const handleScrollOffsetChange = useCallback((offCenter: boolean, direction: 'left' | 'right' | null) => {
    setIsOffCenter(offCenter);
    setScrollDirection(direction);
  }, []);

  const handleExtendDays = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      setDayWindowStart(prev => prev - DAYS_TO_EXTEND);
    } else {
      setDayWindowEnd(prev => prev + DAYS_TO_EXTEND);
    }
  }, []);

  const handleJumpToNow = useCallback(() => {
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );

    setDayWindowStart(INITIAL_START_DAY);
    setDayWindowEnd(INITIAL_END_DAY);
    setIsOffCenter(false);
    setScrollDirection(null);
    setResetKey(prev => prev + 1);
  }, [buttonScale]);

  const jumpButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View
      style={styles.container}
      onLayout={(e) => onHeight?.(e.nativeEvent.layout.height)}
    >
      <CaffeineGraphNew
        events={events}
        now={now}
        bedtime={bedtime}
        halfLifeHours={halfLifeHours}
        sleepThresholdMg={sleepThresholdMg}
        optimalCaffeineMg={optimalCaffeineMg}
        yMax={yMax}
        onScrollOffsetChange={handleScrollOffsetChange}
        scrollViewRef={scrollViewRef}
        isDark={isDark}
        dayWindowStart={dayWindowStart}
        dayWindowEnd={dayWindowEnd}
        onExtendDays={handleExtendDays}
        resetKey={resetKey}
        onEventClick={onEventClick}
        onStackedEventsClick={onStackedEventsClick}
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
