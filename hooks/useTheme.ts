import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeStore, ThemeMode } from "@/store/themeStore";

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { themeMode, setThemeMode, toggleTheme } = useThemeStore();
  
  const resolvedScheme = themeMode === "system" 
    ? (systemColorScheme ?? "light") 
    : themeMode;
  
  const isDark = resolvedScheme === "dark";
  const theme = Colors[resolvedScheme];

  return {
    theme,
    isDark,
    themeMode,
    setThemeMode,
    toggleTheme,
  };
}
