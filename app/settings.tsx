import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "../src/components/atoms/Avatar";
import { AppIcon } from "../src/components/atoms/AppIcon";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { AccountMenuRow } from "../src/components/molecules/AccountMenuRow";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import {
  AlertCircleIcon,
  AlertsIcon,
  LogoutIcon,
  EditIcon,
  InvoiceIcon,
  LanguageIcon,
  ShieldIcon,
} from "../src/icons/appIcons";
import { APP_UPDATE_LABEL, APP_VERSION } from "../src/lib/appVersion";
import { useTheme } from "../src/theme";
import { Button } from "../src/components/atoms/Button";
import { ConfirmSheet } from "../src/components/organisms/ConfirmSheet";
import { useDeleteAccount } from "../src/hooks/useCustomerAuth";
import { describeError } from "../src/services/errorMapper";
import { useSessionStore } from "../src/store/useSessionStore";

function SettingsGroup({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <ThemedText
        variant="caption"
        weight="bold"
        style={{ color: theme.colors.colorTextSecondary }}
      >
        {title}
      </ThemedText>
      <View
        style={{
          overflow: "hidden",
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.colorSurface,
          ...theme.elevation.sm,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const customer = useSessionStore((state) => state.customer);
  const signOut = useSessionStore((state) => state.signOut);
  const deleteAccount = useDeleteAccount();
  const [confirming, setConfirming] = useState<"signOut" | "delete" | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const profile = { fullName: customer?.name || t("account.guest"), contact: customer?.email ?? "" };
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ paddingHorizontal: theme.layout.screenHorizontalPadding, paddingVertical: theme.spacing.xs }}>
        <ScreenHeader backLabel={t("settings.back")} title={t("settings.title")} />
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: theme.layout.screenHorizontalPadding,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            padding: theme.spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.colorSurface,
            ...theme.elevation.sm,
          }}
        >
          <Avatar initials={profile.fullName.slice(0, 2).toUpperCase()} size="lg" />
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.xs,
              }}
            >
              <ThemedText variant="body" weight="bold">
                {profile.fullName}
              </ThemedText>
            </View>
            <ThemedText
              variant="bodySmall"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {profile.contact}
            </ThemedText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t("profile.editProfile")} hitSlop={theme.spacing.sm} onPress={() => router.push("/edit-profile")} style={{ width: theme.layout.touchTargetMin, height: theme.layout.touchTargetMin, alignItems: "center", justifyContent: "center" }}><AppIcon icon={EditIcon} accessibilityLabel="" tone="secondary" size="sm" /></Pressable>
        </View>
        <SettingsGroup title={t("settings.alertsSection")}>
          {/* Delivery and offer alerts are Android notification channels, so the phone's own settings are where they are switched. */}
          <AccountMenuRow
            icon={AlertsIcon}
            isLast
            subtitle={t("settings.notificationsSubtitle")}
            title={t("settings.notifications")}
            onPress={() => void Linking.openSettings()}
          />
        </SettingsGroup>
        <SettingsGroup title={t("settings.deliverySection")}>
          <AccountMenuRow
            icon={ShieldIcon}
            isLast
            subtitle={t("settings.doorstepSubtitle")}
            title={t("settings.doorstep")}
            onPress={() => router.push("/doorstep-instructions")}
          />
        </SettingsGroup>
        <SettingsGroup title={t("settings.accountSection")}>
          <AccountMenuRow
            icon={LanguageIcon}
            subtitle={t("settings.languageSubtitle")}
            title={t("settings.language")}
            trailing={i18n.language === "gu" ? "ગુજરાતી" : "English"}
            onPress={() => router.push("/language")}
          />
          <AccountMenuRow
            icon={InvoiceIcon}
            isLast
            subtitle={t("settings.legalSubtitle")}
            title={t("settings.legal")}
            onPress={() => router.push("/policies")}
          />
        </SettingsGroup>
        <View style={{ gap: theme.spacing.sm }}>
          <Button variant="secondary" onPress={() => setConfirming("signOut")}>
            {t("account.signOut")}
          </Button>
          <Button variant="danger" onPress={() => { deleteAccount.reset(); setConfirming("delete"); }}>
            {t("account.deleteAccount")}
          </Button>
        </View>
        <ThemedText
          variant="caption"
          style={{
            color: theme.colors.colorTextSecondary,
            textAlign: "center",
          }}
        >
          {t("settings.version", { version: APP_VERSION })}
          {APP_UPDATE_LABEL ? `\n${t("settings.update", { update: APP_UPDATE_LABEL })}` : ""}
        </ThemedText>
      </ScrollView>
      <ConfirmSheet
        visible={confirming === "signOut"}
        icon={LogoutIcon}
        title={t("account.signOutTitle")}
        description={t("account.signOutBody")}
        cancelLabel={t("account.stay")}
        confirmLabel={t("account.signOut")}
        loading={signingOut}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setSigningOut(true);
          // Signing out removes the signed-in screens; the app then goes back to the start by itself.
          void signOut();
        }}
      />
      <ConfirmSheet
        visible={confirming === "delete"}
        tone="danger"
        icon={AlertCircleIcon}
        title={t("account.deleteTitle")}
        description={t("account.deleteIntro")}
        consequences={[t("account.deleteLoseDetails"), t("account.deleteSignedOut"), t("account.deleteKeepOrders"), t("account.deleteFinal")]}
        cancelLabel={t("account.keepAccount")}
        confirmLabel={t("account.deleteConfirm")}
        loading={deleteAccount.isPending}
        errorText={deleteAccount.error ? describeError(deleteAccount.error) : undefined}
        onCancel={() => setConfirming(null)}
        onConfirm={() => deleteAccount.mutate(undefined, { onSuccess: () => setConfirming(null) })}
      />
    </SafeAreaView>
  );
}
