import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { RecommendationCards } from "./RecommendationCards";
import { RecommendationResult } from "@/utils/recommendationEngine";
import { InfoCardResult } from "@/utils/infocardLogic";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface CollapsibleInfoCardsProps {
  recommendations?: RecommendationResult;
  infoCard?: InfoCardResult;
  scrollY: Animated.SharedValue<number>;
  collapseThreshold: number;
  onExpand: () => void;
  graphHeight: number;
  headerHeight: number;
  topInset: number;
}

export function CollapsibleInfoCards({
  recommendations,
  infoCard,
  scrollY,
  collapseThreshold,
  // onExpand, // onExpand is not used in this component
  graphHeight: _graphHeight, // prefixed with _ to avoid unused warning
  headerHeight: _headerHeight,
  topInset: _topInset,
}: CollapsibleInfoCardsProps) {
  const { theme: _theme } = useTheme();
  
  // Animate collapse based on scroll position
  const containerStyle = useAnimatedStyle(() => {
    const progress = Math.min(scrollY.value / collapseThreshold, 1);
    
    return {
      height: interpolate(
        progress,
        [0, 1],
        [120, 0], // Collapse from 120px to 0
        Extrapolation.CLAMP
      ),
      opacity: interpolate(
        progress,
        [0, 0.5, 1],
        [1, 0.5, 0],
        Extrapolation.CLAMP
      ),
      overflow: "hidden" as const,
    };
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.cardsContainer, containerStyle]}>
        <View style={styles.cardsWrapper}>
          <RecommendationCards 
            recommendations={recommendations}
            infoCard={infoCard}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// Separate expand button component to position outside scroll view
interface ExpandButtonProps {
  scrollY: Animated.SharedValue<number>;
  collapseThreshold: number;
  onExpand: () => void;
  graphHeight: number;
  headerHeight: number;
  topInset: number;
}

export function ExpandButton({
  scrollY,
  collapseThreshold,
  onExpand,
  graphHeight,
  headerHeight,
  topInset,
}: ExpandButtonProps) {
  const { theme } = useTheme();
  
  // Position at bottom right of graph area (just below graph)
  const expandButtonTop = headerHeight + graphHeight + topInset - 18; // Center of button at graph bottom

  const expandButtonStyle = useAnimatedStyle(() => {
    const progress = Math.min(scrollY.value / collapseThreshold, 1);
    
    return {
      opacity: interpolate(
        progress,
        [0.3, 1],
        [0, 1],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateX: interpolate(
            progress,
            [0.3, 1],
            [20, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <Animated.View 
      style={[
        {
          position: "absolute" as const,
          top: expandButtonTop,
          right: Spacing.lg,
          zIndex: 100,
        },
        expandButtonStyle
      ]} 
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onExpand}
        style={({ pressed }) => [
          styles.expandButton,
          {
            backgroundColor: theme.backgroundSecondary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Feather name="chevron-down" size={20} color={theme.text} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  cardsContainer: {
    overflow: "hidden",
  },
  cardsWrapper: {
    paddingHorizontal: Spacing.lg,
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

