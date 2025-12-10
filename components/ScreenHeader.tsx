import React from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

interface ScreenHeaderProps {
  title: string;
  showIcon?: boolean;
  showBackButton?: boolean;
}

export function ScreenHeader({ title, showIcon = false, showBackButton = false }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <View style={[styles.header, { backgroundColor: theme.backgroundRoot }]}>
      {showBackButton && (
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={24} color={theme.text} />
        </Pressable>
      )}
      <View style={styles.titleContainer}>
        {showIcon && (
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
        )}
        <ThemedText style={[styles.title, { color: theme.text }]}>
          {title}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
    borderRadius: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
});

