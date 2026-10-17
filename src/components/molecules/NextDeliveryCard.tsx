import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useCountdownLabel } from "../../hooks/useCountdownLabel";
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

const LOOK_AHEAD_DAYS = 14;
const WEEKDAY_LOCALE = { en: "en-IN", gu: "gu-IN" } as const;
const DATE_TILE_WIDTH = 52;

/** "2026-10-17" as weekday, day and month, read as a plain calendar date (no timezone shift). */
function dateParts(date: string, language: "en" | "gu") {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  const locale = WEEKDAY_LOCALE[language];
  return {
    weekday: value.toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" }),
    day: String(day),
    month: value.toLocaleDateString(locale, { month: "short", timeZone: "UTC" }),
  };
}

const ACTIVE_STATES: readonly CalendarDelivery["state"][] = ["upcoming", "placed", "out_for_delivery"];

/**
 * Home: the customer's next delivery, as the screen's one light mint highlight card: a white date tile, what is coming and
 * when, a countdown chip, and a tap to open the calendar. Shows nothing when signed out or when nothing is coming.
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
  if (!signedIn || !next) return null;

  const sameDay = coming.filter((entry) => entry.date === next.date);
  const more = sameDay.length - 1;
  const parts = dateParts(next.date, language);
  const onTheWay = next.state === "out_for_delivery";
  const items = next.items.map((item) => `${localized(item.productName, item.productNameGu, language)} × ${item.quantity}`).join(", ");
  const when = [next.slotName, next.startTime ? formatClock(next.startTime) : null].filter(Boolean).join(" · ");
  const chipLabel = !onTheWay && countdown ? countdown : t(`subs.day_${next.state}`);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${t("subs.nextDelivery")}: ${formatShortDay(next.date, language, t)}, ${when}. ${items}`}
      onPress={() => router.push("/delivery-calendar")}
      style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4, padding: theme.spacing.md - 4, borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorAccentBorder, backgroundColor: theme.colors.colorAccentTint }}
    >
      <View style={{ width: DATE_TILE_WIDTH, alignItems: "center", paddingVertical: theme.spacing.sm - 2, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurface, ...theme.elevation.sm }}>
        <ThemedText variant="badgeLabel" style={{ color: theme.colors.colorAccent }}>{parts.weekday}</ThemedText>
        <ThemedText variant="h1" weight="extrabold">{parts.day}</ThemedText>
        <ThemedText variant="badgeLabel" style={{ color: theme.colors.colorTextSecondary }}>{parts.month}</ThemedText>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: theme.spacing.sm - 2 }}>
          <ThemedText variant="overline" style={{ color: theme.colors.colorAccent, textTransform: "uppercase", letterSpacing: 0.6 }}>{t("subs.nextDelivery")}</ThemedText>
          <View style={{ borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: 1, backgroundColor: onTheWay ? theme.colors.colorAccent : theme.colors.colorHighlight }}>
            <ThemedText variant="badgeLabel" style={{ color: onTheWay ? theme.colors.colorTextInverse : theme.colors.colorOnHighlight }}>{chipLabel}</ThemedText>
          </View>
        </View>
        <ThemedText variant="bodySmall" weight="bold" numberOfLines={1}>{formatShortDay(next.date, language, t)}{when ? ` · ${when}` : ""}</ThemedText>
        <ThemedText variant="caption" numberOfLines={1} style={{ color: theme.colors.colorTextSecondary }}>{items}{more > 0 ? `  ${t("subs.moreOnDay", { count: more })}` : ""}</ThemedText>
      </View>
      <AppIcon icon={ForwardIcon} accessibilityLabel="" size="sm" tone="accent" />
    </PressableScale>
  );
}
