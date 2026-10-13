import Constants from "expo-constants";
import * as Linking from "expo-linking";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppConfig } from "../../hooks/useContent";
import { isVersionBelow, localized } from "../../lib/contentLocalization";
import { useAppStore } from "../../store/useAppStore";
import { useTheme } from "../../theme";
import type { AppConfig } from "../../types/content";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";

function Notice({ title, detail, children }: PropsWithChildren<{ title: string; detail: string }>) {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.md, padding: theme.spacing.lg }}>
        <ThemedText variant="h1" weight="extrabold">{title}</ThemedText>
        <ThemedText variant="body" style={{ color: theme.colors.colorTextSecondary }}>{detail}</ThemedText>
        {children}
      </View>
    </SafeAreaView>
  );
}

function contactActions(config: AppConfig, t: (key: string) => string) {
  const actions: { label: string; url: string }[] = [];
  if (config.callEnabled && config.supportPhone) actions.push({ label: t("availability.callSupport"), url: `tel:${config.supportPhone}` });
  if (config.supportEmail) actions.push({ label: t("availability.emailSupport"), url: `mailto:${config.supportEmail}` });
  return actions;
}

/**
 * Stands in front of the whole app. The admin can switch the app off for maintenance, or require a newer version.
 * While the settings are still loading, or if they cannot be read, the app opens normally: a slow connection must
 * never lock customers out.
 */
export function AvailabilityGate({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const { data: config } = useAppConfig();
  const language = useAppStore((state) => state.language);
  if (!config) return <>{children}</>;

  if (config.maintenanceMode) {
    const message = localized(config.maintenanceMessageEn, config.maintenanceMessageGu, language);
    return (
      <Notice title={t("availability.maintenanceTitle")} detail={message || t("availability.maintenanceFallback")}>
        {config.showMaintenanceContact
          ? contactActions(config, t).map((action) => (
              <Button key={action.url} variant="secondary" onPress={() => { Linking.openURL(action.url).catch(() => undefined); }}>{action.label}</Button>
            ))
          : null}
      </Notice>
    );
  }

  const version = Constants.expoConfig?.version ?? "0.0.0";
  if (isVersionBelow(version, config.minimumAppVersion)) {
    const packageName = Constants.expoConfig?.android?.package;
    return (
      <Notice title={t("availability.updateTitle")} detail={t("availability.updateDetail")}>
        {Platform.OS === "android" && packageName ? (
          <Button onPress={() => { Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`).catch(() => undefined); }}>{t("availability.updateAction")}</Button>
        ) : null}
      </Notice>
    );
  }
  return <>{children}</>;
}
