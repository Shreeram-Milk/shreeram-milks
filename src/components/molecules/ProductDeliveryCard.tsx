import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { LocationIcon, TruckIcon } from "../../icons/appIcons";
import { formatOrderBy, formatShortDay, formatWindow } from "../../lib/deliveryText";
import { useTheme } from "../../theme";
import type { ProductDelivery } from "../../types/delivery";
import type { AppLanguage } from "../../types/models";
import { AppIcon } from "../atoms/AppIcon";
import { Card } from "../atoms/Card";
import { PressableScale } from "../atoms/PressableScale";
import { Skeleton } from "../atoms/Skeleton";
import { ThemedText } from "../atoms/ThemedText";

interface ProductDeliveryCardProps {
  /** The PIN code of the customer's saved delivery address, or empty when they have none yet. It is shown, never typed here. */
  pin: string;
  delivery: ProductDelivery | undefined;
  isLoading: boolean;
  isError: boolean;
  language: AppLanguage;
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  /** Opens the customer's saved addresses, where the delivery address (and so the PIN code) is changed. */
  onManageAddresses: () => void;
  onRetry: () => void;
  /** False for a subscription or trial, which picks its windows (with a quantity each) elsewhere. */
  showSlots?: boolean;
}

/** One line: an icon, a title with a small grey line, and a text action on the right. */
function DeliveryLine({ action, detail, onAction, title, tone = "default" }: { action?: string; detail?: string; onAction?: () => void; title: string; tone?: "default" | "warning" }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4, padding: theme.spacing.md - 2 }}>
      <View style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md - 2, backgroundColor: tone === "warning" ? theme.colors.colorHighlightTint : theme.colors.colorAccentTint }}>
        <AppIcon icon={LocationIcon} accessibilityLabel="" size="sm" tone={tone === "warning" ? "highlight" : "accent"} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <ThemedText variant="bodySmall" weight="bold" numberOfLines={2}>{title}</ThemedText>
        {detail ? <ThemedText variant="caption" numberOfLines={2} style={{ color: theme.colors.colorTextSecondary }}>{detail}</ThemedText> : null}
      </View>
      {action && onAction ? (
        <PressableScale accessibilityRole="button" accessibilityLabel={action} hitSlop={theme.spacing.sm} onPress={onAction}>
          <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorPrimary }}>{action}</ThemedText>
        </PressableScale>
      ) : null}
    </View>
  );
}

/** Where and when this product can be delivered to the customer's PIN code. The server decides; this only shows the answer. */
export function ProductDeliveryCard({ pin, delivery, isLoading, isError, language, selectedSlotId, onSelectSlot, onManageAddresses, onRetry, showSlots = true }: ProductDeliveryCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (!pin) return <Card padded={false}><DeliveryLine title={t("productDetails.addAddressAction")} detail={t("productDetails.addAddress")} action={t("productDetails.add")} onAction={onManageAddresses} /></Card>;
  if (isLoading) return <Skeleton height={64} radius={theme.radii.lg} />;
  if (isError || !delivery) return <Card padded={false}><DeliveryLine tone="warning" title={t("productDetails.deliveryError")} action={t("common.retry")} onAction={onRetry} /></Card>;
  if (!delivery.served) return <Card padded={false}><DeliveryLine tone="warning" title={t("productDetails.notDeliverableTitle", { pin })} detail={t("productDetails.notDeliverableDetail")} action={t("productDetails.changeAddress")} onAction={onManageAddresses} /></Card>;

  const place = delivery.locality ? `${delivery.locality} · ${pin}` : pin;
  const showSlotPicker = showSlots && delivery.deliveryMethod === "local_delivery" && delivery.slots.length > 0;

  return (
    <Card padded={false}>
      <DeliveryLine title={place} detail={t("productDetails.deliveringToSaved")} />
      {delivery.deliveryMethod === "shipping" ? (
        <View style={{ flexDirection: "row", gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md - 2, paddingBottom: theme.spacing.md - 2 }}>
          <AppIcon icon={TruckIcon} size="sm" tone="secondary" accessibilityLabel="" />
          <ThemedText variant="caption" style={{ flex: 1, color: theme.colors.colorTextSecondary }}>{t("productDetails.courierDetail")}</ThemedText>
        </View>
      ) : null}
      {showSlotPicker ? (
        <View accessibilityRole="radiogroup" accessibilityLabel={t("productDetails.slotTitle")} style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: theme.spacing.sm, paddingHorizontal: theme.spacing.md - 2, paddingBottom: theme.spacing.md - 2 }}>
          {delivery.slots.map((slot) => {
            const active = slot.slotId === selectedSlotId;
            const orderBy = formatOrderBy(slot.orderBy, language, t);
            return (
              <PressableScale
                key={slot.slotId}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => onSelectSlot(slot.slotId)}
                pressScale={theme.motion.pressScale.control}
                // Two per row; a single time keeps half the width instead of stretching across.
                containerStyle={{ width: "48%" }}
                style={{ gap: 3, paddingVertical: theme.spacing.md - 2, paddingHorizontal: theme.spacing.md - 2, borderRadius: theme.radii.md, borderWidth: active ? 1.5 : theme.borderWidths.hairline, borderColor: active ? theme.colors.colorTextPrimary : theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface }}
              >
                <ThemedText variant="bodySmall" weight="semibold">{slot.name}</ThemedText>
                <ThemedText variant="caption" style={{ color: theme.colors.colorTextPrimary }}>{formatWindow(slot.startTime, slot.endTime)}</ThemedText>
                <ThemedText variant="caption" numberOfLines={2} style={{ color: theme.colors.colorTextSecondary }}>{[formatShortDay(slot.earliestDate, language, t), orderBy].filter(Boolean).join(" · ")}</ThemedText>
              </PressableScale>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}
