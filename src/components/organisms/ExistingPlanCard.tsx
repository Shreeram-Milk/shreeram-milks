import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useCountdownLabel } from "../../hooks/useCountdownLabel";
import { formatShortDay, formatWindow } from "../../lib/deliveryText";
import { useTheme } from "../../theme";
import type { AppLanguage } from "../../types/models";
import type { Subscription } from "../../types/subscriptions";
import { Card } from "../atoms/Card";
import { ThemedText } from "../atoms/ThemedText";
import { DeliveryRange } from "../molecules/DeliveryRange";

/**
 * Shown on a product page instead of the set-up when the customer already has a live subscription (or trial) of it: its status,
 * the windows, and the first and last day joined by the next delivery. Managing it is the page's bottom button, not repeated here.
 */
export function ExistingPlanCard({ subscription, language }: { subscription: Subscription; language: AppLanguage }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const paused = subscription.status === "paused";
  const countdown = useCountdownLabel(subscription.nextDelivery?.date, subscription.lines.find((line) => line.slotName === subscription.nextDelivery?.slotName)?.startTime);
  const next = paused ? t("subs.pausedNow") : subscription.nextDelivery ? `${formatShortDay(subscription.nextDelivery.date, language, t)}${countdown ? ` · ${countdown}` : ""}` : undefined;

  return (
    <Card style={{ gap: theme.spacing.md }}>
      <View style={{ gap: theme.spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <View style={{ borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: 2, backgroundColor: paused ? theme.colors.colorHighlightTint : theme.colors.colorAccentTint }}>
            <ThemedText variant="badgeLabel" style={{ color: paused ? theme.colors.colorHighlightText : theme.colors.colorAccent }}>{t(paused ? "subs.status_paused" : "subs.status_active")}</ThemedText>
          </View>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>#{subscription.number}</ThemedText>
        </View>
        <ThemedText variant="body" weight="bold">{t(subscription.kind === "trial" ? "subs.haveTrial" : "subs.haveSubscription")}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
          {subscription.lines.map((line) => `${line.slotName} × ${line.quantity} (${formatWindow(line.startTime, line.endTime)})`).join(" · ")}
        </ThemedText>
      </View>
      <DeliveryRange
        start={subscription.startDate}
        end={subscription.endDate}
        firstLabel={t("subs.firstDelivery")}
        lastLabel={t("subs.lastDelivery")}
        middle={next ? t("subs.nextDelivery") : undefined}
        middleDetail={next}
        language={language}
      />
    </Card>
  );
}
