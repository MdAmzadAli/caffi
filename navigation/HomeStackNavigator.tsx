import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import StatisticsScreen from "@/screens/StatisticsScreen";
import DrinkDatabaseScreen from "@/screens/DrinkDatabaseScreen";

export type HomeStackParamList = {
  Home: undefined;
  Statistics: undefined;
  DrinkDatabase: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="DrinkDatabase" component={DrinkDatabaseScreen} />
    </Stack.Navigator>
  );
}
