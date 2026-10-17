import { router } from "expo-router";
import type { Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon, type IconSvgElement, type IconTone } from "../../src/components/atoms/AppIcon";
import { Avatar } from "../../src/components/atoms/Avatar";
import { Card } from "../../src/components/atoms/Card";
import { IconButton } from "../../src/components/atoms/IconButton";
import { PressableScale } from "../../src/components/atoms/PressableScale";
import { RiseIn } from "../../src/components/atoms/RiseIn";
import { ThemedText } from "../../src/components/atoms/ThemedText";
import { useFeatureFlags } from "../../src/hooks/useContent";
import { AccountMenuRow } from "../../src/components/molecules/AccountMenuRow";
import { CalendarIcon, EditIcon, FlagIcon, HelpIcon, InvoiceIcon, LocationIcon, RepeatIcon, SettingsIcon, ShieldIcon, SupportIcon, WalletIcon } from "../../src/icons/appIcons";
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

/** The three places customers open most, one tap away. */
function QuickTile({ href, icon, label, tone, tint }: { href: Href; icon: IconSvgElement; label: string; tone: IconTone; tint: string }) {
  const theme = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(href)} containerStyle={{ flex: 1 }} style={{ alignItems: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.md - 2, paddingHorizontal: theme.spacing.xs, borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface, ...theme.elevation.card }}>
      <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md, backgroundColor: tint }}>
        <AppIcon icon={icon} accessibilityLabel="" tone={tone} size="sm" />
      </View>
      <ThemedText variant="caption" weight="bold" numberOfLines={2} style={{ textAlign: "center" }}>{label}</ThemedText>
    </PressableScale>
  );
}

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
        <RiseIn index={0}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4 }}>
            <Avatar initials={profile.fullName.slice(0, 2).toUpperCase()} size="lg" />
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText variant="body" weight="extrabold" numberOfLines={2}>{profile.fullName}</ThemedText>
              <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{profile.contact}</ThemedText>
            </View>
            <IconButton icon={EditIcon} label={t("profile.editProfile")} onPress={() => router.push("/edit-profile")} />
          </Card>
        </RiseIn>
        <RiseIn index={1} style={{ flexDirection: "row", gap: theme.spacing.sm + 2 }}>
          <QuickTile href="/orders" icon={InvoiceIcon} label={t("profile.orderHistory")} tone="brand" tint={theme.colors.colorPrimaryTint} />
          <QuickTile href="/delivery-calendar" icon={CalendarIcon} label={t("profile.deliveryCalendar")} tone="accent" tint={theme.colors.colorAccentTint} />
          <QuickTile href="/delivery-addresses" icon={LocationIcon} label={t("profile.addresses")} tone="highlight" tint={theme.colors.colorHighlightTint} />
        </RiseIn>
        <RiseIn index={2}>
          <ProfileSection title={t("profile.deliverySection")}>
            <AccountMenuRow icon={RepeatIcon} tone="accent" onPress={() => router.navigate("/subscriptions")} subtitle={t("profile.subscriptionsSubtitle")} title={t("profile.subscriptions")} />
            {flags.showOffers ? <AccountMenuRow icon={WalletIcon} tone="highlight" onPress={() => router.push("/offers")} subtitle={t("offers.entryDetail")} title={t("offers.entry")} /> : null}
            <AccountMenuRow icon={ShieldIcon} onPress={() => router.push("/doorstep-instructions")} isLast subtitle={t("profile.instructionsSubtitle")} title={t("profile.instructions")} />
          </ProfileSection>
        </RiseIn>
        <RiseIn index={3}>
          <ProfileSection title={t("profile.supportSection")}>
            <AccountMenuRow icon={SettingsIcon} onPress={() => router.push("/settings")} subtitle={t("profile.settingsSubtitle")} title={t("profile.settings")} />
            <AccountMenuRow icon={HelpIcon} onPress={() => router.push("/help")} subtitle={t("profile.helpSubtitle")} title={t("profile.help")} />
            <AccountMenuRow icon={FlagIcon} onPress={() => router.push("/report-issue")} subtitle={t("profile.reportSubtitle")} title={t("profile.report")} />
            <AccountMenuRow icon={InvoiceIcon} onPress={() => router.push("/policies")} subtitle={t("profile.legalSubtitle")} title={t("profile.legal")} />
            <AccountMenuRow icon={SupportIcon} onPress={() => router.push("/support")} isLast subtitle={t("profile.supportSubtitle")} title={t("profile.support")} />
          </ProfileSection>
        </RiseIn>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextDisabled, textAlign: "center" }}>{t("profile.version", { version: APP_VERSION })}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextDisabled, textAlign: "center" }}>{t("credits.geonames")}</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}
