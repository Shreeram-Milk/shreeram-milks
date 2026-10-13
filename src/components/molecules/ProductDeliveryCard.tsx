import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { formatDeliveryDate, formatWindow } from "../../lib/deliveryText";
import { useTheme } from "../../theme";
import type { ProductDelivery } from "../../types/delivery";
import type { AppLanguage } from "../../types/models";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";

interface ProductDeliveryCardProps {
  /** The customer's PIN code, or empty when they have not entered one yet. */
  pin: string;
  delivery: ProductDelivery | undefined;
  isLoading: boolean;
  isError: boolean;
  language: AppLanguage;
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  onRetry: () => void;
}

/** Where and when this product can be delivered to the customer's PIN code. The server decides; this only shows the answer. */
export function ProductDeliveryCard({ pin, delivery, isLoading, isError, language, selectedSlotId, onSelectSlot, onRetry }: ProductDeliveryCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const box = { gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg } as const;
  const changePin = () => router.push("/location");

  if (!pin) {
    return (
      <View style={{ ...box, backgroundColor: theme.colors.colorSurfaceMuted }}>
        <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.addPin")}</ThemedText>
        <Button variant="secondary" onPress={changePin}>{t("productDetails.addPinAction")}</Button>
      </View>
    );
  }
  if (isLoading) return <View style={{ ...box, backgroundColor: theme.colors.colorSurfaceMuted }}><ThemedText variant="bodySmall">{t("productDetails.checkingDelivery")}</ThemedText></View>;
  if (isError || !delivery) {
    return (
      <View accessibilityRole="alert" style={{ ...box, backgroundColor: theme.colors.colorWarningTint }}>
        <ThemedText variant="bodySmall">{t("productDetails.deliveryError")}</ThemedText>
        <Button variant="secondary" onPress={onRetry}>{t("common.retry")}</Button>
      </View>
    );
  }
  if (!delivery.served) {
    return (
      <View accessibilityRole="alert" style={{ ...box, backgroundColor: theme.colors.colorWarningTint }}>
        <ThemedText variant="bodySmall" weight="semibold">{t("productDetails.notDeliverableTitle", { pin })}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.notDeliverableDetail")}</ThemedText>
        <Button variant="secondary" onPress={changePin}>{t("productDetails.changePin")}</Button>
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}>
        <ThemedText variant="bodySmall" weight="semibold" style={{ flex: 1 }}>
          {delivery.locality ? t("productDetails.deliverTo", { place: delivery.locality }) : t("productDetails.deliverToPin", { pin })}
        </ThemedText>
        <Pressable accessibilityRole="button" onPress={changePin} hitSlop={theme.spacing.sm}>
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorPrimary }}>{t("productDetails.changePin")}</ThemedText>
        </Pressable>
      </View>
      {delivery.deliveryMethod === "shipping" ? (
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.courierDetail")}</ThemedText>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.slotTitle")}</ThemedText>
          {delivery.slots.map((slot) => {
            const active = slot.slotId === selectedSlotId;
            return (
              <Pressable
                key={slot.slotId}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => onSelectSlot(slot.slotId)}
                style={{
                  gap: theme.spacing.xs,
                  padding: theme.spacing.md,
                  borderRadius: theme.radii.lg,
                  borderWidth: active ? theme.borderWidths.medium : theme.borderWidths.hairline,
                  borderColor: active ? theme.colors.colorPrimary : theme.colors.colorBorder,
                  backgroundColor: theme.colors.colorSurface,
                }}
              >
                <ThemedText variant="bodySmall" weight="semibold">{slot.name} · {formatWindow(slot.startTime, slot.endTime)}</ThemedText>
                <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.earliestFrom", { date: formatDeliveryDate(slot.earliestDate, language) })}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
