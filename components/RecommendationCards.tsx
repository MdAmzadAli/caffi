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
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RecommendationResult } from "@/utils/recommendationEngine";
import { useTheme } from "@/hooks/useTheme";

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
  const { theme, isDark } = useTheme();
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
      accentColor: theme.accentGold,
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
      accentColor: theme.blue,
      reasoning: recommendations.bestTimeReasoning,
    },
    {
      id: "cutoff",
      icon: "alert-circle",
      title: "Cutoff Time",
      value: `After ${recommendations.cutoffTime}`,
      subtitle: "Avoid for best sleep",
      accentColor: theme.green,
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
              { 
                borderLeftColor: card.accentColor,
                backgroundColor: theme.backgroundSecondary,
                shadowColor: "#000",
                shadowOpacity: isDark ? 0.3 : 0.08,
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? theme.divider : "transparent",
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => handleCardPress(card)}
            accessibilityLabel={`${card.title}: ${card.value}. ${card.subtitle}`}
            accessibilityRole="button"
          >
            <View style={styles.cardHeader}>
              <Feather name={card.icon} size={16} color={card.accentColor} />
              <Text style={[styles.cardTitle, { color: theme.mutedGrey }]}>{card.title}</Text>
            </View>
            <Text style={[styles.cardValue, { color: theme.darkBrown }]} numberOfLines={1}>
              {card.value}
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.mutedGrey }]} numberOfLines={1}>
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
          style={[styles.modalOverlay, { backgroundColor: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)" }]}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault, shadowColor: isDark ? "#000" : "#000" }]}>
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
                  <Text style={[styles.modalTitle, { color: theme.darkBrown }]}>{selectedCard.title}</Text>
                </View>
                <Text style={[styles.modalValue, { color: theme.darkBrown }]}>{selectedCard.value}</Text>
                <Text style={[styles.modalReasoning, { color: theme.mutedGrey }]}>{selectedCard.reasoning}</Text>
                <Pressable
                  style={[styles.reminderButton, { backgroundColor: theme.accentGold }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Feather name="bell" size={16} color={theme.bg} />
                  <Text style={[styles.reminderButtonText, { color: theme.bg }]}>Schedule reminder</Text>
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
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    minWidth: 140,
    maxWidth: 160,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 320,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
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
  },
  modalValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  modalReasoning: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  reminderButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
