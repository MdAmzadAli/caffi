import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import HistoryStackNavigator from "@/navigation/HistoryStackNavigator";
import SettingsStackNavigator from "@/navigation/SettingsStackNavigator";
import StatisticsScreen from "@/screens/StatisticsScreen";
import AddDrinkModal from "@/screens/AddDrinkModal";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

export type MainTabParamList = {
  HomeTab: undefined;
  StatsTab: undefined;
  AddTab: undefined;
  HistoryTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FABPlaceholder() {
  return <View style={{ flex: 1 }} />;
}

interface FABProps {
  onPress: () => void;
}

function FloatingActionButton({ onPress }: FABProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.fab, animatedStyle]}
    >
      <View style={styles.fabInner}>
        <Feather name="plus" size={28} color="#FFFFFF" />
      </View>
    </AnimatedPressable>
  );
}

function StatsTabWrapper() {
  return <StatisticsScreen />;
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();

  const handleNavigateToCustomDrink = () => {
    navigation.navigate("SettingsTab", {
      screen: "CustomDrink",
    } as any);
  };

  return (
    <>
      <Tab.Navigator
        initialRouteName="HomeTab"
        screenOptions={{
          tabBarActiveTintColor: Colors.light.accent,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.select({
              ios: "transparent",
              android: theme.backgroundRoot,
            }),
            borderTopWidth: 0,
            elevation: 0,
            height: Platform.OS === "ios" ? 88 : 64,
            paddingBottom: Platform.OS === "ios" ? 28 : 8,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Feather name="message-circle" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="StatsTab"
          component={StatsTabWrapper}
          options={{
            title: "Stats",
            tabBarIcon: ({ color, size }) => (
              <Feather name="bar-chart-2" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="AddTab"
          component={FABPlaceholder}
          options={{
            title: "",
            tabBarButton: () => (
              <FloatingActionButton onPress={() => setShowAddModal(true)} />
            ),
          }}
        />
        <Tab.Screen
          name="HistoryTab"
          component={HistoryStackNavigator}
          options={{
            title: "History",
            tabBarIcon: ({ color, size }) => (
              <Feather name="layers" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackNavigator}
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Feather name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      <AddDrinkModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onNavigateToCustomDrink={handleNavigateToCustomDrink}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    top: -20,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    ...Shadows.large,
  },
  fabInner: {
    flex: 1,
    backgroundColor: Colors.light.accent,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
