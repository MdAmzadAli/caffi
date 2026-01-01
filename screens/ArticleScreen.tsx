import React from "react";
import { View, StyleSheet, Text, Pressable, ScrollView, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { HistoryStackParamList } from "@/navigation/HistoryStackNavigator";

type ArticleRouteProp = RouteProp<HistoryStackParamList, "Article">;

export default function ArticleScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ArticleRouteProp>();
  const insets = useSafeAreaInsets();
  const { article } = route.params;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          Information Hub
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Image source={{ uri: article.image }} style={styles.articleImage} />
        <Text style={[styles.title, { color: theme.text }]}>{article.title}</Text>
        
        <Text style={[styles.content, { color: theme.text }]}>
          {article.content}
        </Text>

        <View style={[styles.referencesContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.referencesTitle, { color: theme.text }]}>References</Text>
          {article.references.map((ref, idx) => (
            <Text key={idx} style={[styles.referenceItem, { color: theme.mutedGrey }]}>
              {idx + 1}. {ref}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
  articleImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xl,
    lineHeight: 32,
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: Spacing.xl,
  },
  referencesContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  referencesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  referenceItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
});
