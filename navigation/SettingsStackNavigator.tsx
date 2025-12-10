import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "@/screens/SettingsScreen";
import CustomDrinkScreen from "@/screens/CustomDrinkScreen";

export type SettingsStackParamList = {
  Settings: undefined;
  CustomDrink: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="CustomDrink" component={CustomDrinkScreen} />
    </Stack.Navigator>
  );
}
