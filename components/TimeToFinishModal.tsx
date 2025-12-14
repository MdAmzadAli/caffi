import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const MODAL_HEIGHT = 220;
const SLIDER_WIDTH = 300;
const THUMB_SIZE = 32;
const MIN_MINUTES = 5;
const MAX_MINUTES = 60;

interface TimeToFinishModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (minutes: number) => void;
  initialMinutes?: number;
}

export function TimeToFinishModal({
  visible,
  onClose,
  onSelectTime,
  initialMinutes = 10,
}: TimeToFinishModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [minutes, setMinutes] = useState(initialMinutes);
  
  const translateY = useSharedValue(MODAL_HEIGHT);
  const sliderPosition = useSharedValue(
    ((initialMinutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES)) * SLIDER_WIDTH
  );
  const startX = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMinutes(initialMinutes);
      sliderPosition.value = ((initialMinutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES)) * SLIDER_WIDTH;
      translateY.value = MODAL_HEIGHT;
      setTimeout(() => {
        translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
      }, 50);
    } else {
      translateY.value = MODAL_HEIGHT;
    }
  }, [visible, initialMinutes, translateY, sliderPosition]);

  const closeModal = (saveValue: boolean = true) => {
    if (saveValue) {
      onSelectTime(minutes);
    }
    translateY.value = withTiming(MODAL_HEIGHT, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const updateMinutes = (value: number) => {
    setMinutes(value);
  };

  const sliderGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = sliderPosition.value;
    })
    .onUpdate((event) => {
      const newPosition = Math.max(0, Math.min(SLIDER_WIDTH, startX.value + event.translationX));
      sliderPosition.value = newPosition;
      
      const progress = newPosition / SLIDER_WIDTH;
      const newMinutes = Math.round(MIN_MINUTES + progress * (MAX_MINUTES - MIN_MINUTES));
      runOnJS(updateMinutes)(newMinutes);
    })
    .onEnd(() => {
      const progress = sliderPosition.value / SLIDER_WIDTH;
      const snappedMinutes = Math.round(MIN_MINUTES + progress * (MAX_MINUTES - MIN_MINUTES));
      const snappedPosition = ((snappedMinutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES)) * SLIDER_WIDTH;
      sliderPosition.value = withSpring(snappedPosition, { damping: 15, stiffness: 200 });
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderPosition.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: sliderPosition.value + THUMB_SIZE / 2,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={() => closeModal(true)}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={() => closeModal(true)} />

        <Animated.View
          style={[
            styles.modalContent,
            sheetStyle,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: Colors.light.accent }]} />
          </View>

          <View style={styles.content}>
            <ThemedText type="h2" style={styles.minutesText}>
              {minutes} minutes
            </ThemedText>

            <View style={styles.sliderContainer}>
              <View style={[styles.sliderTrack, { backgroundColor: theme.divider }]}>
                <Animated.View
                  style={[
                    styles.sliderProgress,
                    { backgroundColor: Colors.light.accent },
                    progressStyle,
                  ]}
                />
              </View>
              
              <GestureDetector gesture={sliderGesture}>
                <Animated.View
                  style={[
                    styles.sliderThumb,
                    {
                      borderColor: Colors.light.accent,
                      backgroundColor: theme.backgroundRoot,
                    },
                    thumbStyle,
                  ]}
                />
              </GestureDetector>
            </View>

            <View style={styles.labelsRow}>
              <ThemedText type="caption" muted>{MIN_MINUTES} min</ThemedText>
              <ThemedText type="caption" muted>{MAX_MINUTES} min</ThemedText>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  minutesText: {
    color: Colors.light.accent,
    marginBottom: Spacing.xl,
  },
  sliderContainer: {
    width: SLIDER_WIDTH + THUMB_SIZE,
    height: THUMB_SIZE + 20,
    justifyContent: "center",
    paddingHorizontal: THUMB_SIZE / 2,
  },
  sliderTrack: {
    position: "absolute",
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: 6,
    borderRadius: 3,
  },
  sliderProgress: {
    position: "absolute",
    left: 0,
    height: 6,
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: SLIDER_WIDTH + THUMB_SIZE,
    marginTop: Spacing.sm,
  },
});
