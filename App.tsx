import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { PaperProvider, MD3LightTheme } from "react-native-paper";

import RootNavigator from "@/navigation/RootNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const caffiTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#C69C6D",
    primaryContainer: "#F5EBDD",
    onPrimaryContainer: "#6B4C3B",
    secondary: "#C69C6D",
    secondaryContainer: "#E8DFD4",
    onSecondaryContainer: "#6B4C3B",
    tertiary: "#C69C6D",
    tertiaryContainer: "#F5EBDD",
    surface: "#F5EBDD",
    surfaceVariant: "#E8DFD4",
    onSurface: "#6B4C3B",
    onSurfaceVariant: "#5A5A5A",
    outline: "#C69C6D",
    background: "#F5EBDD",
    onBackground: "#6B4C3B",
  },
};

export default function App() {
  return (
  <ErrorBoundary>
    <PaperProvider theme={caffiTheme}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <StatusBar style="auto" />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </PaperProvider>
  </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
