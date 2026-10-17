import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Button } from "../src/components/atoms/Button";
import { RiseIn } from "../src/components/atoms/RiseIn";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { OrderStatusBadge } from "../src/components/molecules/OrderStatusBadge";
import { SuccessBurst } from "../src/components/molecules/SuccessBurst";
import { useMyOrders } from "../src/hooks/useOrders";
import { CalendarIcon, LocationIcon, TruckIcon, WalletIcon } from "../src/icons/appIcons";
import { formatRupees } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";
import { formatShortDay, formatWindow } from "../src/lib/deliveryText";
import { useSessionStore } from "../src/store/useSessionStore";
import { useTheme } from "../src/theme";
import type { Order } from "../src/types/orders";

const listOf = (value: string | string[] | undefined): string[] => ((Array.isArray(value) ? value[0] : value) ?? "").split(",").map((part) => part.trim()).filter(Boolean);

/**
 * Shown right after an order is placed (and paid, when paid online). The review step passes the new orders' ids and numbers;
 * the details come from the server's own order list, so what is shown is what was stored, never what the phone assumed.
 */
export default function OrderSuccessScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? i18n.language).startsWith("gu") ? "gu" : "en";
  const params = useLocalSearchParams<{ ids?: string; numbers?: string }>();
  const ids = listOf(params.ids);
  const numbers = listOf(params.numbers);
  const firstName = useSessionStore((state) => state.customer?.name ?? "").trim().split(/\s+/)[0] ?? "";
  const { data: allOrders } = useMyOrders();
  const placed = (allOrders ?? []).filter((order) => ids.includes(order.id) || numbers.includes(order.orderNumber));
  const count = Math.max(placed.length, numbers.length, 1);
  const totalPaise = placed.reduce((sum, order) => sum + order.totalPaise, 0);
  const paidOnline = placed.some((order) => order.paymentMethod === "online");
  const onCredit = placed.some((order) => order.paymentMethod === "credit");
  const firstOrder = placed[0];

  const goTrack = () => {
    if (count === 1 && firstOrder) router.replace({ pathname: "/order-tracking", params: { orderId: firstOrder.id } });
    else router.replace("/orders");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ gap: theme.spacing.xl, padding: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.xl }}>
        <View style={{ alignItems: "center", gap: theme.spacing.lg }}>
          <SuccessBurst />
          <RiseIn index={2} style={{ alignItems: "center", gap: theme.spacing.sm }}>
            <ThemedText accessibilityRole="header" variant="h1" style={{ textAlign: "center" }}>{t("shop.success.title")}</ThemedText>
            <ThemedText variant="body" style={{ textAlign: "center", color: theme.colors.colorTextSecondary }}>
              {firstName ? t("shop.success.thanksName", { name: firstName }) : t("shop.success.thanks")} {t("shop.success.description", { count })}
            </ThemedText>
          </RiseIn>
        </View>

        {placed.length > 0 ? (
          <RiseIn index={3} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, ...theme.elevation.card }}>
            <View style={{ width: 44, height: 44, borderRadius: theme.radii.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.colorSuccessTint }}>
              <AppIcon icon={WalletIcon} size="sm" tone="success" accessibilityLabel="" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
                {paidOnline && onCredit ? t("shop.success.paidMixed") : paidOnline ? t("shop.success.paidOnline") : t("shop.success.onCredit")}
              </ThemedText>
              <ThemedText variant="h2">{formatRupees(totalPaise)}</ThemedText>
            </View>
          </RiseIn>
        ) : null}

        <RiseIn index={4} style={{ gap: theme.spacing.md }}>
          {placed.length > 0
            ? placed.map((order) => <PlacedOrderCard key={order.id} order={order} language={language} />)
            : numbers.map((number) => (
              <View key={number} style={{ padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface }}>
                <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.success.numbers", { count: 1 })}</ThemedText>
                <ThemedText variant="body" weight="semibold">{number}</ThemedText>
              </View>
            ))}
        </RiseIn>

        {firstOrder ? (
          <View style={{ flexDirection: "row", gap: theme.spacing.sm, alignItems: "flex-start", paddingHorizontal: theme.spacing.xs }}>
            <AppIcon icon={LocationIcon} size="sm" tone="secondary" accessibilityLabel="" />
            <ThemedText variant="caption" style={{ flex: 1, color: theme.colors.colorTextSecondary }}>
              {t("shop.success.deliverTo", { name: firstOrder.recipientName, address: firstOrder.addressText })}
            </ThemedText>
          </View>
        ) : null}

        <ThemedText variant="caption" style={{ textAlign: "center", color: theme.colors.colorTextSecondary }}>{t("shop.success.next")}</ThemedText>

        <View style={{ gap: theme.spacing.sm }}>
          <Button onPress={goTrack}>{count === 1 ? t("shop.success.track") : t("shop.success.viewOrders")}</Button>
          <Button variant="secondary" onPress={() => router.replace("/home")}>{t("shop.success.continue")}</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** One placed order: its number and status, what is in it, and when it arrives. */
function PlacedOrderCard({ order, language }: { order: Order; language: "en" | "gu" }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const slot = order.deliveryMethod === "local_delivery" ? order.slot : null;
  return (
    <View style={{ gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}>
        <View style={{ gap: 2 }}>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.success.numbers", { count: 1 })}</ThemedText>
          <ThemedText variant="body" weight="bold">{order.orderNumber}</ThemedText>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>
      <View style={{ gap: theme.spacing.xs }}>
        {order.items.map((item) => (
          <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.sm }}>
            <ThemedText variant="bodySmall" numberOfLines={1} style={{ flex: 1 }}>{item.quantity}× {localized(item.productName, item.productNameGu, language)} · {item.variantName}</ThemedText>
            <ThemedText variant="bodySmall" weight="medium">{item.isGift ? t("offers.free") : formatRupees(item.lineTotalPaise)}</ThemedText>
          </View>
        ))}
      </View>
      <View style={{ height: theme.borderWidths.hairline, backgroundColor: theme.colors.colorBorder }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <AppIcon icon={slot ? CalendarIcon : TruckIcon} size="sm" tone="secondary" accessibilityLabel="" />
        <ThemedText variant="bodySmall" weight="medium" style={{ flex: 1 }}>
          {slot ? `${formatShortDay(order.deliveryDate, language, t)} · ${slot.name} ${formatWindow(slot.startTime, slot.endTime)}` : t("shop.courierDetail")}
        </ThemedText>
      </View>
    </View>
  );
}
