import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ForwardIcon, PackageIcon } from "../../icons/appIcons";
import { AppIcon } from "../atoms/AppIcon";
import { ThemedText } from "../atoms/ThemedText";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatRupees } from "../../lib/catalogCart";
import { localized } from "../../lib/contentLocalization";
import { kindOf } from "../../lib/orderGroups";
import { remoteImage } from "../../lib/remoteImage";
import { useTheme } from "../../theme";
import type { AppLanguage } from "../../types/models";
import type { Order } from "../../types/orders";

const THUMB_SIZE = 64;

interface OrderSummaryCardProps {
  /** The first product's picture, when the shop still sells it. */
  imageUrl?: string;
  language: AppLanguage;
  onPress: () => void;
  order: Order;
}

/**
 * One order on My Orders: the product's picture, its type and status, what it is, the slot it comes in and the total. The day
 * is the section heading; the order number, order time and delivery window are on the order's own page (the chevron).
 */
export function OrderSummaryCard({ imageUrl, language, onPress, order }: OrderSummaryCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const first = order.items[0];
  const more = order.items.length - 1;
  const product = first ? localized(first.productName, first.productNameGu, language) : "";
  const slot = order.deliveryMethod === "local_delivery" ? order.slot?.name ?? "" : t("shop.courier");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t("orders.orderLabel", { number: order.orderNumber })}: ${product}, ${slot}, ${formatRupees(order.totalPaise)}, ${t(`shop.status.${order.status}`)}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md - 4,
        padding: theme.spacing.md - 4,
        borderRadius: theme.radii.lg,
        borderWidth: theme.borderWidths.hairline,
        borderColor: theme.colors.colorBorder,
        backgroundColor: theme.colors.colorSurface,
        opacity: pressed ? theme.opacity.subdued : theme.opacity.full,
        ...theme.elevation.card,
      })}
    >
      <View style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: theme.radii.md, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.colorSurfaceMuted }}>
        {imageUrl
          ? <Image source={remoteImage(imageUrl)} contentFit="cover" transition={theme.motion.duration.fast} style={{ width: THUMB_SIZE, height: THUMB_SIZE }} />
          : <AppIcon icon={PackageIcon} accessibilityLabel="" tone="secondary" />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}>
          <ThemedText variant="caption" weight="bold" numberOfLines={1} style={{ flexShrink: 1, color: theme.colors.colorTextSecondary }}>{t(`orders.kind_${kindOf(order)}`)}</ThemedText>
          <OrderStatusBadge status={order.status}>{t(`shop.status.${order.status}`)}</OrderStatusBadge>
        </View>
        <ThemedText variant="body" weight="semibold" numberOfLines={1}>
          {product}{more > 0 ? ` ${t("shop.andMore", { count: more })}` : ""}
        </ThemedText>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}>
          <ThemedText variant="caption" numberOfLines={1} style={{ flex: 1, color: theme.colors.colorTextSecondary }}>{slot}</ThemedText>
          <ThemedText variant="bodySmall" weight="bold">{formatRupees(order.totalPaise)}</ThemedText>
        </View>
      </View>
      <AppIcon icon={ForwardIcon} accessibilityLabel="" size="sm" tone="secondary" />
    </Pressable>
  );
}
