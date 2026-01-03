import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  useSharedValue,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCaffeineStore } from "@/store/caffeineStore";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { SettingsStackParamList } from "@/navigation/SettingsStackNavigator";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "Settings">;
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme, isDark, setThemeMode } = useTheme();
  const { resetData } = useCaffeineStore();
  const insets = useSafeAreaInsets();

  const toggleValue = useSharedValue(isDark ? 1 : 0);

  // Sync animated value with theme changes (including external changes)
  useEffect(() => {
    toggleValue.value = isDark ? 1 : 0;
  }, [isDark]);

  const toggleTheme = () => {
    const nextMode = isDark ? "light" : "dark";
    const targetValue = isDark ? 0 : 1;

    // Animate first
    toggleValue.value = withSpring(targetValue, { damping: 20, stiffness: 200 });

    // Then change theme (will cause re-render but animated value already set)
    setThemeMode(nextMode);
  };

  const animatedToggleStyle = useAnimatedStyle(() => {
    const translateX = interpolate(toggleValue.value, [0, 1], [0, 24]);
    return {
      transform: [{ translateX }],
    };
  });

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This will delete all your drink history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => resetData(),
        },
      ],
    );
  };

  const settingsItems = [
    { id: "pref", label: "User preferences", icon: "account-outline", emoji: "👤" },
    { id: "datetime", label: "Date & Time", icon: "clock-outline", emoji: "⏰" },
    { id: "notifications", label: "Notifications", icon: "bell-outline", emoji: "🔔" },
    { id: "data", label: "Your data", icon: "database-outline", emoji: "📂" },
    { id: "feedback", label: "Feedback", icon: "message-outline", emoji: "💬" },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.backButton} />
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <Pressable onPress={toggleTheme} style={styles.themeToggleContainer}>
          <View style={[styles.toggleTrack, { backgroundColor: theme.backgroundSecondary }]}>
            {/* Opposite icon - shows what theme you'll get when you tap */}
            <View style={[styles.oppositeIcon, isDark ? styles.oppositeIconLeft : styles.oppositeIconRight]}>
              <MaterialCommunityIcons 
                name={isDark ? "weather-sunny" : "weather-night"} 
                size={16} 
                color={theme.textMuted} 
              />
            </View>
            {/* Current theme icon inside the knob */}
            <Animated.View style={[styles.toggleKnob, { backgroundColor: theme.backgroundRoot }, animatedToggleStyle]} />
          </View>
        </Pressable>
      </View>

      <ScreenScrollView>
        <View style={styles.list}>
          {settingsItems.map((item) => (
            <Pressable 
              key={item.id} 
              style={styles.item}
              onPress={() => {
                if (item.id === "pref") navigation.navigate("UserPreferences");
                else if (item.id === "data") handleReset();
                else Alert.alert(item.label, "This section is coming soon!");
              }}
            >
              <View style={styles.itemLeft}>
                <MaterialCommunityIcons 
                  name={item.icon as any} 
                  size={24} 
                  color={theme.text} 
                  style={styles.icon} 
                />
                <ThemedText type="body" style={styles.itemLabel}>{item.label}</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScreenScrollView>
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
    // paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    // fontWeight: "600",
    fontSize: 22,
      fontWeight: "700",
  },
  themeToggleContainer: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  toggleTrack: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  oppositeIcon: {
    position: "absolute",
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  oppositeIconLeft: {
    left: 2,
  },
  oppositeIconRight: {
    right: 2,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    // marginTop: Spacing.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: Spacing.lg,
    width: 24,
  },
  itemLabel: {
    fontSize: 20,
  },
});