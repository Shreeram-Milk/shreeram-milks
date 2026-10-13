import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "../src/components/atoms/ThemedText";
import { ListCard, ListRow } from "../src/components/molecules/ListRow";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { usePolicies } from "../src/hooks/useContent";
import { InvoiceIcon } from "../src/icons/appIcons";
import { formatPolicyDate, localized } from "../src/lib/contentLocalization";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";

/** Legal & policies: the published terms, privacy policy and so on. Each opens on its own screen. */
export default function PoliciesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data: policies = [], isError, isLoading, refetch } = usePolicies();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("policies.title")} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.lg, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}>
          <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("policies.intro")}</ThemedText>
          {isLoading ? (
            <StateMessage type="loading" title={t("policies.loading")} />
          ) : isError ? (
            <StateMessage type="error" title={t("policies.errorTitle")} description={t("policies.errorDetail")} actionLabel={t("common.retry")} onAction={() => refetch()} />
          ) : policies.length === 0 ? (
            <StateMessage type="empty" title={t("policies.emptyTitle")} description={t("policies.emptyDetail")} />
          ) : (
            <ListCard>
              {policies.map((policy, position) => (
                <ListRow
                  key={policy.id}
                  icon={InvoiceIcon}
                  title={localized(policy.titleEn, policy.titleGu, language)}
                  subtitle={`${t("policies.version", { version: policy.version })} · ${t("policies.effective", { date: formatPolicyDate(policy.effectiveDate, language) })}`}
                  isLast={position === policies.length - 1}
                  onPress={() => router.push({ pathname: "/policy-details", params: { type: policy.type } })}
                />
              ))}
            </ListCard>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
