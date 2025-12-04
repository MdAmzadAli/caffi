import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface QuickStatCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  sublabel?: string;
  status?: "good" | "warning" | "danger";
}

export function QuickStatCard({
  icon,
  label,
  value,
  sublabel,
  status,
}: QuickStatCardProps) {
  const { theme } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case "good":
        return Colors.light.success;
      case "warning":
        return Colors.light.warning;
      case "danger":
        return Colors.light.danger;
      default:
        return Colors.light.accent;
    }
  };

  return (
    <ThemedView elevation={1} style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${getStatusColor()}20` },
        ]}
      >
        <Feather name={icon} size={16} color={getStatusColor()} />
      </View>
      <ThemedText type="caption" muted style={styles.label}>
        {label}
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.value, status && { color: getStatusColor() }]}
        numberOfLines={1}
      >
        {value}
      </ThemedText>
      {sublabel && (
        <ThemedText type="caption" muted numberOfLines={1}>
          {sublabel}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  label: {
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  value: {
    fontWeight: "600",
    textAlign: "center",
  },
});
