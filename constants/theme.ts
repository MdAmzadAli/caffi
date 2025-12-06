import { Platform } from "react-native";

export const Colors = {
  light: {
    bg: "#FFFFFF",
    accentGold: "#C9A36A",
    darkBrown: "#5C4A3B",
    darkBrown2: "#6A513B",
    green: "#53A451",
    blue: "#4DA3FF",
    mutedGrey: "#9E9E9E",
    red: "#D9534F",
    white: "#FFFFFF",
    text: "#5C4A3B",
    textMuted: "#9E9E9E",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9E9E9E",
    tabIconSelected: "#C9A36A",
    link: "#C9A36A",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#FFFFFF",
    backgroundTertiary: "#F5F5F5",
    accent: "#C9A36A",
    success: "#53A451",
    warning: "#F2A43A",
    danger: "#D9534F",
    divider: "#E8E4DC",
  },
  dark: {
    bg: "#1F1815",
    accentGold: "#C9A36A",
    darkBrown: "#F5EBDD",
    darkBrown2: "#E8DFD4",
    green: "#53A451",
    blue: "#4DA3FF",
    mutedGrey: "#A0A0A0",
    red: "#D9534F",
    white: "#FFFFFF",
    text: "#F5EBDD",
    textMuted: "#A0A0A0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#C9A36A",
    link: "#C9A36A",
    backgroundRoot: "#1F1815",
    backgroundDefault: "#2A2420",
    backgroundSecondary: "#353030",
    backgroundTertiary: "#403838",
    accent: "#C9A36A",
    success: "#53A451",
    warning: "#F2A43A",
    danger: "#D9534F",
    divider: "#3A3535",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  largeStat: {
    fontSize: 44,
    fontWeight: "700" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};
