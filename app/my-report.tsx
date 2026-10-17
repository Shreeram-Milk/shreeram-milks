import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppInput } from "../src/components/atoms/AppInput";
import { Badge } from "../src/components/atoms/Badge";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useMyTicket, useReplyToTicket } from "../src/hooks/useSupport";
import { describeError } from "../src/services/errorMapper";
import { useToast } from "../src/providers/ToastProvider";
import { useTheme } from "../src/theme";
import type { TicketStatus } from "../src/types/support";

const MAX_LENGTH = 1000;
const BADGE: Record<TicketStatus, "info" | "warning" | "success" | "default"> = { open: "warning", in_progress: "info", resolved: "success", closed: "default" };

/** One report: the conversation with your team, and a box to add more while it is still open. */
export default function MyReportScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const ticketId = typeof id === "string" ? id : "";
  const { data: thread, isLoading, isError, error, refetch } = useMyTicket(ticketId);
  const reply = useReplyToTicket(ticketId);
  const [draft, setDraft] = useState("");
  const trimmed = draft.trim();

  const { showToast } = useToast();
  const send = () => reply.mutate(trimmed, { onSuccess: () => { setDraft(""); showToast(t("toast.messageSent")); } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={thread?.ticket.reference ?? t("myReports.title")} />
        {isLoading ? (
          <StateMessage type="loading" title={t("myReports.loading")} />
        ) : isError || !thread ? (
          <StateMessage type="error" title={t("myReports.errorTitle")} description={describeError(error)} actionLabel={t("common.retry")} onAction={() => void refetch()} />
        ) : (
          <>
            <KeyboardAwareScrollView mode="layout" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md }}>
              <Badge variant={BADGE[thread.ticket.status]}>{t(`myReports.status.${thread.ticket.status}`)}</Badge>
              {thread.messages.map((message) => {
                const mine = message.author === "customer";
                return (
                  <View key={message.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "88%", gap: theme.spacing.xs }}>
                    <View style={{ padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: mine ? theme.colors.colorPrimaryTint : theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
                      <ThemedText variant="bodySmall">{message.body}</ThemedText>
                    </View>
                    <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, alignSelf: mine ? "flex-end" : "flex-start" }}>
                      {mine ? t("myReports.you") : t("myReports.support")} · {new Date(message.createdAt).toLocaleString()}
                    </ThemedText>
                  </View>
                );
              })}
            </KeyboardAwareScrollView>
            {thread.ticket.status === "closed" ? (
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textAlign: "center", paddingVertical: theme.spacing.md }}>{t("myReports.closedNote")}</ThemedText>
            ) : (
              <View style={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.md }}>
                {reply.error ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(reply.error)}</ThemedText> : null}
                <AppInput accessibilityLabel={t("myReports.replyLabel")} maxLength={MAX_LENGTH} multiline onChangeText={setDraft} placeholder={t("myReports.replyPlaceholder")} style={{ minHeight: theme.sizes.inputHeight * 2, paddingTop: theme.spacing.md, textAlignVertical: "top" }} value={draft} />
                <Button disabled={trimmed.length === 0} loading={reply.isPending} onPress={send}>{t("myReports.send")}</Button>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
