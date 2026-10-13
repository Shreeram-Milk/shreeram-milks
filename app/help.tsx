import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "../src/components/atoms/Chip";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { FaqItem } from "../src/components/molecules/FaqItem";
import { ListCard, ListRow } from "../src/components/molecules/ListRow";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { SearchField } from "../src/components/molecules/SearchField";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useFaqs, useSupportCategories } from "../src/hooks/useContent";
import { FlagIcon, SupportIcon } from "../src/icons/appIcons";
import { localized } from "../src/lib/contentLocalization";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { FaqItem as Faq, SupportCategoryId } from "../src/types/content";

const matches = (faq: Faq, needle: string) =>
  [faq.questionEn, faq.questionGu, faq.answerEn, faq.answerGu, ...faq.searchKeywords].join(" ").toLowerCase().includes(needle);

/** Help: answers to common questions about the app, with search and topics. Contact and reporting live on their own screens. */
export default function HelpScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data: faqs = [], isError, isLoading, refetch } = useFaqs();
  const { data: topics = [] } = useSupportCategories();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<SupportCategoryId | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const needle = query.trim().toLowerCase();
  const searching = needle.length > 0;
  const visible = useMemo(() => faqs.filter((faq) => (!topic || faq.topic === topic) && (!searching || matches(faq, needle))), [faqs, topic, searching, needle]);
  // With no search and no topic chosen, show the questions the admin marked as popular (or all, if none are marked).
  const popular = visible.filter((faq) => faq.featured);
  const shown = !searching && !topic && popular.length > 0 ? popular : visible;
  const activeTopic = topics.find((item) => item.id === topic);
  const heading = searching ? t("help.resultsFor", { query: query.trim() }) : activeTopic ? localized(activeTopic.labelEn, activeTopic.labelGu, language) : t("help.popular");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("help.title")} />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.lg, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}>
          <SearchField clearLabel={t("help.clear")} label={t("help.searchLabel")} onChangeText={setQuery} placeholder={t("help.searchPlaceholder")} value={query} />
          {topics.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
              <Chip selected={topic === null} onPress={() => setTopic(null)}>{t("help.allTopics")}</Chip>
              {topics.map((item) => (
                <Chip key={item.id} selected={topic === item.id} onPress={() => setTopic(topic === item.id ? null : item.id)}>
                  {localized(item.labelEn, item.labelGu, language)}
                </Chip>
              ))}
            </ScrollView>
          ) : null}

          {isLoading ? (
            <StateMessage type="loading" title={t("help.loading")} />
          ) : isError ? (
            <StateMessage type="error" title={t("help.errorTitle")} description={t("help.errorDetail")} actionLabel={t("common.retry")} onAction={() => refetch()} />
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              <ThemedText variant="overline" style={{ color: theme.colors.colorTextSecondary }}>{heading}</ThemedText>
              {shown.length > 0 ? (
                <ListCard>
                  {shown.map((faq, position) => (
                    <FaqItem
                      key={faq.id}
                      question={localized(faq.questionEn, faq.questionGu, language)}
                      answer={localized(faq.answerEn, faq.answerGu, language)}
                      expanded={openId === faq.id}
                      isLast={position === shown.length - 1}
                      onPress={() => setOpenId(openId === faq.id ? null : faq.id)}
                    />
                  ))}
                </ListCard>
              ) : (
                <StateMessage type="empty" title={t("help.emptyTitle")} description={t("help.emptyDetail")} />
              )}
            </View>
          )}

          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="overline" style={{ color: theme.colors.colorTextSecondary }}>{t("help.stillNeed")}</ThemedText>
            <ListCard>
              <ListRow icon={SupportIcon} title={t("help.contactSupport")} subtitle={t("help.contactSupportDetail")} onPress={() => router.push("/support")} />
              <ListRow icon={FlagIcon} isLast title={t("help.reportIssue")} subtitle={t("help.reportIssueDetail")} onPress={() => router.push("/report-issue")} />
            </ListCard>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
