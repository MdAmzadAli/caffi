import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "@/screens/SettingsScreen";
import CustomDrinkScreen from "@/screens/CustomDrinkScreen";
import UserPreferencesScreen from "@/screens/settings/UserPreferencesScreen";
import DateTimeSettingsScreen from "@/screens/settings/DateTimeSettingsScreen";

export type SettingsStackParamList = {
  Settings: undefined;
  CustomDrink: undefined;
  UserPreferences: undefined;
  DateTimeSettings: undefined;
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
      <Stack.Screen name="UserPreferences" component={UserPreferencesScreen} />
      <Stack.Screen name="DateTimeSettings" component={DateTimeSettingsScreen} />
    </Stack.Navigator>
  );
}
