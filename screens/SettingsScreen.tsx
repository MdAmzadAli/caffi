import React from "react";
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

  const toggleTheme = () => {
    const nextMode = isDark ? "light" : "dark";
    setThemeMode(nextMode);
    toggleValue.value = withSpring(isDark ? 0 : 1, { damping: 15, stiffness: 150 });
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
    { id: "pref", label: "User preferences", icon: "user", emoji: "👤" },
    { id: "personalization", label: "Personalization", icon: "palette", emoji: "🎨" },
    { id: "localization", label: "Localization", icon: "globe", emoji: "🌐" },
    { id: "datetime", label: "Date & Time", icon: "clock", emoji: "⏰" },
    { id: "notifications", label: "Notifications", icon: "bell", emoji: "🔔" },
    { id: "integrations", label: "Integrations", icon: "heart", emoji: "❤️" },
    { id: "data", label: "Your data", icon: "database", emoji: "📂" },
    { id: "ads", label: "Disable ads / Support app", icon: "slash", emoji: "🚫" },
    { id: "new", label: "What's new", icon: "gift", emoji: "🎁" },
    { id: "feedback", label: "Feedback", icon: "message-square", emoji: "💬" },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={styles.headerTitle}>Settings</ThemedText>
        <Pressable onPress={toggleTheme} style={styles.themeToggleContainer}>
          <View style={[styles.toggleTrack, { backgroundColor: theme.backgroundSecondary }]}>
            <Animated.View style={[styles.toggleKnob, { backgroundColor: theme.backgroundRoot }, animatedToggleStyle]}>
               <MaterialCommunityIcons 
                name={isDark ? "weather-sunny" : "weather-night"} 
                size={16} 
                color={theme.accent} 
              />
            </Animated.View>
          </View>
        </Pressable>
      </View>

      <ScreenScrollView>
        <View style={styles.list}>
          {settingsItems.map((item) => (
            <Pressable 
              key={item.id} 
              style={[styles.item, { borderBottomColor: theme.divider }]}
              onPress={() => {
                if (item.id === "data") handleReset();
                else Alert.alert(item.label, "This section is coming soon!");
              }}
            >
              <View style={styles.itemLeft}>
                <Feather name={item.icon as any} size={22} color={theme.text} style={styles.icon} />
                <ThemedText type="body" style={styles.itemLabel}>{item.label}</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScreenScrollView>
    </ThemedView>
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
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
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
  list: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    fontSize: 17,
  },
});