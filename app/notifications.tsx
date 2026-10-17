import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon, type IconSvgElement } from "../src/components/atoms/AppIcon";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useMarkNotificationsRead, useMyNotifications } from "../src/hooks/useNotifications";
import { AlertsIcon, CalendarIcon, SuccessIcon, TruckIcon, WalletIcon } from "../src/icons/appIcons";
import { timeAgoLabel } from "../src/lib/timeAgo";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { AppNotification } from "../src/types/notifications";

const ICONS: Record<string, IconSvgElement> = {
  out_for_delivery: TruckIcon,
  delivered: SuccessIcon,
  day_skipped: CalendarIcon,
  credit_limit_reached: WalletIcon,
  payment_requested: WalletIcon,
  refund_sent: WalletIcon,
};

/** The customer's messages: what happened to their orders and money, and notices from the team. Tap one to open what it is about. */
export default function NotificationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { data, isLoading, isError, error, refetch, isRefetching } = useMyNotifications();
  const { one, all } = useMarkNotificationsRead();
  // The "5 min ago" labels keep up with the clock while the screen stays open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const unread = data?.unread ?? 0;

  const open = (item: AppNotification) => {
    if (!item.readAt) one.mutate(item.id);
    if (item.link) router.push(item.link as Href);
  };

  if (isLoading || isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
        <StateMessage
          type={isError ? "error" : "loading"}
          title={isError ? t("inbox.error") : t("inbox.loading")}
          description={isError ? describeError(error) : undefined}
          actionLabel={isError ? t("common.retry") : undefined}
          onAction={isError ? () => void refetch() : undefined}
        />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={data?.notifications ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        contentContainerStyle={{ padding: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.xxl, gap: theme.spacing.sm }}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
            <ScreenHeader backLabel={t("inbox.back")} title={t("inbox.title")} />
            {unread > 0 ? (
              <Pressable accessibilityRole="button" disabled={all.isPending} onPress={() => all.mutate()} style={{ alignSelf: "flex-end", paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm }}>
                <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorPrimary }}>{t("inbox.markAllRead")}</ThemedText>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={<StateMessage type="empty" icon={AlertsIcon} title={t("inbox.emptyTitle")} description={t("inbox.emptyDetail")} />}
        renderItem={({ item }) => {
          const title = language === "gu" && item.titleGu ? item.titleGu : item.title;
          const body = language === "gu" && item.bodyGu ? item.bodyGu : item.body;
          const isUnread = !item.readAt;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${title}. ${body}`}
              onPress={() => open(item)}
              style={({ pressed }) => ({ flexDirection: "row", gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: isUnread ? theme.colors.colorSuccessTint : theme.colors.colorSurface, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}
            >
              <View style={{ width: theme.sizes.avatarMd, height: theme.sizes.avatarMd, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorSurface }}>
                <AppIcon icon={ICONS[item.event] ?? AlertsIcon} accessibilityLabel="" size="sm" tone={isUnread ? "success" : "secondary"} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}>
                  <ThemedText variant="bodySmall" weight={isUnread ? "bold" : "semibold"} numberOfLines={1} style={{ flex: 1 }}>{title}</ThemedText>
                  <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{timeAgoLabel(item.createdAt, now, language, t)}</ThemedText>
                </View>
                <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{body}</ThemedText>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
