import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StatisticsScreen from "@/screens/StatisticsScreen";
import CaffeineIntakeDetailScreen from "@/screens/CaffeineIntakeDetailScreen";
import CaffeineBySourceScreen from "@/screens/CaffeineBySourceScreen";
import SleepTargetScreen from "@/screens/SleepTargetScreen";
import ConsumptionByTimeScreen from "@/screens/ConsumptionByTimeScreen";

export type StatsStackParamList = {
  Statistics: undefined;
  CaffeineIntakeDetail: undefined;
  CaffeineBySource: undefined;
  SleepTarget: undefined;
  ConsumptionByTime: undefined;
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
      <Stack.Screen name="CaffeineBySource" component={CaffeineBySourceScreen} />
      <Stack.Screen name="SleepTarget" component={SleepTargetScreen} />
      <Stack.Screen name="ConsumptionByTime" component={ConsumptionByTimeScreen} />
    </Stack.Navigator>
  );
}
