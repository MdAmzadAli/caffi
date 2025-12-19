import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Text,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { CaffeineEvent } from "@/utils/graphUtils";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const DEFAULT_MODAL_HEIGHT = SCREEN_HEIGHT * 0.28;
const MODAL_WIDTH = 200;

const CATEGORY_IMAGES: Record<string, any> = {
  coffee: require("@/assets/CaffeineSourceImages/coffee.png"),
  tea: require("@/assets/CaffeineSourceImages/tea.jpg"),
  energy: require("@/assets/CaffeineSourceImages/energy.png"),
  soda: require("@/assets/CaffeineSourceImages/soda.png"),
  chocolate: require("@/assets/CaffeineSourceImages/chocolate.png"),
};

const resolveImageSource = (imageUri?: string): any => {
  if (!imageUri) return null;
  if (imageUri.startsWith("preset:")) {
    const { PRESET_IMAGES } = require("@/components/ImagePickerModal");
    const preset = PRESET_IMAGES.find((p: any) => p.id === imageUri.replace("preset:", ""));
    return preset?.image;
  }
  return { uri: imageUri };
};

interface StackedEntriesModalProps {
  visible: boolean;
  events: CaffeineEvent[];
  position: { x: number; y: number };
  onClose: () => void;
  onSelectEvent: (event: CaffeineEvent) => void;
}

function formatTime(timestampISO: string): string {
  const date = new Date(timestampISO);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function StackedEntriesModal({
  visible,
  events,
  position,
  onClose,
  onSelectEvent,
}: StackedEntriesModalProps) {
  const { theme } = useTheme();
  const [modalHeight, setModalHeight] = React.useState(0);

  const effectiveModalHeight = modalHeight || DEFAULT_MODAL_HEIGHT;

  const modalLeft = Math.min(
    Math.max(position.x + 10, 10),
    SCREEN_WIDTH - MODAL_WIDTH - 10
  );
  const xAxisLabelHeight = SCREEN_HEIGHT * 0.04;
  const modalTop = Math.min(
    Math.max(position.y - 40, 60),
    SCREEN_HEIGHT - effectiveModalHeight - xAxisLabelHeight
  );

  if (!visible || events.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: "transparent" }]} onPress={onClose} pointerEvents="box-none">
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.bg,
              left: modalLeft,
              top: modalTop,
              shadowColor: "#000",
              maxHeight: effectiveModalHeight,
              pointerEvents: "auto",
            },
          ]}
          onLayout={(e) => setModalHeight(e.nativeEvent.layout.height)}
        >
          <ScrollView
            style={[styles.scrollView, { maxHeight: effectiveModalHeight }]}
            showsVerticalScrollIndicator={false}
          >
            {events.map((event, index) => {
              const categoryImage = CATEGORY_IMAGES[event.category || "coffee"];
              const resolvedImage = resolveImageSource(event.imageUri) || categoryImage;

              return (
                <Pressable
                  key={event.id || index}
                  style={({ pressed }) => [
                    styles.entryRow,
                    { backgroundColor: pressed ? theme.backgroundTertiary : "transparent" },
                    index < events.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.mutedGrey + "30",
                    },
                  ]}
                  onPress={() => {
                    onSelectEvent(event);
                  }}
                >
                  <View style={[styles.imageContainer, { backgroundColor: theme.backgroundSecondary }]}>
                    {resolvedImage ? (
                      <Image source={resolvedImage} style={styles.entryImage} />
                    ) : (
                      <Text style={styles.emoji}>☕</Text>
                    )}
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.entryName, { color: theme.darkBrown }]} numberOfLines={1}>
                      {event.name}
                    </Text>
                    <View style={styles.timeAndMgRow}>
                      <Text style={[styles.entryTime, { color: theme.mutedGrey }]}>
                        {formatTime(event.timestampISO)}
                      </Text>
                      <Text style={[styles.entryMg, { color: theme.accentGold }]}>
                        {event.mg} mg
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modalContainer: {
    position: "absolute",
    width: MODAL_WIDTH,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SCREEN_HEIGHT * 0.003,
    paddingHorizontal: SCREEN_WIDTH * 0.01,
  },
  imageContainer: {
    width: SCREEN_WIDTH * 0.045,
    height: SCREEN_WIDTH * 0.045,
    borderRadius: SCREEN_WIDTH * 0.0225,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  entryImage: {
    width: SCREEN_WIDTH * 0.045,
    height: SCREEN_WIDTH * 0.045,
    borderRadius: SCREEN_WIDTH * 0.0225,
  },
  emoji: {
    fontSize: SCREEN_WIDTH * 0.022,
  },
  textContainer: {
    flex: 1,
    marginLeft: SCREEN_WIDTH * 0.02,
  },
  entryName: {
    fontSize: 10,
    fontWeight: "600",
  },
  timeAndMgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  entryTime: {
    fontSize: 8,
    flex: 1,
  },
  entryMg: {
    fontSize: 8,
    fontWeight: "600",
  },
});

export default StackedEntriesModal;
