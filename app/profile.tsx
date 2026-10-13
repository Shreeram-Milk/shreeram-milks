import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Avatar } from "../src/components/atoms/Avatar";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { AccountMenuRow } from "../src/components/molecules/AccountMenuRow";
import { BottomNavigation } from "../src/components/organisms/BottomNavigation";
import {
  CalendarIcon,
  CartIcon,
  EditIcon,
  FlagIcon,
  HelpIcon,
  HomeIcon,
  InvoiceIcon,
  LocationIcon,
  ProductsIcon,
  ProfileIcon,
  SettingsIcon,
  ShieldIcon,
  SupportIcon,
} from "../src/icons/appIcons";
import { APP_VERSION } from "../src/lib/appVersion";
import { useTheme } from "../src/theme";
import { formatPhone } from "../src/lib/phone";
import { useSessionStore } from "../src/store/useSessionStore";

function ProfileSection({
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
        weight="semibold"
        style={{
          color: theme.colors.colorTextSecondary,
          paddingHorizontal: theme.spacing.xs,
        }}
      >
        {title}
      </ThemedText>
      <View
        style={{
          overflow: "hidden",
          borderRadius: theme.radii.lg,
          borderWidth: theme.borderWidths.hairline,
          borderColor: theme.colors.colorBorder,
          backgroundColor: theme.colors.colorSurface,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const customer = useSessionStore((state) => state.customer);
  const profile = { fullName: customer?.name || t("account.guest"), phone: formatPhone(customer?.phone ?? "") };
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenHorizontalPadding,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <ThemedText variant="h1">{t("profile.title")}</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("profile.openSettings")}
            hitSlop={theme.spacing.sm}
            onPress={() => router.push("/settings")}
            style={{
              width: theme.layout.touchTargetMin,
              height: theme.layout.touchTargetMin,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              icon={SettingsIcon}
              accessibilityLabel=""
              tone="secondary"
            />
          </Pressable>
        </View>
        <View
          style={{
            padding: theme.spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.colorSurface,
            ...theme.elevation.sm,
          }}
        >
          <Avatar
            initials={profile.fullName.slice(0, 2).toUpperCase()}
            size="lg"
          />
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.xs,
              }}
            >
              <ThemedText variant="body" weight="bold" numberOfLines={2}>
                {profile.fullName}
              </ThemedText>
              <Pressable accessibilityRole="button" accessibilityLabel={t("profile.editProfile")} hitSlop={theme.spacing.sm} onPress={() => router.push("/edit-profile")} style={{ width: theme.layout.touchTargetMin, height: theme.layout.touchTargetMin, alignItems: "center", justifyContent: "center" }}><AppIcon icon={EditIcon} accessibilityLabel="" size="sm" tone="secondary" /></Pressable>
            </View>
            <ThemedText
              variant="bodySmall"
              weight="regular"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {profile.phone}
            </ThemedText>
          </View>
        </View>
        <ProfileSection title={t("profile.ordersSection")}>
          <AccountMenuRow
            icon={CalendarIcon}
            onPress={() => router.push("/subscriptions")}
            subtitle={t("profile.subscriptionsSubtitle")}
            title={t("profile.subscriptions")}
          />
          <AccountMenuRow
            icon={InvoiceIcon}
            onPress={() => router.push("/orders")}
            subtitle={t("profile.ordersSubtitle")}
            title={t("profile.orderHistory")}
          />
          <AccountMenuRow
            icon={CalendarIcon}
            onPress={() => router.push("/delivery-calendar")}
            isLast
            subtitle={t("profile.calendarSubtitle")}
            title={t("profile.deliveryCalendar")}
          />
        </ProfileSection>
        <ProfileSection title={t("profile.deliverySection")}>
          <AccountMenuRow
            icon={LocationIcon}
            onPress={() => router.push("/delivery-addresses")}
            subtitle={t("profile.addressSubtitle")}
            title={t("profile.addresses")}
          />
          <AccountMenuRow
            icon={ShieldIcon}
            onPress={() => router.push("/doorstep-instructions")}
            isLast
            subtitle={t("profile.instructionsSubtitle")}
            title={t("profile.instructions")}
          />
        </ProfileSection>
        <ProfileSection title={t("profile.supportSection")}>
          <AccountMenuRow
            icon={SettingsIcon}
            onPress={() => router.push("/settings")}
            subtitle={t("profile.settingsSubtitle")}
            title={t("profile.settings")}
          />
          <AccountMenuRow
            icon={HelpIcon}
            onPress={() => router.push("/help")}
            subtitle={t("profile.helpSubtitle")}
            title={t("profile.help")}
          />
          <AccountMenuRow
            icon={FlagIcon}
            onPress={() => router.push("/report-issue")}
            subtitle={t("profile.reportSubtitle")}
            title={t("profile.report")}
          />
          <AccountMenuRow
            icon={InvoiceIcon}
            onPress={() => router.push("/policies")}
            subtitle={t("profile.legalSubtitle")}
            title={t("profile.legal")}
          />
          <AccountMenuRow
            icon={SupportIcon}
            onPress={() => router.push("/support")}
            subtitle={t("profile.supportSubtitle")}
            title={t("profile.support")}
          />
        </ProfileSection>
        <ThemedText
          variant="caption"
          style={{ color: theme.colors.colorTextDisabled, textAlign: "center" }}
        >
          {t("profile.version", { version: APP_VERSION })}
        </ThemedText>
      </ScrollView>
      <BottomNavigation
        activeKey="profile"
        onChange={(key) => {
          if (key === "home") router.replace("/home");
          if (key === "products") router.replace("/products");
          if (key === "subscriptions") router.replace("/subscriptions");
          if (key === "cart") router.replace("/cart");
        }}
        items={[
          { key: "home", label: t("navigation.home"), icon: HomeIcon },
          {
            key: "products",
            label: t("navigation.products"),
            icon: ProductsIcon,
          },
          {
            key: "subscriptions",
            label: t("navigation.subscriptions"),
            icon: CalendarIcon,
          },
          { key: "cart", label: t("navigation.cart"), icon: CartIcon },
          { key: "profile", label: t("navigation.profile"), icon: ProfileIcon },
        ]}
      />
    </SafeAreaView>
  );
}
