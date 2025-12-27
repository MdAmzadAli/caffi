import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Svg, { G, Path, Circle, Text as SvgText } from "react-native-svg";
import { DateRangePickerModal, DateRangeOption } from "@/components/DateRangePickerModal";

type ViewMode = "item" | "category";

interface DateRange {
  start: Date;
  end: Date;
}

const CATEGORY_COLORS: Record<string, string> = {
  coffee: "#5D4037",
  tea: "#7B8D42",
  energy: "#FF6B35",
  soda: "#E74C3C",
  chocolate: "#8B4513",
  custom: "#9B59B6",
};

const ITEM_COLORS = [
  "#5D4037",
  "#FF9800",
  "#4CAF50",
  "#2196F3",
  "#9C27B0",
  "#E91E63",
  "#00BCD4",
  "#795548",
  "#607D8B",
  "#FF5722",
];

const CATEGORY_IMAGES: Record<string, any> = {
  coffee: require("@/assets/CaffeineSourceImages/coffee.png"),
  tea: require("@/assets/CaffeineSourceImages/tea.jpg"),
  energy: require("@/assets/CaffeineSourceImages/energy.png"),
  soda: require("@/assets/CaffeineSourceImages/soda.png"),
  chocolate: require("@/assets/CaffeineSourceImages/chocolate.png"),
};

function getDrinkImageSource(item: any): { uri?: string; source?: any } {
  const imageUri = item.imageUri;
  if (imageUri) {
    if (imageUri.startsWith("preset:")) {
      const { PRESET_IMAGES } = require("@/components/ImagePickerModal");
      const preset = PRESET_IMAGES.find((p: any) => p.id === imageUri.replace("preset:", ""));
      return preset ? { source: preset.image } : {};
    }
    if (imageUri.startsWith("category:")) {
      const category = imageUri.replace("category:", "");
      return CATEGORY_IMAGES[category] ? { source: CATEGORY_IMAGES[category] } : {};
    }
    return { uri: imageUri };
  }
  return CATEGORY_IMAGES[item.category] ? { source: CATEGORY_IMAGES[item.category] } : {};
}

const DATE_OPTION_LABELS: Record<DateRangeOption, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last30: "Last 30 days",
  last90: "Last 90 days",
  custom: "Custom",
};

