import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { PackageIcon } from "../../icons/appIcons";
import { AppIcon } from "../atoms/AppIcon";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatRupees } from "../../lib/catalogCart";
import { localized } from "../../lib/contentLocalization";
import { formatPlacedAt, formatShortDay, formatWindow } from "../../lib/deliveryText";
import { shownStatus } from "../../lib/orderGroups";
import { remoteImage } from "../../lib/remoteImage";
import { useTheme } from "../../theme";
import type { AppLanguage } from "../../types/models";
import type { Order } from "../../types/orders";

const THUMB_SIZE = 40;
const VISIBLE_ITEMS = 2;

interface OrderSummaryCardProps {
  /** The first product's picture, when the shop still sells it. */
  imageUrl?: string;
  language: AppLanguage;
  onPress: () => void;
  order: Order;
}

export function OrderSummaryCard({ imageUrl, language, onPress, order }: OrderSummaryCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const status = shownStatus(order, new Date());
  const active = status === "placed" || status === "out_for_delivery" || status === "overdue";
  const action = t(active ? "shop.success.track" : "orders.viewDetails");
  const orderLabel = t("orders.orderLabel", { number: order.orderNumber });
  const day = formatShortDay(order.deliveryDate, language, t);
  const window = order.slot ? formatWindow(order.slot.startTime, order.slot.endTime) : "";
  const placed = formatPlacedAt(order.placedAt, language);
  const delivery = order.deliveryMethod === "shipping"
    ? t("shop.courier")
    : [day, window].filter(Boolean).join(" · ");
  const timing = status === "overdue"
    ? window ? t("track.expected", { day, window }) : t("orders.expectedDay", { day })
    : active ? delivery : placed;
  const more = order.items.length - VISIBLE_ITEMS;

  return (
    <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md - 4, borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.sm }}>
        <View style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: theme.radii.md, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.colorSurfaceMuted }}>
          {imageUrl
            ? <Image source={remoteImage(imageUrl)} contentFit="cover" transition={theme.motion.duration.fast} style={{ width: THUMB_SIZE, height: THUMB_SIZE }} />
            : <AppIcon icon={PackageIcon} accessibilityLabel="" tone="secondary" size="sm" />}
        </View>
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          {order.items.slice(0, VISIBLE_ITEMS).map((item, index) => (
            <ThemedText key={item.id} variant="bodySmall" weight={index === 0 ? "bold" : "medium"} numberOfLines={2} style={{ color: index === 0 ? theme.colors.colorTextPrimary : theme.colors.colorTextSecondary }}>
              {localized(item.productName, item.productNameGu, language)}{item.variantName ? ` · ${item.variantName}` : ""} × {item.quantity}
            </ThemedText>
          ))}
          {more > 0 ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.andMore", { count: more })}</ThemedText> : null}
        </View>
        <View style={{ maxWidth: "43%" }}>
          <OrderStatusBadge status={status}>{t(`shop.status.${status}`)}</OrderStatusBadge>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: theme.spacing.xs }}>
        {timing ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{timing}</ThemedText> : null}
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{orderLabel}</ThemedText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingTop: theme.spacing.sm, borderTopWidth: theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
        <Button variant="secondary" compact style={{ flex: 1 }} accessibilityLabel={`${action}, ${orderLabel}`} onPress={onPress}>{action}</Button>
        <ThemedText variant="body" weight="bold" style={{ fontVariant: ["tabular-nums"] }}>{formatRupees(order.totalPaise)}</ThemedText>
      </View>
    </View>
  );
}
