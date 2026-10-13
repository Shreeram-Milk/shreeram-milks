import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppInput } from "../src/components/atoms/AppInput";
import { Button } from "../src/components/atoms/Button";
import { IconBadge } from "../src/components/atoms/IconBadge";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ListCard, ListRow } from "../src/components/molecules/ListRow";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useSupportCategories } from "../src/hooks/useContent";
import { useSubmitIssueReport } from "../src/hooks/useSupport";
import { SuccessIcon } from "../src/icons/appIcons";
import { localized } from "../src/lib/contentLocalization";
import { supportTopicIcon } from "../src/lib/supportIcons";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { SupportCategoryId } from "../src/types/content";

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

/** Report an issue: choose what went wrong, optionally which order, and describe it. Contact details live on Support. */
export default function ReportIssueScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data: topics = [], isLoading: topicsLoading, isError: topicsError, refetch } = useSupportCategories();
  const report = useSubmitIssueReport();
  const [topic, setTopic] = useState<SupportCategoryId | null>(null);
  const [description, setDescription] = useState("");

  const trimmed = description.trim();
  const canSend = topic !== null && trimmed.length >= MIN_LENGTH && !report.isPending;

  if (report.isSuccess) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.lg }}>
          <IconBadge icon={SuccessIcon} size="lg" tone="success" />
          <ThemedText variant="h2" style={{ textAlign: "center" }}>{t("reportIssue.successTitle")}</ThemedText>
          <ThemedText variant="body" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t("reportIssue.successDetail")}</ThemedText>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("reportIssue.reference", { reference: report.data.reference })}</ThemedText>
          <View style={{ alignSelf: "stretch", gap: theme.spacing.sm, paddingTop: theme.spacing.md }}>
            <Button onPress={() => router.replace({ pathname: "/my-report", params: { id: report.data.id } })}>{t("reportIssue.viewReport")}</Button>
            <Button variant="secondary" onPress={() => router.replace("/home")}>{t("reportIssue.backHome")}</Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("reportIssue.title")} />
        <KeyboardAwareScrollView mode="layout" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.lg, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}>
          <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("reportIssue.intro")}</ThemedText>

          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="overline" style={{ color: theme.colors.colorTextSecondary }}>{t("reportIssue.stepTopic")}</ThemedText>
            {topicsLoading ? (
              <StateMessage type="loading" title={t("reportIssue.topicsLoading")} />
            ) : topicsError ? (
              <StateMessage type="error" title={t("reportIssue.topicsError")} actionLabel={t("common.retry")} onAction={() => refetch()} />
            ) : (
              <ListCard>
                {topics.map((item, position) => (
                  <ListRow
                    key={item.id}
                    icon={supportTopicIcon(item.iconKey)}
                    title={localized(item.labelEn, item.labelGu, language)}
                    trailing="radio"
                    selected={topic === item.id}
                    isLast={position === topics.length - 1}
                    onPress={() => setTopic(item.id)}
                  />
                ))}
              </ListCard>
            )}
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="overline" style={{ color: theme.colors.colorTextSecondary }}>{t("reportIssue.stepDetails")}</ThemedText>
            <AppInput
              accessibilityLabel={t("reportIssue.detailsLabel")}
              maxLength={MAX_LENGTH}
              multiline
              onChangeText={setDescription}
              placeholder={t("reportIssue.detailsPlaceholder")}
              style={{ minHeight: theme.sizes.inputHeight * 3, paddingTop: theme.spacing.md, textAlignVertical: "top" }}
              value={description}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.sm }}>
              <ThemedText variant="caption" style={{ flex: 1, color: theme.colors.colorTextSecondary }}>{trimmed.length > 0 && trimmed.length < MIN_LENGTH ? t("reportIssue.minimum", { count: MIN_LENGTH }) : ""}</ThemedText>
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("reportIssue.counter", { count: description.length, max: MAX_LENGTH })}</ThemedText>
            </View>
          </View>

          {report.isError ? (
            <View accessibilityLiveRegion="polite" style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorDangerTint }}>
              <ThemedText variant="bodySmall" weight="semibold">{t("reportIssue.failedTitle")}</ThemedText>
              <ThemedText variant="caption">{describeError(report.error)}</ThemedText>
              <Button variant="secondary" onPress={() => router.push("/support")}>{t("reportIssue.contactSupport")}</Button>
            </View>
          ) : null}
        </KeyboardAwareScrollView>
        <View style={{ paddingVertical: theme.spacing.md }}>
          <Button
            disabled={!canSend}
            loading={report.isPending}
            onPress={() => { if (topic) report.mutate({ category: topic, description: trimmed }); }}
          >
            {report.isPending ? t("reportIssue.sending") : t("reportIssue.submit")}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
