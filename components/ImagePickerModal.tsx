import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;
const IMAGE_SIZE = (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2;

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (imageUri: string) => void;
}

const PRESET_IMAGES = [
  { id: "latte", name: "Latte", icon: "coffee" },
  { id: "cappuccino", name: "Cappuccino", icon: "coffee" },
  { id: "espresso", name: "Espresso", icon: "coffee" },
  { id: "mocha", name: "Mocha", icon: "coffee" },
  { id: "americano", name: "Americano", icon: "coffee" },
  { id: "macchiato", name: "Macchiato", icon: "coffee" },
  { id: "french-press", name: "French Press", icon: "coffee" },
  { id: "matcha", name: "Matcha", icon: "coffee" },
  { id: "chocolate", name: "Hot Chocolate", icon: "coffee" },
  { id: "tea", name: "Tea", icon: "coffee" },
];

const PRESET_COLORS = [
  "#8B4513",
  "#D2691E",
  "#A0522D",
  "#CD853F",
  "#DEB887",
  "#F4A460",
  "#D2B48C",
  "#BC8F8F",
  "#8FBC8F",
  "#556B2F",
];

export function ImagePickerModal({ visible, onClose, onSelectImage }: ImagePickerModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(MODAL_HEIGHT);
  const startY = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateY.value = MODAL_HEIGHT;
      setTimeout(() => {
        translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
      }, 50);
    } else {
      translateY.value = MODAL_HEIGHT;
    }
  }, [visible, translateY]);

  const closeModal = () => {
    translateY.value = withTiming(MODAL_HEIGHT, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextY = Math.max(0, startY.value + event.translationY);
      translateY.value = nextY;
    })
    .onEnd((event) => {
      const shouldClose = translateY.value > MODAL_HEIGHT * 0.35 || event.velocityY > 800;
      if (shouldClose) {
        translateY.value = withTiming(MODAL_HEIGHT, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleUploadCustom = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library to upload custom images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onSelectImage(result.assets[0].uri);
        closeModal();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleSelectPreset = (presetId: string) => {
    onSelectImage(`preset:${presetId}`);
    closeModal();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeModal} />

        <GestureDetector gesture={panGesture}>
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

            <ThemedText type="h3" style={styles.title}>Select Image</ThemedText>

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gridContainer}
            >
              <Pressable
                onPress={handleUploadCustom}
                style={[styles.imageCard, styles.uploadCard, { backgroundColor: theme.backgroundSecondary }]}
              >
                <Feather name="upload" size={32} color={theme.textMuted} />
                <ThemedText type="small" muted style={styles.uploadText}>Upload custom</ThemedText>
              </Pressable>

              {PRESET_IMAGES.map((preset, index) => (
                <Pressable
                  key={preset.id}
                  onPress={() => handleSelectPreset(preset.id)}
                  style={[styles.imageCard, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <View style={[styles.presetImagePlaceholder, { backgroundColor: PRESET_COLORS[index % PRESET_COLORS.length] + "30" }]}>
                    <Feather name="coffee" size={48} color={PRESET_COLORS[index % PRESET_COLORS.length]} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    maxHeight: MODAL_HEIGHT,
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
  title: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  imageCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  uploadCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  uploadText: {
    textAlign: "center",
  },
  presetImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
