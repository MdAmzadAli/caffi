import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";

interface ScreenOptionsParams {
  theme: {
    backgroundRoot: string;
    text: string;
  };
  isDark: boolean;
  transparent?: boolean;
  statusBarHeight?: number;
}

export const getCommonScreenOptions = ({
  theme,
  isDark,
  transparent = true,
  statusBarHeight = 0,
}: ScreenOptionsParams): NativeStackNavigationOptions => {
  // headerStatusBarHeight ensures header content is positioned below the status bar
  // This is critical for both iOS and Android to prevent header titles from colliding with status bar
  
  return {
    headerTitleAlign: "center",
    headerTransparent: transparent,
    headerBlurEffect: isDark ? "dark" : "light",
    headerTintColor: theme.text,
    // This is critical: ensures header content (title) is positioned below the status bar
    // React Navigation uses this to add padding-top to the header content area
    headerStatusBarHeight: statusBarHeight,
    headerStyle: {
      backgroundColor: Platform.select({
        ios: transparent ? undefined : theme.backgroundRoot,
        android: transparent ? undefined : theme.backgroundRoot,
        web: theme.backgroundRoot,
      }),
      // Ensure header extends into status bar area for background
      // React Navigation automatically handles content positioning with headerStatusBarHeight
    },
    gestureEnabled: true,
    gestureDirection: "horizontal",
    fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
    contentStyle: {
      backgroundColor: theme.backgroundRoot,
    },
  };
};
