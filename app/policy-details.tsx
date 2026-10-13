import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "../src/components/atoms/ThemedText";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { usePolicies } from "../src/hooks/useContent";
import { formatPolicyDate, localized } from "../src/lib/contentLocalization";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";

/** One policy, read in full. A blank line in the text starts a new paragraph. */
export default function PolicyDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { type } = useLocalSearchParams<{ type?: string }>();
  const { data: policies = [], isLoading } = usePolicies();
  const policy = policies.find((item) => item.type === type);
  const title = policy ? localized(policy.titleEn, policy.titleGu, language) : t("policies.title");
  const paragraphs = policy ? localized(policy.bodyEn, policy.bodyGu, language).split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={title} />
        {isLoading ? (
          <StateMessage type="loading" title={t("policies.loading")} />
        ) : !policy ? (
          <StateMessage type="empty" title={t("policies.missingTitle")} description={t("policies.missingDetail")} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
              {t("policies.version", { version: policy.version })} · {t("policies.effective", { date: formatPolicyDate(policy.effectiveDate, language) })}
            </ThemedText>
            {paragraphs.map((paragraph, position) => (
              <ThemedText key={position} variant="body">{paragraph}</ThemedText>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
