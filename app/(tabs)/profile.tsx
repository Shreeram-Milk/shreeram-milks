import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../../src/components/atoms/AppIcon";
import { IconButton } from "../../src/components/atoms/IconButton";
import { PressableScale } from "../../src/components/atoms/PressableScale";
import { RiseIn } from "../../src/components/atoms/RiseIn";
import { ThemedText } from "../../src/components/atoms/ThemedText";
import { useAppConfig, useFeatureFlags } from "../../src/hooks/useContent";
import { useMyRewards } from "../../src/hooks/useRewards";
import { useMyWallet } from "../../src/hooks/useWallet";
import { AccountMenuRow } from "../../src/components/molecules/AccountMenuRow";
import { LanguageToggle } from "../../src/components/molecules/LanguageToggle";
import { CalendarIcon, EditIcon, ForwardIcon, GiftIcon, HelpIcon, InvoiceIcon, LocationIcon, RepeatIcon, SettingsIcon, WalletIcon } from "../../src/icons/appIcons";
import { FSSAI_NUMBER } from "../../src/lib/business";
import { APP_VERSION } from "../../src/lib/appVersion";
import { formatRupees } from "../../src/lib/catalogCart";
import { useSessionStore } from "../../src/store/useSessionStore";
import { useTheme } from "../../src/theme";

const AVATAR = 56;

function ProfileSection({ children, title }: { children: React.ReactNode; title: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm + 2 }}>
      <ThemedText accessibilityRole="header" variant="h2" style={{ paddingHorizontal: theme.spacing.xs }}>{title}</ThemedText>
      <View style={{ overflow: "hidden", borderRadius: theme.radii.xl, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>{children}</View>
    </View>
  );
}

/** The wallet as one card: the balance and a way in. Its history lives on the Wallet page, not here. */
function WalletCard() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data } = useMyWallet();
  // A pay-later customer with nothing in the wallet has no use for it; one with a balance left still sees it to get it back.
  if (!data || (!data.enabled && data.balancePaise === 0)) return null;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${t("wallet.entry")}. ${t("wallet.entryDetail", { amount: formatRupees(data.balancePaise) })}`}
      onPress={() => router.push("/wallet")}
      style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md + 2, borderRadius: theme.radii.xl, backgroundColor: theme.colors.colorPrimary }}
    >
      <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorBrand }}>
        <AppIcon icon={WalletIcon} accessibilityLabel="" size="md" color={theme.colors.colorPrimary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText variant="label" style={{ color: theme.colors.colorNavigationText }}>{t("wallet.entry")}</ThemedText>
        <ThemedText variant="h1" style={{ color: theme.colors.colorTextInverse, fontVariant: ["tabular-nums"] }}>{formatRupees(data.balancePaise)}</ThemedText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
        {data.enabled ? <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorTextInverse }}>{t("wallet.addMoneyLink")}</ThemedText> : null}
        <AppIcon icon={ForwardIcon} accessibilityLabel="" size="sm" color={theme.colors.colorTextInverse} />
      </View>
    </PressableScale>
  );
}

/**
 * Account: who is signed in, the wallet, the language, everything about orders and delivery, and help. The options are the same
 * as before the redesign. Notifications, doorstep instructions, policies, sign out and account deletion are in Settings (the gear).
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const customer = useSessionStore((state) => state.customer);
  const flags = useFeatureFlags();
  const { data: config } = useAppConfig();
  const { data: rewards } = useMyRewards();
  // Scratch cards show once rewards are switched on, or when the customer already holds some.
  const showRewards = Boolean(config?.rewardsEnabled) || (rewards?.length ?? 0) > 0;
  const profile = { fullName: customer?.name || t("account.guest"), contact: customer?.email ?? "" };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xl, gap: theme.spacing.lg }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <ThemedText accessibilityRole="header" variant="display" weight="semibold">{t("profile.title")}</ThemedText>
          <IconButton icon={SettingsIcon} label={t("profile.openSettings")} filled onPress={() => router.push("/settings")} />
        </View>

        <RiseIn index={0} style={{ gap: theme.spacing.md - 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 2 }}>
            <View style={{ width: AVATAR, height: AVATAR, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorBrandTint }}>
              <ThemedText variant="h2" style={{ color: theme.colors.colorBrandText }}>{profile.fullName.slice(0, 1).toUpperCase()}</ThemedText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText variant="h2" numberOfLines={2}>{profile.fullName}</ThemedText>
              {profile.contact ? <ThemedText variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.colorTextSecondary }}>{profile.contact}</ThemedText> : null}
            </View>
            <IconButton icon={EditIcon} label={t("profile.editProfile")} onPress={() => router.push("/edit-profile")} />
          </View>
          <WalletCard />
          <LanguageToggle />
        </RiseIn>

        <RiseIn index={1}>
          <ProfileSection title={t("profile.orderSection")}>
            <AccountMenuRow icon={InvoiceIcon} tone="brand" onPress={() => router.push("/orders")} subtitle={t("profile.orderHistorySubtitle")} title={t("profile.orderHistory")} />
            <AccountMenuRow icon={CalendarIcon} tone="accent" onPress={() => router.push("/delivery-calendar")} subtitle={t("profile.calendarSubtitle")} title={t("profile.deliveryCalendar")} />
            <AccountMenuRow icon={LocationIcon} tone="highlight" onPress={() => router.push("/delivery-addresses")} subtitle={t("profile.addressSubtitle")} title={t("profile.addresses")} />
            <AccountMenuRow icon={RepeatIcon} tone="accent" onPress={() => router.navigate("/subscriptions")} subtitle={t("profile.subscriptionsSubtitle")} title={t("profile.subscriptions")} isLast={!flags.showOffers && !showRewards} />
            {flags.showOffers ? <AccountMenuRow icon={WalletIcon} tone="highlight" onPress={() => router.push("/offers")} subtitle={t("offers.entryDetail")} title={t("offers.entry")} isLast={!showRewards} /> : null}
            {showRewards ? <AccountMenuRow icon={GiftIcon} tone="brand" onPress={() => router.push("/rewards")} subtitle={t("rewards.entryDetail")} title={t("rewards.title")} isLast /> : null}
          </ProfileSection>
        </RiseIn>

        <RiseIn index={2}>
          <ProfileSection title={t("profile.helpSection")}>
            <AccountMenuRow icon={HelpIcon} onPress={() => router.push("/support")} isLast subtitle={t("profile.helpSupportSubtitle")} title={t("profile.helpSupport")} />
          </ProfileSection>
        </RiseIn>

        <View style={{ gap: theme.spacing.xs, alignItems: "center", paddingTop: theme.spacing.sm }}>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t("profile.moreInSettings")}</ThemedText>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextDisabled, textAlign: "center" }}>{t("profile.version", { version: APP_VERSION })}</ThemedText>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextDisabled, textAlign: "center" }}>{t("credits.geonames")}</ThemedText>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextDisabled, textAlign: "center" }}>{t("profile.fssai", { number: FSSAI_NUMBER })}</ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
