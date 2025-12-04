import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import StatisticsScreen from "@/screens/StatisticsScreen";
import DrinkDatabaseScreen from "@/screens/DrinkDatabaseScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type HomeStackParamList = {
  Home: undefined;
  Statistics: undefined;
  DrinkDatabase: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Caffi" />,
        }}
      />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ headerTitle: "Statistics" }}
      />
      <Stack.Screen
        name="DrinkDatabase"
        component={DrinkDatabaseScreen}
        options={{ headerTitle: "Drink Database" }}
      />
    </Stack.Navigator>
  );
}
