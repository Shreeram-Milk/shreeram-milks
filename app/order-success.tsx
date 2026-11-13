import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { OrderStepsAcross } from "../src/components/molecules/OrderSteps";
import { SuccessBurst } from "../src/components/molecules/SuccessBurst";
import { OrderReceipt } from "../src/components/organisms/OrderReceipt";
import { useMyOrders } from "../src/hooks/useOrders";
import { formatShortDay, formatWindow } from "../src/lib/deliveryText";
import { useSessionStore } from "../src/store/useSessionStore";
import { useTheme } from "../src/theme";
import type { Order } from "../src/types/orders";

const listOf = (value: string | string[] | undefined): string[] => ((Array.isArray(value) ? value[0] : value) ?? "").split(",").map((part) => part.trim()).filter(Boolean);

/** A small card under the receipt: where the order is now, when it arrives, and the way to the full tracking screen. */
function TrackStrip({ order, language }: { order: Order; language: "en" | "gu" }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const slot = order.deliveryMethod === "local_delivery" ? order.slot : null;
  return (
    <View style={{ gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
      <View style={{ gap: 2 }}>
        <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("track.arriving")}</ThemedText>
        <ThemedText variant="body" weight="bold">{slot ? `${formatShortDay(order.deliveryDate, language, t)} · ${formatWindow(slot.startTime, slot.endTime)}` : t("shop.courier")}</ThemedText>
      </View>
      <OrderStepsAcross order={order} />
      <Button variant="tonal" onPress={() => router.replace({ pathname: "/order-tracking", params: { orderId: order.id } })}>{t("shop.success.track")}</Button>
    </View>
  );
}

/**
 * Shown right after an order is placed (and paid, when paid online): a clear "Order placed", then a receipt for each order with
 * every detail, and a small tracking strip. The details come from the server's own order list, so what is shown is what was stored.
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, padding: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl }}>
        <View style={{ alignItems: "center", gap: theme.spacing.md }}>
          <SuccessBurst />
          <View style={{ alignItems: "center", gap: theme.spacing.xs }}>
            <ThemedText accessibilityRole="header" variant="h1" style={{ textAlign: "center" }}>{t("shop.success.title")}</ThemedText>
            <ThemedText variant="bodySmall" style={{ textAlign: "center", color: theme.colors.colorTextSecondary }}>
              {firstName ? t("shop.success.thanksName", { name: firstName }) : t("shop.success.thanks")} {t("shop.success.description", { count })}
            </ThemedText>
          </View>
        </View>

        {placed.length > 0
          ? placed.map((order) => (
            <View key={order.id} style={{ gap: theme.spacing.md }}>
              <OrderReceipt order={order} />
              <TrackStrip order={order} language={language} />
            </View>
          ))
          : numbers.map((number) => (
            <View key={number} style={{ padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface }}>
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.success.numbers", { count: 1 })}</ThemedText>
              <ThemedText variant="body" weight="semibold">{number}</ThemedText>
            </View>
          ))}

        <ThemedText variant="caption" style={{ textAlign: "center", color: theme.colors.colorTextSecondary }}>{t("shop.success.next")}</ThemedText>
        <View style={{ gap: theme.spacing.sm }}>
          {count > 1 ? <Button onPress={() => router.replace("/orders")}>{t("shop.success.viewOrders")}</Button> : null}
          <Button variant="secondary" onPress={() => router.replace("/home")}>{t("shop.success.continue")}</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
