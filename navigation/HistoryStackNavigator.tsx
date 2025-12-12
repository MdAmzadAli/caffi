import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HistoryScreen from "@/screens/HistoryScreen";
import ArticleScreen from "@/screens/ArticleScreen";

interface Article {
  id: string;
  title: string;
  summary: string;
  image: string;
  content: string;
  references: string[];
}

export type HistoryStackParamList = {
  History: undefined;
  Article: { article: Article };
};

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Article" component={ArticleScreen} />
    </Stack.Navigator>
  );
}
