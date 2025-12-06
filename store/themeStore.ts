import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "@caffi_theme";

let globalThemeMode: ThemeMode = "light";
let globalListeners: (() => void)[] = [];
let isInitialized = false;

const notifyListeners = () => {
  globalListeners.forEach((listener) => listener());
};

const saveToStorage = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, globalThemeMode);
  } catch (error) {
    console.error("Error saving theme to storage:", error);
  }
};

const loadFromStorage = async () => {
  try {
    const storedTheme = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedTheme && (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system")) {
      globalThemeMode = storedTheme as ThemeMode;
    }
    isInitialized = true;
    notifyListeners();
  } catch (error) {
    console.error("Error loading theme from storage:", error);
    isInitialized = true;
  }
};

loadFromStorage();

export function useThemeStore() {
  const [, setUpdate] = useState(0);

  useEffect(() => {
    const listener = () => setUpdate((n) => n + 1);
    globalListeners.push(listener);
    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener);
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    globalThemeMode = mode;
    notifyListeners();
    saveToStorage();
  }, []);

  const toggleTheme = useCallback(() => {
    globalThemeMode = globalThemeMode === "light" ? "dark" : "light";
    notifyListeners();
    saveToStorage();
  }, []);

  return {
    themeMode: globalThemeMode,
    isInitialized,
    setThemeMode,
    toggleTheme,
  };
}
