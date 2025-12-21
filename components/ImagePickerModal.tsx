import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
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
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (imageUri: string) => void;
}

export const PRESET_IMAGES = [
  { id: "latte", name: "Latte", image: require("@/assets/images/drinks/latte.jpg") },
  { id: "coffee-cup", name: "Coffee Cup", image: require("@/assets/images/drinks/coffee-cup.jpg") },
  { id: "cappuccino", name: "Cappuccino", image: require("@/assets/images/drinks/cappuccino.jpg") },
  { id: "takeaway", name: "Takeaway", image: require("@/assets/images/drinks/takeaway.jpg") },
  { id: "mocha", name: "Mocha", image: require("@/assets/images/drinks/mocha.jpg") },
  { id: "french-press", name: "French Press", image: require("@/assets/images/drinks/french-press.jpg") },
  { id: "chocolate", name: "Chocolate", image: require("@/assets/images/drinks/chocolate.jpg") },
  { id: "matcha", name: "Matcha", image: require("@/assets/images/drinks/matcha.jpg") },
];

export function ImagePickerModal({ visible, onClose, onSelectImage }: ImagePickerModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const MODAL_HEIGHT = windowHeight * 0.9;
  const IMAGE_SIZE = (windowWidth - Spacing.xl * 2 - Spacing.md) / 2;

  const translateY = useSharedValue(MODAL_HEIGHT);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = MODAL_HEIGHT;
      
        translateY.value = withSpring(0);
    } else {
      translateY.value = MODAL_HEIGHT;
    }
  }, [visible, translateY, MODAL_HEIGHT]);

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
      <GestureHandlerRootView style={{ flex: 1 }} >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeModal} />

        {/* <GestureDetector gesture={panGesture}> */}
          <Animated.View
            style={[
              styles.modalContent,
              sheetStyle,
              {
                backgroundColor: theme.backgroundRoot,
                paddingBottom: insets.bottom + Spacing.lg,
                maxHeight: MODAL_HEIGHT,
              },
            ]}
          >
            <GestureDetector gesture={panGesture}>
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: Colors.light.accent }]} />
              <ThemedText type="h3" style={styles.title}>Select Image</ThemedText>
            </View>
            </GestureDetector>
            

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gridContainer}
            >
              <Pressable
                onPress={handleUploadCustom}
                style={[
                  styles.imageCard,
                  { 
                    width: IMAGE_SIZE, 
                    height: IMAGE_SIZE,
                    backgroundColor: theme.backgroundSecondary,
                  }
                ]}
              >
                <Feather name="upload" size={32} color={theme.textMuted} />
                <ThemedText type="small" muted style={styles.uploadText}>Upload custom</ThemedText>
              </Pressable>

              {PRESET_IMAGES.map((preset) => (
                <Pressable
                  key={preset.id}
                  onPress={() => handleSelectPreset(preset.id)}
                  style={[
                    styles.imageCard,
                    { 
                      width: IMAGE_SIZE, 
                      height: IMAGE_SIZE,
                      backgroundColor: theme.backgroundSecondary,
                    }
                  ]}
                >
                  <Image 
                    source={preset.image} 
                    style={styles.presetImage}
                    resizeMode="contain"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        {/* </GestureDetector> */}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
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
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  presetImage: {
    width: "85%",
    height: "85%",
  },
});
