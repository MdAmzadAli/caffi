import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { BottomSheetModal } from "./BottomSheetModal";

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "DD.MM.YYYY" | "DD MMM YYYY";

type DateFormatPopupProps = {
  visible: boolean;
  selectedFormat: string;
  onClose: () => void;
  onSelect: (format: DateFormat) => void;
};

const FORMAT_OPTIONS: { label: string; value: DateFormat }[] = [
  { label: "31/12/2025", value: "DD/MM/YYYY" },
  { label: "12/31/2025", value: "MM/DD/YYYY" },
  { label: "2025-12-31", value: "YYYY-MM-DD" },
  { label: "31. 12. 2025", value: "DD.MM.YYYY" },
  { label: "31 Dec 2025", value: "DD MMM YYYY" },
];

export function DateFormatPopup({
  visible,
  selectedFormat,
  onClose,
  onSelect,
}: DateFormatPopupProps) {
  const { theme } = useTheme();

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      maxHeight={450}
    >
      <Text style={[styles.title, { color: theme.text }]}>Choose date format</Text>

      <View style={styles.optionsContainer}>
        {FORMAT_OPTIONS.map((option) => {
          const isSelected = selectedFormat === option.value;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.option,
                isSelected && [styles.selectedOption, { borderColor: "#C9A36A" }]
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Text style={[styles.optionText, { color: theme.text }]}>
                {option.label}
              </Text>
              {isSelected && (
                <Feather name="check" size={20} color="#C9A36A" />
              )}
            </Pressable>
          );
        })}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.xs,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedOption: {
    borderWidth: 1,
  },
  optionText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
