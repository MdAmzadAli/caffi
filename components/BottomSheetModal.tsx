import React, { useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
}

export function BottomSheetModal({
  visible,
  onClose,
  children,
  maxHeight = SCREEN_HEIGHT * 0.8,
}: BottomSheetModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Use a fixed value for animation start to ensure consistency
  const initialTranslateY = maxHeight || 500;
  const translateY = useSharedValue(initialTranslateY);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { 
        damping: 30, 
        stiffness: 400,
        mass: 0.5,
      });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(initialTranslateY, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, initialTranslateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (translateY.value > initialTranslateY * 0.4 || event.velocityY > 1000) {
        translateY.value = withTiming(initialTranslateY, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
      } else {
        translateY.value = withSpring(0, {
          damping: 30,
          stiffness: 400,
          mass: 0.5,
        });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
          </Animated.View>
          <Animated.View 
            style={[
              styles.sheet, 
              { 
                backgroundColor: theme.backgroundRoot,
                paddingBottom: insets.bottom + Spacing.xl,
                height: maxHeight,
              }, 
              sheetStyle
            ]}
          >
            <GestureDetector gesture={panGesture}>
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: theme.divider }]} />
              </View>
            </GestureDetector>
            {children}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  handleContainer: {
    paddingVertical: Spacing.sm,
    width: "100%",
    alignItems: "center",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
  },
});
