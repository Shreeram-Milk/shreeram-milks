import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { IconBadge } from "../src/components/atoms/IconBadge";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ListCard, ListRow } from "../src/components/molecules/ListRow";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useAppConfig } from "../src/hooks/useContent";
import { ChatIcon, ClockIcon, FlagIcon, HelpIcon, InvoiceIcon, MailIcon, PhoneIcon, SupportIcon, WhatsAppIcon } from "../src/icons/appIcons";
import { localized } from "../src/lib/contentLocalization";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";

/** Support: every way to reach the team, switched on or off by the admin in App Settings. */
export default function SupportScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data: config, isError, isLoading, refetch } = useAppConfig();
  const [failed, setFailed] = useState(false);

  const open = (url: string) => {
    setFailed(false);
    Linking.openURL(url).catch(() => setFailed(true));
  };
  // A channel is shown only when the admin turned it on and gave it a contact; nothing is ever shown half-set-up.
  const whatsappDigits = config?.whatsappEnabled ? config.supportWhatsApp.replace(/\D/g, "") : "";
  const channels = [
    config?.callEnabled && config.supportPhone ? { key: "call", icon: PhoneIcon, title: t("support.call"), subtitle: config.supportPhone, onPress: () => open(`tel:${config.supportPhone}`) } : null,
    whatsappDigits ? { key: "whatsapp", icon: WhatsAppIcon, title: t("support.whatsapp"), subtitle: t("support.whatsappDetail"), onPress: () => open(`https://wa.me/${whatsappDigits.length === 10 ? `91${whatsappDigits}` : whatsappDigits}`) } : null,
    config?.supportEmail ? { key: "email", icon: MailIcon, title: t("support.email"), subtitle: config.supportEmail, onPress: () => open(`mailto:${config.supportEmail}`) } : null,
    config?.chatEnabled ? { key: "chat", icon: ChatIcon, title: t("support.chat"), subtitle: t("support.chatDetail"), badge: t("support.soon") } : null,
  ].filter((channel): channel is NonNullable<typeof channel> => channel !== null);
  const hours = config ? localized(config.supportHoursEn, config.supportHoursGu, language) : "";
  const afterHours = config ? localized(config.afterHoursMessageEn, config.afterHoursMessageGu, language) : "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("support.title")} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.lg, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}>
          <View style={{ alignItems: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.md }}>
            <IconBadge icon={SupportIcon} size="lg" />
            <ThemedText variant="h2" style={{ textAlign: "center" }}>{t("support.heroTitle")}</ThemedText>
            {hours ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                <AppIcon icon={ClockIcon} accessibilityLabel="" size="sm" tone="secondary" />
                <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("support.hours", { hours })}</ThemedText>
              </View>
            ) : null}
            {afterHours ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{afterHours}</ThemedText> : null}
          </View>

          {isLoading ? (
            <StateMessage type="loading" title={t("support.loading")} />
          ) : isError ? (
            <StateMessage type="error" title={t("support.errorTitle")} description={t("support.errorDetail")} actionLabel={t("common.retry")} onAction={() => refetch()} />
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              <ThemedText variant="overline" style={{ color: theme.colors.colorTextSecondary }}>{t("support.contactTitle")}</ThemedText>
              {channels.length > 0 ? (
                <ListCard>
                  {channels.map((channel, position) => (
                    <ListRow
                      key={channel.key}
                      icon={channel.icon}
                      title={channel.title}
                      subtitle={channel.subtitle}
                      badge={"badge" in channel ? channel.badge : undefined}
                      disabled={!("onPress" in channel)}
                      isLast={position === channels.length - 1}
                      onPress={"onPress" in channel ? channel.onPress : undefined}
                    />
                  ))}
                </ListCard>
              ) : (
                <StateMessage type="empty" title={t("support.noChannels")} />
              )}
              {failed ? <ThemedText variant="caption" style={{ color: theme.colors.colorDanger }}>{t("support.openFailed")}</ThemedText> : null}
            </View>
          )}

          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="overline" style={{ color: theme.colors.colorTextSecondary }}>{t("support.moreTitle")}</ThemedText>
            <ListCard>
              <ListRow icon={HelpIcon} title={t("support.helpCenter")} subtitle={t("support.helpCenterDetail")} onPress={() => router.push("/help")} />
              <ListRow icon={FlagIcon} title={t("support.reportIssue")} subtitle={t("support.reportIssueDetail")} onPress={() => router.push("/report-issue")} />
              <ListRow icon={InvoiceIcon} isLast title={t("support.myReports")} subtitle={t("support.myReportsDetail")} onPress={() => router.push("/my-reports")} />
            </ListCard>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
