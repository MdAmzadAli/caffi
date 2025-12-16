import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type IndicatorStatus = "safe" | "warning" | "danger";

interface GlowIndicatorProps {
  icon: "coffee" | "moon";
  label: string;
  status: IndicatorStatus;
  style?: ViewStyle;
}

const STATUS_COLORS = {
  safe: "#53A451",
  warning: "#F2A43A",
  danger: "#D9534F",
};

export function GlowIndicator({ icon, label, status, style }: GlowIndicatorProps) {
  const { theme } = useTheme();
  const color = STATUS_COLORS[status];

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrapper, { shadowColor: color }]}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
          <Feather name={icon} size={24} color={color} />
        </View>
      </View>
      <ThemedText type="caption" style={[styles.label, { color: theme.textMuted }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  iconWrapper: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