function getDateRange(option: DateRangeOption, customRange?: DateRange): DateRange {
  const now = new Date();
  
  switch (option) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "yesterday": {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "last30": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "last90": {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "custom":
      return customRange || { start: now, end: now };
    default:
      return { start: now, end: now };
  }
}

export default function CaffeineBySourceScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { entries } = useCaffeineStore();
  const [viewMode, setViewMode] = useState<ViewMode>("item");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateOption, setSelectedDateOption] = useState<DateRangeOption>("today");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  const currentDateRange = useMemo(() => {
    return getDateRange(selectedDateOption, customDateRange);
  }, [selectedDateOption, customDateRange]);

  const dateButtonLabel = useMemo(() => {
    if (selectedDateOption === "custom" && customDateRange) {
      const formatDate = (date: Date) => date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return `${formatDate(customDateRange.start)} - ${formatDate(customDateRange.end)}`;
    }
    return DATE_OPTION_LABELS[selectedDateOption];
  }, [selectedDateOption, customDateRange]);

  const filteredEntries = useMemo(() => {
    const { start, end } = currentDateRange;
    return entries.filter((e) => {
      const t = new Date(e.timestamp);
      return t >= start && t <= end;
    });
  }, [entries, currentDateRange]);

  const chartData = useMemo(() => {
    if (filteredEntries.length === 0) {
      return { items: [], total: 0 };
    }

    const total = filteredEntries.reduce((sum, e) => sum + e.caffeineAmount, 0);

    if (viewMode === "category") {
      const categoryMap: Record<string, { caffeine: number; count: number; items: Record<string, number> }> = {};
      
      filteredEntries.forEach((e) => {
        if (!categoryMap[e.category]) {
          categoryMap[e.category] = { caffeine: 0, count: 0, items: {} };
        }
        categoryMap[e.category].caffeine += e.caffeineAmount;
        categoryMap[e.category].count += 1;
        categoryMap[e.category].items[e.name] = (categoryMap[e.category].items[e.name] || 0) + 1;
      });

      const items = Object.entries(categoryMap)
        .map(([category, data]) => {
          const mostFrequent = Object.entries(data.items).sort((a, b) => b[1] - a[1])[0];
          return {
            id: category,
            name: category.charAt(0).toUpperCase() + category.slice(1),
            caffeine: data.caffeine,
            count: data.count,
            percentage: (data.caffeine / total) * 100,
            color: CATEGORY_COLORS[category] || CATEGORY_COLORS.custom,
            mostFrequent: mostFrequent ? mostFrequent[0] : undefined,
            category,
          };
        })
        .sort((a, b) => b.caffeine - a.caffeine);

      return { items, total };
    } else {
      const itemMap: Record<string, { caffeine: number; count: number; category: string }> = {};
      
      filteredEntries.forEach((e) => {
        const key = e.drinkId || e.name;
        if (!itemMap[key]) {
          itemMap[key] = { caffeine: 0, count: 0, category: e.category };
        }
        itemMap[key].caffeine += e.caffeineAmount;
        itemMap[key].count += 1;
      });

      const items = Object.entries(itemMap)
        .map(([id, data], index) => {
          const entry = filteredEntries.find((e) => (e.drinkId || e.name) === id);
          return {
            id,
            name: entry?.name || id,
            caffeine: data.caffeine,
            count: data.count,
            percentage: (data.caffeine / total) * 100,
            color: ITEM_COLORS[index % ITEM_COLORS.length],
            category: data.category,
            imageUri: entry?.imageUri,
          };
        })
        .sort((a, b) => b.caffeine - a.caffeine);

      return { items, total };
    }
  }, [filteredEntries, viewMode]);

  const handleDateRangeSelect = (option: DateRangeOption, range: DateRange) => {
    setSelectedDateOption(option);
    if (option === "custom") {
      setCustomDateRange(range);
    } else {
      setCustomDateRange(undefined);
    }
  };

  const CHART_SIZE = Dimensions.get("window").width * 0.5;
  const CENTER = CHART_SIZE / 2;
  const RADIUS = CHART_SIZE / 2 - 10;
  const INNER_RADIUS = RADIUS * 0.6;

  const renderDonutChart = () => {
    if (chartData.items.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <View style={styles.chartWrapper}>
            <Svg width={CHART_SIZE} height={CHART_SIZE}>
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill={theme.divider}
              />
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={INNER_RADIUS}
                fill={theme.backgroundRoot}
              />
            </Svg>
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.divider }]} />
              <Text style={[styles.legendText, { color: theme.mutedGrey }]}>No data</Text>
            </View>
          </View>
        </View>
      );
    }

    let startAngle = -90;
    const paths: React.ReactNode[] = [];
    const percentageLabels: React.ReactNode[] = [];

    chartData.items.forEach((item, index) => {
      const angle = (item.percentage / 100) * 360;
      const endAngle = startAngle + angle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = CENTER + RADIUS * Math.cos(startRad);
      const y1 = CENTER + RADIUS * Math.sin(startRad);
      const x2 = CENTER + RADIUS * Math.cos(endRad);
      const y2 = CENTER + RADIUS * Math.sin(endRad);
      
      const x3 = CENTER + INNER_RADIUS * Math.cos(endRad);
      const y3 = CENTER + INNER_RADIUS * Math.sin(endRad);
      const x4 = CENTER + INNER_RADIUS * Math.cos(startRad);
      const y4 = CENTER + INNER_RADIUS * Math.sin(startRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const d = `
        M ${x1} ${y1}
        A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 0 ${x4} ${y4}
        Z
      `;
      
      paths.push(
        <Path key={item.id} d={d} fill={item.color} />
      );

      if (item.percentage >= 10) {
        const midAngle = startAngle + angle / 2;
        const midRad = (midAngle * Math.PI) / 180;
        const labelRadius = (RADIUS + INNER_RADIUS) / 2;
        const labelX = CENTER + labelRadius * Math.cos(midRad);
        const labelY = CENTER + labelRadius * Math.sin(midRad);
        
        percentageLabels.push(
          <SvgText
            key={`label-${item.id}`}
            x={labelX}
            y={labelY}
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {item.percentage.toFixed(1)}%
          </SvgText>
        );
      }

      startAngle = endAngle;
    });

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartWrapper}>
          <Svg width={CHART_SIZE} height={CHART_SIZE}>
            <G>{paths}</G>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={INNER_RADIUS}
              fill={theme.backgroundRoot}
            />
            {percentageLabels}
          </Svg>
        </View>
        <View style={styles.legendContainer}>
          {chartData.items.map((item) => (
            <View key={item.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: theme.text }]}>{item.name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Analytics</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.text }]}>Caffeine by source</Text>
          <Text style={[styles.description, { color: theme.mutedGrey }]}>
            Where does the caffeine you consume come from?
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <Pressable
            style={[styles.dateButton, { borderColor: theme.divider }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateButtonText, { color: theme.text }]}>
              {dateButtonLabel}
            </Text>
            <Feather name="chevron-down" size={16} color={theme.text} />
          </Pressable>

          <Pressable
            style={[styles.viewModeButton, { backgroundColor: viewMode === "item" ? "#4A4A4A" : theme.accentGold }]}
            onPress={() => setViewMode(viewMode === "item" ? "category" : "item")}
          >
            <Feather name="grid" size={16} color="#FFFFFF" />
            <Text style={styles.viewModeButtonText}>
              {viewMode === "item" ? "Item view" : "Category view"}
            </Text>
          </Pressable>
        </View>

        {renderDonutChart()}

        {chartData.items.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataTitle, { color: theme.text }]}>No data</Text>
            <Text style={[styles.noDataDescription, { color: theme.mutedGrey }]}>
              No data for the given time period.
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {chartData.items.map((item) => (
              <View
                key={item.id}
                style={[styles.itemRow, { borderBottomColor: theme.divider }]}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.itemImageContainer, { backgroundColor: theme.backgroundSecondary }]}>
                    {viewMode === "category" ? (
                      <Feather name="coffee" size={24} color={item.color} />
                    ) : (
                      <Image
                        source={getDrinkImageSource(item)}
                        style={styles.itemImage}
                        defaultSource={require("@/assets/CaffeineSourceImages/coffee.png")}
                      />
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.itemSubtext, { color: theme.mutedGrey }]}>
                      {viewMode === "category" && (item as any).mostFrequent
                        ? `Most frequent: ${(item as any).mostFrequent}`
                        : `${item.count} time${item.count !== 1 ? "s" : ""}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={[styles.itemPercentage, { color: theme.text }]}>
                    {item.percentage.toFixed(1)}%
                  </Text>
                  <Text style={[styles.itemCaffeine, { color: theme.mutedGrey }]}>
                    {item.caffeine}mg
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <DateRangePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectRange={handleDateRangeSelect}
        selectedOption={selectedDateOption}
        customRange={customDateRange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  controlsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  viewModeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    flex: 1,
    justifyContent: "center",
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  chartWrapper: {
    flex: 1,
  },
  legendContainer: {
    flex: 1,
    paddingLeft: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 14,
    fontWeight: "500",
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  noDataDescription: {
    fontSize: 14,
  },
  itemsList: {
    marginTop: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  itemImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  itemImage: {
    width: 48,
    height: 48,
    resizeMode: "cover",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemSubtext: {
    fontSize: 13,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  itemPercentage: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemCaffeine: {
    fontSize: 13,
  },
});
