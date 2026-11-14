import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useCountdownLabel } from "../../hooks/useCountdownLabel";
import { useGreetingPart } from "../../hooks/useGreeting";
import { useMyDeliveries } from "../../hooks/useSubscriptions";
import { ForwardIcon } from "../../icons/appIcons";
import { localized } from "../../lib/contentLocalization";
import { addDaysTo, formatClock, formatShortDay, indiaToday } from "../../lib/deliveryText";
import { useAppStore } from "../../store/useAppStore";
import { useSessionStore } from "../../store/useSessionStore";
import { useTheme } from "../../theme";
import type { CalendarDelivery } from "../../types/subscriptions";
import { AppIcon } from "../atoms/AppIcon";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";
import { DeliveryScene } from "./DeliveryScene";
import type { SceneSky } from "../../theme/illustration";

const LOOK_AHEAD_DAYS = 14;
/** The sky in the little scene follows the part of the day in India. */
const SKY_OF_PART: Record<ReturnType<typeof useGreetingPart>, SceneSky> = { morning: "morning", afternoon: "day", evening: "evening", night: "night" };

const ACTIVE_STATES: readonly CalendarDelivery["state"][] = ["upcoming", "placed", "out_for_delivery"];

/**
 * Opens this delivery itself, not the whole calendar: its order once there is one (tracking), else the subscription it belongs to
 * (a coming subscription day has no order yet). The calendar is only the fallback.
 */
function openDelivery(delivery: CalendarDelivery) {
  if (delivery.orderId) router.push({ pathname: "/order-tracking", params: { orderId: delivery.orderId } });
  else if (delivery.subscriptionId) router.push({ pathname: "/subscription-manage", params: { id: delivery.subscriptionId } });
  else router.push("/delivery-calendar");
}

/**
 * Home: the customer's next delivery, as the screen's one light mint highlight card: a white date tile, what is coming and
 * when, a countdown chip, and a tap to open that delivery. Shows nothing when signed out or when nothing is coming.
 */
export function NextDeliveryCard() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const signedIn = useSessionStore((state) => Boolean(state.customer));
  const today = indiaToday();
  const { data = [], refetch } = useMyDeliveries(today, addDaysTo(today, LOOK_AHEAD_DAYS));
  // Staff and the customer can cancel or skip a day from other screens (or the admin): look again each time Home is shown.
  useFocusEffect(useCallback(() => { if (signedIn) void refetch(); }, [refetch, signedIn]));
  const coming = data.filter((entry) => ACTIVE_STATES.includes(entry.state));
  const next = coming[0];
  const countdown = useCountdownLabel(next?.date, next?.startTime);
  const part = useGreetingPart();
  if (!signedIn || !next) return null;

  const sameDay = coming.filter((entry) => entry.date === next.date);
  const more = sameDay.length - 1;
  const onTheWay = next.state === "out_for_delivery";
  const items = next.items.map((item) => `${localized(item.productName, item.productNameGu, language)} × ${item.quantity}`).join(", ");
  const when = next.startTime ? formatClock(next.startTime) : "";
  const day = formatShortDay(next.date, language, t);
  const status = onTheWay ? t("subs.day_out_for_delivery") : countdown ? `${t("subs.nextDelivery")} · ${countdown}` : t("subs.nextDelivery");

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${onTheWay ? t("subs.day_out_for_delivery") : t("subs.nextDelivery")}: ${day}, ${when}. ${items}`}
      onPress={() => openDelivery(next)}
      containerStyle={{ marginHorizontal: theme.layout.screenHorizontalPadding, marginVertical: theme.spacing.sm }}
      style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 2, padding: theme.spacing.md - 4, borderRadius: theme.radii.xl, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface }}
    >
      <DeliveryScene sky={SKY_OF_PART[part]} state={onTheWay ? "out" : "scheduled"} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs + 2 }}>
          {onTheWay ? <View style={{ width: 7, height: 7, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorBrand }} /> : null}
          <ThemedText variant="label" numberOfLines={1} style={{ flexShrink: 1, color: onTheWay ? theme.colors.colorBrandText : theme.colors.colorTextSecondary }}>{status}</ThemedText>
        </View>
        <ThemedText variant="body" weight="bold" numberOfLines={1}>{day}{when ? `, ${when}` : ""}</ThemedText>
        <ThemedText variant="caption" numberOfLines={2} style={{ color: theme.colors.colorTextSecondary }}>{items}{more > 0 ? `  ${t("subs.moreOnDay", { count: more })}` : ""}</ThemedText>
      </View>
      <AppIcon icon={ForwardIcon} accessibilityLabel="" size="sm" tone="secondary" />
    </PressableScale>
  );
}
