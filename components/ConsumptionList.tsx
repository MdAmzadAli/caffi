import React, { useMemo } from "react";
import { View, StyleSheet, Text, Image, Pressable, SectionList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Spacing } from "@/constants/theme";
import { DrinkEntry } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { getCaffeineSourceImage, resolveImageSource } from "@/utils/getCaffeineSourceImage";

import { getServingLabel } from "@/utils/getServingLabel";

interface ConsumptionListProps {
  entries: DrinkEntry[];
  onEntryPress?: (entry: DrinkEntry) => void;
  onDeleteEntry?: (id: string) => void;
}

interface SectionData {
  title: string;
  data: DrinkEntry[];
  dateKey: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  coffee: "☕",
  tea: "🍵",
  energy: "⚡",
  soda: "🥤",
  chocolate: "🍫",
  custom: "🧋",
};

function formatDateHeader(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const entryDate = new Date(date);
  entryDate.setHours(0, 0, 0, 0);
  
  if (entryDate.getTime() === today.getTime()) {
    return "Today";
  } else if (entryDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[entryDate.getDay()];
    const day = entryDate.getDate().toString().padStart(2, "0");
    const month = (entryDate.getMonth() + 1).toString().padStart(2, "0");
    const year = entryDate.getFullYear();
    return `${dayName.toUpperCase()}, ${day}/${month}/${year}`;
  }
}

function formatTime(timestamp: Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getEntryIcon(category: string): string {
  return CATEGORY_ICONS[category] || "☕";
}

export function ConsumptionList({
  entries,
  onEntryPress,
  onDeleteEntry,
}: ConsumptionListProps) {
  const { theme } = useTheme();

  const sections = useMemo(() => {
    if (entries.length === 0) return [];

    // Group entries by date
    const grouped = new Map<string, DrinkEntry[]>();
    
    entries.forEach((entry) => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      const dateKey = entryDate.toISOString();
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(entry);
    });

    // Convert to sections array and sort by date (newest first)
    const sectionsArray: SectionData[] = Array.from(grouped.entries())
      .map(([dateKey, data]) => {
        // Sort entries within each section by time (newest first)
        const sortedData = [...data].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return {
          title: formatDateHeader(new Date(dateKey)),
          data: sortedData,
          dateKey,
        };
      })
      .sort((a, b) => {
        // Sort sections by date (newest first)
        return new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime();
      });

    return sectionsArray;
  }, [entries]);

  const renderItem = ({ item }: { item: DrinkEntry }) => {
    const resolvedImage = item.imageUri ? resolveImageSource(item.imageUri) : null;
    const categoryImage = getCaffeineSourceImage(item.category);
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.entryRow,
          {
            backgroundColor: theme.backgroundSecondary,
          },
          pressed && { backgroundColor: theme.backgroundTertiary },
        ]}
        onPress={() => onEntryPress?.(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.backgroundTertiary }]}>
          {resolvedImage ? (
            <Image
              source={resolvedImage}
              style={styles.entryImage}
            />
          ) : categoryImage ? (
            <Image
              source={categoryImage}
              style={styles.entryImage}
            />
          ) : (
            <Text style={styles.entryEmoji}>{getEntryIcon(item.category)}</Text>
          )}
        </View>

        <View style={styles.entryInfo}>
          <Text style={[styles.entryName, { color: theme.darkBrown }]}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.entryTime, { color: theme.mutedGrey }]}>
              {formatTime(item.timestamp)}
            </Text>
            {(() => {
              const INBUILT_CATEGORIES = ["coffee", "tea", "energy", "soda", "chocolate"];
              const isCustom = item.category === "custom" || !INBUILT_CATEGORIES.includes(item.category);
              const drink = !isCustom ? require("@/store/caffeineStore").DRINK_DATABASE.find((d: any) => d.id === item.drinkId && d.category === item.category) : null;
              const label = getServingLabel(item.servingSize, item.unit, drink?.defaultServingMl, isCustom);
              return (
                <Text style={[styles.entryTime, { color: theme.mutedGrey }]}>
                  {" • "}{label.quantity} {label.unit}
                </Text>
              );
            })()}
          </View>
        </View>

        <Text style={[styles.entryMg, { color: theme.darkBrown }]}>
          {item.caffeineAmount} mg
        </Text>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => {
    return (
      <View style={[styles.sectionHeader, { backgroundColor: theme.bg }]}>
        <Text style={[styles.sectionHeaderText, { color: theme.mutedGrey }]}>
          {section.title}
        </Text>
      </View>
    );
  };

  if (entries.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="coffee" size={32} color={theme.mutedGrey} />
        <Text style={[styles.emptyText, { color: theme.mutedGrey }]}>No drinks logged</Text>
        <Text style={[styles.emptySubtext, { color: theme.mutedGrey }]}>Tap + to add your first drink</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={true}
      contentContainerStyle={styles.listContent}
      style={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    width: "100%",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  entryImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  entryEmoji: {
    fontSize: 22,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    fontWeight: "400",
  },
  entryMg: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 13,
  },
});
