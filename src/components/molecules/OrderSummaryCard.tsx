import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useCountdownLabel } from "../../hooks/useCountdownLabel";
import { PackageIcon } from "../../icons/appIcons";
import { AppIcon } from "../atoms/AppIcon";
import { ThemedText } from "../atoms/ThemedText";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatRupees } from "../../lib/catalogCart";
import { localized } from "../../lib/contentLocalization";
import { formatPlacedAt, formatShortDay, formatWindow } from "../../lib/deliveryText";
import { useTheme } from "../../theme";
import type { AppLanguage } from "../../types/models";
import type { Order } from "../../types/orders";

interface OrderSummaryCardProps {
  language: AppLanguage;
  onPress: () => void;
  order: Order;
}

/** One order on the Orders list: its number, status, what and when, and the total. */
export function OrderSummaryCard({ language, onPress, order }: OrderSummaryCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const first = order.items[0];
  const more = order.items.length - 1;
  const countdown = useCountdownLabel(order.status === "placed" ? order.deliveryDate : null, order.slot?.startTime);
  const when = order.deliveryMethod === "local_delivery" && order.slot
    ? `${formatShortDay(order.deliveryDate, language, t)} · ${order.slot.name} ${formatWindow(order.slot.startTime, order.slot.endTime)}${countdown ? ` · ${t("subs.arrivesIn", { when: countdown })}` : ""}`
    : t("shop.courier");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("orders.orderLabel", { number: order.orderNumber })}
      onPress={onPress}
      style={({ pressed }) => ({
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: theme.radii.lg,
        borderWidth: theme.borderWidths.hairline,
        borderColor: theme.colors.colorBorder,
        backgroundColor: theme.colors.colorSurface,
        opacity: pressed ? theme.opacity.subdued : theme.opacity.full,
        ...theme.elevation.card,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, backgroundColor: theme.colors.colorSurfaceMuted }}>
          <AppIcon icon={PackageIcon} accessibilityLabel="" size="sm" tone="secondary" />
          <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.colorTextSecondary }}>{t("orders.kind_direct")}</ThemedText>
        </View>
        <OrderStatusBadge status={order.status}>{t(`shop.status.${order.status}`)}</OrderStatusBadge>
      </View>
      <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>#{order.orderNumber} · {t("orders.placedOn", { when: formatPlacedAt(order.placedAt, language) })}</ThemedText>
      <ThemedText variant="bodySmall" weight="semibold" numberOfLines={1}>
        {first ? `${first.quantity} × ${localized(first.productName, first.productNameGu, language)} (${first.variantName})` : ""}
        {more > 0 ? ` ${t("shop.andMore", { count: more })}` : ""}
      </ThemedText>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing.sm }}>
        <ThemedText variant="caption" style={{ flex: 1, color: theme.colors.colorTextSecondary }} numberOfLines={2}>{when}</ThemedText>
        <ThemedText variant="bodySmall" weight="bold">{formatRupees(order.totalPaise)}</ThemedText>
      </View>
    </Pressable>
  );
}
