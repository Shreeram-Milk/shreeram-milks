import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "../../src/components/atoms/Avatar";
import { Card } from "../../src/components/atoms/Card";
import { IconButton } from "../../src/components/atoms/IconButton";
import { RiseIn } from "../../src/components/atoms/RiseIn";
import { ThemedText } from "../../src/components/atoms/ThemedText";
import { useFeatureFlags } from "../../src/hooks/useContent";
import { AccountMenuRow } from "../../src/components/molecules/AccountMenuRow";
import { LanguageToggle } from "../../src/components/molecules/LanguageToggle";
import { CalendarIcon, EditIcon, HelpIcon, InvoiceIcon, LocationIcon, RepeatIcon, SettingsIcon, WalletIcon } from "../../src/icons/appIcons";
import { FSSAI_NUMBER } from "../../src/lib/business";
import { APP_VERSION } from "../../src/lib/appVersion";
import { useSessionStore } from "../../src/store/useSessionStore";
import { useTheme } from "../../src/theme";

function ProfileSection({ children, title }: { children: React.ReactNode; title: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <ThemedText variant="overline" style={{ color: theme.colors.colorTextSecondary, paddingHorizontal: theme.spacing.xs, textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</ThemedText>
      <Card padded={false} style={{ overflow: "hidden" }}>{children}</Card>
    </View>
  );
}

/**
 * Profile: who is signed in, the language (one tap away), everything about orders and delivery as full-width rows, and one
 * way into help. Notifications, doorstep instructions, policies, sign out and account deletion are in Settings (the gear).
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const customer = useSessionStore((state) => state.customer);
  const flags = useFeatureFlags();
  const profile = { fullName: customer?.name || t("account.guest"), contact: customer?.email ?? "" };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xl, gap: theme.spacing.lg }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <ThemedText variant="h1">{t("profile.title")}</ThemedText>
          <IconButton icon={SettingsIcon} label={t("profile.openSettings")} filled onPress={() => router.push("/settings")} />
        </View>
        <RiseIn index={0} style={{ gap: theme.spacing.sm + 2 }}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4 }}>
            <Avatar initials={profile.fullName.slice(0, 2).toUpperCase()} size="lg" />
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText variant="body" weight="extrabold" numberOfLines={2}>{profile.fullName}</ThemedText>
              <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{profile.contact}</ThemedText>
            </View>
            <IconButton icon={EditIcon} label={t("profile.editProfile")} onPress={() => router.push("/edit-profile")} />
          </Card>
          <LanguageToggle />
        </RiseIn>
        <RiseIn index={1}>
          <ProfileSection title={t("profile.orderSection")}>
            <AccountMenuRow icon={InvoiceIcon} tone="brand" onPress={() => router.push("/orders")} subtitle={t("profile.orderHistorySubtitle")} title={t("profile.orderHistory")} />
            <AccountMenuRow icon={CalendarIcon} tone="accent" onPress={() => router.push("/delivery-calendar")} subtitle={t("profile.calendarSubtitle")} title={t("profile.deliveryCalendar")} />
            <AccountMenuRow icon={LocationIcon} tone="highlight" onPress={() => router.push("/delivery-addresses")} subtitle={t("profile.addressSubtitle")} title={t("profile.addresses")} />
            <AccountMenuRow icon={RepeatIcon} tone="accent" onPress={() => router.navigate("/subscriptions")} subtitle={t("profile.subscriptionsSubtitle")} title={t("profile.subscriptions")} isLast={!flags.showOffers} />
            {flags.showOffers ? <AccountMenuRow icon={WalletIcon} tone="highlight" onPress={() => router.push("/offers")} subtitle={t("offers.entryDetail")} title={t("offers.entry")} isLast /> : null}
          </ProfileSection>
        </RiseIn>
        <RiseIn index={2}>
          <ProfileSection title={t("profile.helpSection")}>
            <AccountMenuRow icon={HelpIcon} onPress={() => router.push("/support")} isLast subtitle={t("profile.helpSupportSubtitle")} title={t("profile.helpSupport")} />
          </ProfileSection>
        </RiseIn>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t("profile.moreInSettings")}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextDisabled, textAlign: "center" }}>{t("profile.version", { version: APP_VERSION })}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextDisabled, textAlign: "center" }}>{t("credits.geonames")}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextDisabled, textAlign: "center" }}>{t("profile.fssai", { number: FSSAI_NUMBER })}</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}
