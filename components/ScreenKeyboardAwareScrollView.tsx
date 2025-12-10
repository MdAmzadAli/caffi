import { Platform, StyleSheet, View, ReactNode } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing } from "@/constants/theme";
import { ScreenScrollView } from "./ScreenScrollView";

interface ScreenKeyboardAwareScrollViewProps extends KeyboardAwareScrollViewProps {
  header?: ReactNode;
}

export function ScreenKeyboardAwareScrollView({
  children,
  contentContainerStyle,
  style,
  keyboardShouldPersistTaps = "handled",
  header,
  ...scrollViewProps
}: ScreenKeyboardAwareScrollViewProps) {
  const { theme } = useTheme();
  const { paddingTop, paddingBottom, scrollInsetBottom } = useScreenInsets();
  const insets = useSafeAreaInsets();

  /**
   * KeyboardAwareScrollView isn't compatible with web (it relies on native APIs), so the code falls back to ScreenScrollView on web to avoid runtime errors.
   */
  if (Platform.OS === "web") {
    return (
      <ScreenScrollView
        style={style}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        header={header}
        {...scrollViewProps}
      >
        {children}
      </ScreenScrollView>
    );
  }

  return (
    <View
      style={[
        styles.outerContainer,
        { backgroundColor: theme.backgroundRoot },
      ]}
    >
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
        edges={[]}
      >
        {header}
        <KeyboardAwareScrollView
          style={[
            styles.container,
            style,
          ]}
          contentContainerStyle={[
            {
              paddingTop,
              paddingBottom,
            },
            styles.contentContainer,
            contentContainerStyle,
          ]}
          scrollIndicatorInsets={{ bottom: scrollInsetBottom }}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          {...scrollViewProps}
        >
          {children}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
  },
});
