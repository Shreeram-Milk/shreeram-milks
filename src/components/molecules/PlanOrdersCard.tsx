import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useCountdownLabel } from "../../hooks/useCountdownLabel";
import { formatRupees } from "../../lib/catalogCart";
import { localized } from "../../lib/contentLocalization";
import { formatPlacedAt, formatShortDay, formatWindow } from "../../lib/deliveryText";
import { isComing } from "../../lib/orderGroups";
import { ChevronDownIcon, ChevronUpIcon, ClockIcon, RepeatIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";
import type { AppLanguage } from "../../types/models";
import type { Order } from "../../types/orders";
import { AppIcon } from "../atoms/AppIcon";
import { ThemedText } from "../atoms/ThemedText";
import { OrderStatusBadge } from "./OrderStatusBadge";

// A slim coloured left edge tells a subscription (green) from a trial (amber) at a glance, without weighing the card down.
const PLAN_EDGE_WIDTH = 2;

interface PlanOrdersCardProps {
  kind: "subscription" | "trial";
  language: AppLanguage;
  orders: Order[];
}

/**
 * All the deliveries of one subscription or trial as one card that opens and closes. The coloured edge and the tag say which kind it
 * is (a subscription is green, a trial is amber), the summary says how many are still coming, and each delivery opens its own tracking.
 */
export function PlanOrdersCard({ kind, language, orders }: PlanOrdersCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const first = orders[0];
  const next = orders.find(isComing);
  const countdown = useCountdownLabel(next?.deliveryDate, next?.slot?.startTime);
  const accent = kind === "trial" ? theme.colors.colorWarning : theme.colors.colorAccent;
  const tint = kind === "trial" ? theme.colors.colorWarningTint : theme.colors.colorAccentTint;
  const coming = orders.filter(isComing).length;
  const done = orders.filter((order) => order.status === "delivered").length;
  const item = first.items[0];
  const name = item ? `${localized(item.productName, item.productNameGu, language)} (${item.variantName})` : "";
  const perDelivery = first.items.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  // The plan started when its first delivery was ordered.
  const startedAt = orders.reduce((earliest, order) => (order.placedAt < earliest ? order.placedAt : earliest), first.placedAt);
  const nextText = next
    ? `${formatShortDay(next.deliveryDate, language, t)}${next.slot ? ` · ${next.slot.name}` : ""}${countdown ? ` · ${countdown}` : ""}`
    : t("orders.planFinished");

  return (
    <View style={{ overflow: "hidden", borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, borderLeftWidth: PLAN_EDGE_WIDTH, borderLeftColor: accent, backgroundColor: theme.colors.colorSurface, ...theme.elevation.card }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${t(`orders.kind_${kind}`)}. ${name}. ${nextText}`}
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => ({ gap: theme.spacing.sm, padding: theme.spacing.md, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, backgroundColor: tint }}>
            <AppIcon icon={kind === "trial" ? ClockIcon : RepeatIcon} accessibilityLabel="" size="sm" tone={kind === "trial" ? "warning" : "primary"} />
            <ThemedText variant="caption" weight="bold" style={{ color: accent }}>{t(`orders.kind_${kind}`)}</ThemedText>
          </View>
          <AppIcon icon={open ? ChevronUpIcon : ChevronDownIcon} accessibilityLabel="" size="sm" tone="secondary" />
        </View>
        <ThemedText variant="body" weight="semibold" numberOfLines={2}>{name}</ThemedText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, flexWrap: "wrap" }}>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("orders.planDeliveries", { count: orders.length })}</ThemedText>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>·</ThemedText>
          <ThemedText variant="caption" weight="semibold" style={{ color: coming > 0 ? accent : theme.colors.colorTextSecondary }}>{t("orders.planComing", { count: coming })}</ThemedText>
          {done > 0 ? <ThemedText variant="caption" style={{ color: theme.colors.colorSuccess }}>· {t("orders.planDone", { count: done })}</ThemedText> : null}
        </View>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("orders.startedOn", { when: formatPlacedAt(startedAt, language) })}</ThemedText>
        {/* The next delivery sits under a thin line, lined up with the text above (no coloured patch). */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: theme.spacing.sm, marginTop: theme.spacing.xs, paddingTop: theme.spacing.md - 4, borderTopWidth: theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("orders.planNext")}</ThemedText>
            <ThemedText variant="bodySmall" weight="bold" numberOfLines={2} style={{ color: next ? accent : theme.colors.colorTextSecondary }}>{nextText}</ThemedText>
          </View>
          <ThemedText variant="bodySmall" weight="bold" style={{ fontVariant: ["tabular-nums"] }}>{t("orders.perDelivery", { price: formatRupees(perDelivery) })}</ThemedText>
        </View>
      </Pressable>
      {open ? (
        <View style={{ borderTopWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
          {orders.map((order) => (
            <Pressable
              key={order.id}
              accessibilityRole="button"
              accessibilityLabel={t("orders.orderLabel", { number: order.orderNumber })}
              onPress={() => router.push({ pathname: "/order-tracking", params: { orderId: order.id } })}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderBottomWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: pressed ? theme.colors.colorSurfaceMuted : theme.colors.colorSurface })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText variant="bodySmall" weight="semibold">{formatShortDay(order.deliveryDate, language, t)}</ThemedText>
                <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{order.slot ? `${order.slot.name} ${formatWindow(order.slot.startTime, order.slot.endTime)}` : t("shop.courier")} · #{order.orderNumber}</ThemedText>
              </View>
              <OrderStatusBadge status={order.status}>{t(`shop.status.${order.status}`)}</OrderStatusBadge>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
