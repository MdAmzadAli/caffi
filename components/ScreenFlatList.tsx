import React from "react";
import { FlatList, FlatListProps, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing } from "@/constants/theme";

export function ScreenFlatList<T>({
  contentContainerStyle,
  style,
  ...flatListProps
}: FlatListProps<T>) {
  const { theme } = useTheme();
  const { paddingTop, paddingBottom, scrollInsetBottom } = useScreenInsets();
  const insets = useSafeAreaInsets();

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
        <FlatList
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
          {...flatListProps}
        />
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
