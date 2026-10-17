import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "../atoms/ThemedText";
import { StateMessage } from "../organisms/StateMessage";
import { formatOrderBy, formatShortDay, formatWindow } from "../../lib/deliveryText";
import type { PinAvailability } from "../../types/delivery";
import type { AppLanguage } from "../../types/models";
import { useTheme } from "../../theme";

interface PinAvailabilityCardProps {
  availability: PinAvailability | undefined;
  /** True once the PIN has six digits. Before that only the hint is shown. */
  complete: boolean;
  isError: boolean;
  isLoading: boolean;
  language: AppLanguage;
  onRetry: () => void;
}

/** What the server said about a PIN code: a hint, a check in progress, the delivery options and dates, or a note that no home delivery is set up here (the customer can still continue: each product says whether it can reach them). */
export function PinAvailabilityCard({ availability, complete, isError, isLoading, language, onRetry }: PinAvailabilityCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (!complete) return <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("location.enterPin")}</ThemedText>;
  if (isLoading) return <StateMessage type="loading" title={t("location.checking")} />;
  if (isError) return <StateMessage type="error" title={t("location.errorTitle")} description={t("location.errorDetail")} actionLabel={t("common.retry")} onAction={onRetry} />;
  if (!availability || availability.options.length === 0) {
    return (
      <View accessibilityRole="summary" style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurfaceMuted }}>
        <ThemedText variant="bodySmall" weight="semibold">{t("location.notServedTitle")}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("location.notServedDetail")}</ThemedText>
      </View>
    );
  }

  const place = availability.options.find((option) => option.locality)?.locality ?? "";
  const courierOnly = availability.options.every((option) => option.deliveryMethod === "shipping");
  return (
    <View accessibilityRole="summary" style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSuccessTint }}>
      <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorSuccess }}>
        {place ? t("location.servedTitle", { place }) : t("location.servedTitleNoPlace")}
      </ThemedText>
      {availability.options.map((option) => (
        <View key={option.optionId} style={{ gap: theme.spacing.xs }}>
          <ThemedText variant="caption" weight="semibold">{option.deliveryMethod === "local_delivery" ? t("location.localDelivery") : t("location.shippingDelivery")}</ThemedText>
          {option.deliveryMethod === "local_delivery" ? (
            option.slots.map((slot) => (
              <View key={slot.slotId}>
                <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
                  {slot.name} · {formatWindow(slot.startTime, slot.endTime)} · {formatShortDay(slot.earliestDate, language, t)}
                </ThemedText>
                {formatOrderBy(slot.orderBy, language, t) ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{formatOrderBy(slot.orderBy, language, t)}</ThemedText> : null}
              </View>
            ))
          ) : (
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("location.shippingDetail")}</ThemedText>
          )}
        </View>
      ))}
      {courierOnly ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("location.courierOnly")}</ThemedText> : null}
    </View>
  );
}
