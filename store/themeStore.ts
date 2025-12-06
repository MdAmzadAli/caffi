import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "@caffi_theme";

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isInitialized: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedTheme && (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system")) {
          setThemeModeState(storedTheme as ThemeMode);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
      setIsInitialized(true);
    };
    loadTheme();
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    console.log("Setting theme mode to:", mode);
    setThemeModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode).catch((error) => {
      console.error("Error saving theme:", error);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
  }, [themeMode, setThemeMode]);

  return React.createElement(
    ThemeContext.Provider,
    { value: { themeMode, setThemeMode, toggleTheme, isInitialized } },
    children
  );
}

export function useThemeStore(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeMode: "light",
      setThemeMode: () => {},
      toggleTheme: () => {},
      isInitialized: false,
    };
  }
  return context;
}
