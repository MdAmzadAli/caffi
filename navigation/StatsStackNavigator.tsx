import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StatisticsScreen from "@/screens/StatisticsScreen";
import CaffeineIntakeDetailScreen from "@/screens/CaffeineIntakeDetailScreen";

export type StatsStackParamList = {
  Statistics: undefined;
  CaffeineIntakeDetail: undefined;
};

const Stack = createNativeStackNavigator<StatsStackParamList>();

export default function StatsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="CaffeineIntakeDetail" component={CaffeineIntakeDetailScreen} />
    </Stack.Navigator>
  );
}
