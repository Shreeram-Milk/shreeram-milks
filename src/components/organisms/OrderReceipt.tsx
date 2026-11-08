import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { formatRupees } from "../../lib/catalogCart";
import { localized } from "../../lib/contentLocalization";
import { formatPlacedAt, formatShortDay, formatWindow } from "../../lib/deliveryText";
import { useTheme } from "../../theme";
import type { Order } from "../../types/orders";
import { ThemedText } from "../atoms/ThemedText";
import { DashedRule } from "../molecules/DashedRule";

const TOOTH = 8;

/** The zig-zag torn edge of a paper receipt, along its top or bottom. */
function TornEdge({ width, side, color }: { width: number; side: "top" | "bottom"; color: string }) {
  if (width <= 0) return null;
  const teeth = Math.ceil(width / (TOOTH * 2));
  let path = side === "top" ? `M0 ${TOOTH}` : "M0 0";
  for (let index = 0; index < teeth; index += 1) {
    const x = index * TOOTH * 2;
    path += side === "top" ? ` L${x + TOOTH} 0 L${x + TOOTH * 2} ${TOOTH}` : ` L${x + TOOTH} ${TOOTH} L${x + TOOTH * 2} 0`;
  }
  path += side === "top" ? ` L${width} ${TOOTH} Z` : ` L${width} 0 Z`;
  return (
    <Svg width={width} height={TOOTH} style={{ display: "flex" }}>
      <Path d={path} fill={color} />
    </Svg>
  );
}

/** One label and value on the receipt. */
function Row({ label, value, strong = false, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.md }}>
      <ThemedText variant={strong ? "body" : "bodySmall"} weight={strong ? "bold" : "regular"} style={{ flexShrink: 1, color: strong ? theme.colors.colorTextPrimary : theme.colors.colorTextSecondary }}>{label}</ThemedText>
      <ThemedText variant={strong ? "h2" : "bodySmall"} weight={strong ? "extrabold" : "semibold"} style={{ textAlign: "right", flexShrink: 1, color: tone ?? theme.colors.colorTextPrimary, fontVariant: ["tabular-nums"] }}>{value}</ThemedText>
    </View>
  );
}

/**
 * An order as a printed receipt: who and when, every item with its price, the offer, the total and how it was paid, and where it
 * goes. White paper with torn edges on the page's grey, so it reads like the slip a shop hands over.
 */
export function OrderReceipt({ order }: { order: Order }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? i18n.language).startsWith("gu") ? "gu" : "en";
  const [width, setWidth] = useState(0);
  const itemsPaise = order.items.reduce((sum, item) => sum + (item.isGift ? 0 : item.lineTotalPaise), 0);
  const slot = order.deliveryMethod === "local_delivery" ? order.slot : null;
  const delivery = slot ? `${formatShortDay(order.deliveryDate, language, t)}, ${slot.name} ${formatWindow(slot.startTime, slot.endTime)}` : t("shop.courier");
  const paid = order.paymentMethod === "online" ? t("receipt.paidOnline") : t("receipt.onCredit");

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} accessibilityLabel={t("receipt.title")}>
      <TornEdge width={width} side="top" color={theme.colors.colorSurface} />
      <View style={{ gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.colorSurface }}>
        <View style={{ alignItems: "center", gap: 2 }}>
          <ThemedText variant="body" weight="extrabold" style={{ color: theme.colors.colorPrimary, letterSpacing: 0.5 }}>ShreeRam Milks</ThemedText>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, letterSpacing: 1 }}>{t("receipt.title").toUpperCase()}</ThemedText>
        </View>
        <DashedRule />
        <View style={{ gap: theme.spacing.xs + 2 }}>
          <Row label={t("receipt.orderNumber")} value={order.orderNumber} />
          <Row label={t("receipt.placedOn")} value={formatPlacedAt(order.placedAt, language)} />
          <Row label={t("receipt.delivery")} value={delivery} />
          <Row label={t("receipt.payment")} value={paid} />
        </View>
        <DashedRule />
        <View style={{ gap: theme.spacing.sm }}>
          {order.items.map((item) => (
            <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
              <View style={{ flex: 1, gap: 1 }}>
                <ThemedText variant="bodySmall" weight="semibold">{item.quantity} × {localized(item.productName, item.productNameGu, language)}</ThemedText>
                <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{item.variantName}{item.isGift ? "" : ` · ${formatRupees(item.unitPricePaise)} ${t("receipt.each")}`}</ThemedText>
              </View>
              <ThemedText variant="bodySmall" weight="semibold" style={{ fontVariant: ["tabular-nums"], color: item.isGift ? theme.colors.colorAccent : theme.colors.colorTextPrimary }}>{item.isGift ? t("offers.free") : formatRupees(item.lineTotalPaise)}</ThemedText>
            </View>
          ))}
        </View>
        <DashedRule />
        <View style={{ gap: theme.spacing.xs + 2 }}>
          <Row label={t("receipt.itemTotal")} value={formatRupees(itemsPaise)} />
          {order.discountPaise > 0 ? (
            <Row label={order.offerTitle ? `${t("offers.discount")} (${localized(order.offerTitle, order.offerTitleGu, language)})` : t("offers.discount")} value={`−${formatRupees(order.discountPaise)}`} tone={theme.colors.colorAccent} />
          ) : null}
          <Row label={t("receipt.deliveryFee")} value={t("offers.free")} tone={theme.colors.colorAccent} />
        </View>
        <DashedRule />
        <Row label={order.paymentMethod === "online" ? t("receipt.totalPaid") : t("receipt.total")} value={formatRupees(order.totalPaise)} strong />
        <DashedRule />
        <View style={{ gap: 2 }}>
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("receipt.deliverTo")}</ThemedText>
          <ThemedText variant="bodySmall" weight="semibold">{order.recipientName}</ThemedText>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{order.addressText}{order.pinCode ? ` – ${order.pinCode}` : ""}</ThemedText>
        </View>
        <ThemedText variant="caption" style={{ textAlign: "center", color: theme.colors.colorTextSecondary, paddingTop: theme.spacing.xs }}>{t("receipt.thanks")}</ThemedText>
      </View>
      <TornEdge width={width} side="bottom" color={theme.colors.colorSurface} />
    </View>
  );
}
