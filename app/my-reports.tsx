import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/atoms/Button";
import { ListCard, ListRow } from "../src/components/molecules/ListRow";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useSupportCategories } from "../src/hooks/useContent";
import { useMyTickets } from "../src/hooks/useSupport";
import { FlagIcon } from "../src/icons/appIcons";
import { localized } from "../src/lib/contentLocalization";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";

/** The customer's own reports, newest activity first. Tap one to read your team's replies and answer. */
export default function MyReportsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data: tickets, isLoading, isError, error, refetch, isRefetching } = useMyTickets();
  const { data: topics = [] } = useSupportCategories();
  const topicName = (id: string) => {
    const topic = topics.find((item) => item.id === id);
    return topic ? localized(topic.labelEn, topic.labelGu, language) : id;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("myReports.title")} />
        <ScrollView
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}
        >
          {isLoading ? (
            <StateMessage type="loading" title={t("myReports.loading")} />
          ) : isError ? (
            <StateMessage type="error" title={t("myReports.errorTitle")} description={describeError(error)} actionLabel={t("common.retry")} onAction={() => void refetch()} />
          ) : !tickets || tickets.length === 0 ? (
            <StateMessage type="empty" icon={FlagIcon} title={t("myReports.emptyTitle")} description={t("myReports.emptyDetail")} actionLabel={t("myReports.report")} onAction={() => router.push("/report-issue")} />
          ) : (
            <>
              <ListCard>
                {tickets.map((ticket, position) => (
                  <ListRow
                    key={ticket.id}
                    icon={FlagIcon}
                    title={`${ticket.reference} · ${topicName(ticket.category)}`}
                    subtitle={t(`myReports.status.${ticket.status}`)}
                    isLast={position === tickets.length - 1}
                    onPress={() => router.push({ pathname: "/my-report", params: { id: ticket.id } })}
                  />
                ))}
              </ListCard>
              <Button variant="secondary" onPress={() => router.push("/report-issue")}>{t("myReports.report")}</Button>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
