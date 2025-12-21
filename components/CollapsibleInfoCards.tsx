import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { RecommendationCards } from "./RecommendationCards";
import { RecommendationResult } from "@/utils/recommendationEngine";
import { InfoCardResult } from "@/utils/infocardLogic";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface CollapsibleInfoCardsProps {
  recommendations?: RecommendationResult;
  infoCard?: InfoCardResult;
  scrollY: Animated.SharedValue<number>;
  collapseThreshold: number;
  onExpand: () => void;
  graphHeight: number;
  headerHeight: number;
  topInset: number;
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
}

export function CollapsibleInfoCards({
  recommendations,
  infoCard,
  scrollY,
  collapseThreshold,
  onExpand,
  graphHeight,
  headerHeight,
  topInset,
  isExpanded = false,
  onToggleExpanded,
}: CollapsibleInfoCardsProps) {
  const { theme } = useTheme();
  const COLLAPSE_THRESHOLD = collapseThreshold;

  // Show full cards when NOT collapsed
  const inlineStyle = useAnimatedStyle(() => {
    const progress = Math.min(scrollY.value / COLLAPSE_THRESHOLD, 1);
    return {
      height: interpolate(
        progress,
        [0, 1],
        [120, 0],
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

  // Dropdown visibility based on scroll + expanded state
  const dropdownStyle = useAnimatedStyle(() => {
    const progress = Math.min(scrollY.value / COLLAPSE_THRESHOLD, 1);
    return {
      opacity: isExpanded && progress > 0.8 ? 1 : 0,
      pointerEvents: (isExpanded && progress > 0.8) ? "auto" : "none" as any,
    };
  });

  return (
    <View style={styles.wrapper}>
      {/* Full cards - shown when NOT scrolled */}
      <Animated.View style={[styles.cardsContainer, inlineStyle]}>
        <View style={styles.cardsWrapper}>
          <RecommendationCards 
            recommendations={recommendations}
            infoCard={infoCard}
          />
        </View>
      </Animated.View>

      {/* Expandable dropdown - shown when scrolled and expanded */}
      <Animated.View style={[styles.cardsDropdown, { backgroundColor: theme.backgroundRoot }, dropdownStyle]}>
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
  isCardExpanded?: boolean;
  onCardToggle?: (expanded: boolean) => void;
}

export function ExpandButton({
  scrollY,
  collapseThreshold,
  onExpand,
  graphHeight,
  headerHeight,
  topInset,
  isCardExpanded = false,
  onCardToggle,
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

  const handlePress = () => {
    if (onCardToggle) {
      onCardToggle(!isCardExpanded);
    } else {
      onExpand();
    }
  };

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
        onPress={handlePress}
        style={({ pressed }) => [
          styles.expandButton,
          {
            backgroundColor: theme.backgroundSecondary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Feather 
          name={isCardExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={theme.text} 
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: Spacing.xl,
  },
  cardsContainer: {
    overflow: "hidden",
  },
  cardsWrapper: {
    paddingHorizontal: Spacing.lg,
  },
  cardsDropdown: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.lg,
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

