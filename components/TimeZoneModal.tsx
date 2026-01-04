import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { BottomSheetModal } from "./BottomSheetModal";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

interface TimeZoneModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTimeZone: string;
  onSelect: (timezone: string) => void;
}

export function TimeZoneModal({
  visible,
  onClose,
  selectedTimeZone,
  onSelect,
}: TimeZoneModalProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTimeZones = useMemo(() => {
    return TIMEZONES.filter((tz) =>
      tz.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const accentColor = "#C9A36A";

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeight={600}>
      <Text style={[styles.title, { color: theme.text }]}>Select Timezone</Text>
      
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="search" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search timezone..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Feather name="x" size={20} color={theme.textMuted} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredTimeZones}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isSelected = item === selectedTimeZone;
          return (
            <Pressable
              style={[
                styles.option,
                isSelected && { backgroundColor: accentColor + "20" }
              ]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text style={[
                styles.optionText, 
                { color: theme.text },
                isSelected && { color: accentColor, fontWeight: "700" }
              ]}>
                {item}
              </Text>
              {isSelected && (
                <Feather name="check" size={20} color={accentColor} />
              )}
            </Pressable>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        style={{ flex: 1 }}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  optionText: {
    fontSize: 16,
  },
});
