import React from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";

import RootNavigator from "@/navigation/RootNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/store/themeStore";

const caffiLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#C69C6D",
    primaryContainer: "#FFFFFF",
    onPrimaryContainer: "#6B4C3B",
    secondary: "#C69C6D",
    secondaryContainer: "#F5F5F5",
    onSecondaryContainer: "#6B4C3B",
    tertiary: "#C69C6D",
    tertiaryContainer: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceVariant: "#F5F5F5",
    onSurface: "#6B4C3B",
    onSurfaceVariant: "#5A5A5A",
    outline: "#C69C6D",
    background: "#FFFFFF",
    onBackground: "#6B4C3B",
  },
};

const caffiDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#C9A36A",
    primaryContainer: "#2A2420",
    onPrimaryContainer: "#F5EBDD",
    secondary: "#C9A36A",
    secondaryContainer: "#353030",
    onSecondaryContainer: "#F5EBDD",
    tertiary: "#C9A36A",
    tertiaryContainer: "#2A2420",
    surface: "#1F1815",
    surfaceVariant: "#353030",
    onSurface: "#F5EBDD",
    onSurfaceVariant: "#A0A0A0",
    outline: "#C9A36A",
    background: "#1F1815",
    onBackground: "#F5EBDD",
  },
};

const navLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.bg,
    card: Colors.light.backgroundSecondary,
    text: Colors.light.text,
    border: Colors.light.divider,
    primary: Colors.light.accent,
  },
};

const navDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.bg,
    card: Colors.dark.backgroundSecondary,
    text: Colors.dark.text,
    border: Colors.dark.divider,
    primary: Colors.dark.accent,
  },
};

function AppContent() {
  const { isDark, theme } = useTheme();
  
  return (
    <PaperProvider theme={isDark ? caffiDarkTheme : caffiLightTheme}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <View style={[styles.root, { backgroundColor: theme.bg }]}>
            <KeyboardProvider>
              <NavigationContainer theme={isDark ? navDarkTheme : navLightTheme}>
                <RootNavigator />
              </NavigationContainer>
              <StatusBar style={isDark ? "light" : "dark"} />
            </KeyboardProvider>
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
