import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RecommendationResult } from "@/utils/recommendationEngine";

interface RecommendationCardsProps {
  recommendations: RecommendationResult;
}

interface CardData {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  value: string;
  subtitle: string;
  accentColor: string;
  reasoning: string;
}

export function RecommendationCards({
  recommendations,
}: RecommendationCardsProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);

  const cards: CardData[] = [
    {
      id: "focus",
      icon: "target",
      title: "Focus Dose",
      value:
        recommendations.noSafeDose || recommendations.focusDoseMg === 0
          ? "None"
          : `${recommendations.focusDoseMg} mg`,
      subtitle: recommendations.noSafeDose
        ? "Limit reached"
        : "Small boost for concentration",
      accentColor: Colors.light.accentGold,
      reasoning: recommendations.focusDoseReasoning,
    },
    {
      id: "bestTime",
      icon: "clock",
      title: "Best Time",
      value:
        recommendations.noSafeDose
          ? "N/A"
          : `${recommendations.bestWindowStart} – ${recommendations.bestWindowEnd}`,
      subtitle: "Your ideal caffeine window",
      accentColor: Colors.light.blue,
      reasoning: recommendations.bestTimeReasoning,
    },
    {
      id: "cutoff",
      icon: "alert-circle",
      title: "Cutoff Time",
      value: `After ${recommendations.cutoffTime}`,
      subtitle: "Avoid for best sleep",
      accentColor: Colors.light.green,
      reasoning: recommendations.cutoffReasoning,
    },
  ];

  const handleCardPress = (card: CardData) => {
    setSelectedCard(card);
    setModalVisible(true);
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {cards.map((card) => (
          <Pressable
            key={card.id}
            style={({ pressed }) => [
              styles.card,
              { borderLeftColor: card.accentColor },
              pressed && styles.cardPressed,
            ]}
            onPress={() => handleCardPress(card)}
            accessibilityLabel={`${card.title}: ${card.value}. ${card.subtitle}`}
            accessibilityRole="button"
          >
            <View style={styles.cardHeader}>
              <Feather name={card.icon} size={16} color={card.accentColor} />
              <Text style={styles.cardTitle}>{card.title}</Text>
            </View>
            <Text style={styles.cardValue} numberOfLines={1}>
              {card.value}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {card.subtitle}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {selectedCard && (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalIconContainer,
                      { backgroundColor: selectedCard.accentColor + "20" },
                    ]}
                  >
                    <Feather
                      name={selectedCard.icon}
                      size={24}
                      color={selectedCard.accentColor}
                    />
                  </View>
                  <Text style={styles.modalTitle}>{selectedCard.title}</Text>
                </View>
                <Text style={styles.modalValue}>{selectedCard.value}</Text>
                <Text style={styles.modalReasoning}>{selectedCard.reasoning}</Text>
                <Pressable
                  style={styles.reminderButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Feather name="bell" size={16} color="white" />
                  <Text style={styles.reminderButtonText}>Schedule reminder</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: -Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    minWidth: 140,
    maxWidth: 160,
    borderLeftWidth: 4,
    ...Shadows.small,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: 11,
    color: Colors.light.mutedGrey,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.darkBrown,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Colors.light.mutedGrey,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 320,
    ...Shadows.large,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.darkBrown,
  },
  modalValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.darkBrown,
    marginBottom: Spacing.sm,
  },
  modalReasoning: {
    fontSize: 14,
    color: Colors.light.mutedGrey,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  reminderButton: {
    backgroundColor: Colors.light.accentGold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  reminderButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
