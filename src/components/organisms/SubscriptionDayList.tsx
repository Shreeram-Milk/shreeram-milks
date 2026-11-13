import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Card } from "../atoms/Card";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";
import { formatShortDay, formatClock, formatDeliveryDate } from "../../lib/deliveryText";
import { skippedDeliveryRanges } from "../../lib/skippedDeliveryRanges";
import { useTheme } from "../../theme";
import type { AppLanguage } from "../../types/models";
import type { DayLine, Subscription } from "../../types/subscriptions";

interface SubscriptionDayListProps {
  busy: boolean;
  days: Subscription["days"];
  language: AppLanguage;
  onSkip: (date: string, line: DayLine) => void;
}

const FIRST_DAYS = 7;

/** Show the schedule and keep skipped delivery ranges in a separate section. */
export function SubscriptionDayList({ busy, days, language, onSkip }: SubscriptionDayListProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  const schedule = days.map((day) => ({ ...day, lines: day.lines.filter((line) => line.state !== "skipped") })).filter((day) => day.lines.length > 0);
  const shown = showAll ? schedule : schedule.slice(0, FIRST_DAYS);
  const ranges = skippedDeliveryRanges(days);
  const skipped = ranges.reduce((total, range) => total + range.count, 0);
  if (days.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {schedule.length > 0 ? (
        <Card padded={false}>
          {shown.map((day, index) => (
            <View key={day.date} style={{ flexDirection: "row", gap: theme.spacing.md, paddingVertical: theme.spacing.md - 4, paddingHorizontal: theme.spacing.md, borderTopWidth: index === 0 ? 0 : theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
              <ThemedText variant="label" weight="bold" style={{ width: 92 }}>{formatShortDay(day.date, language, t)}</ThemedText>
              <View style={{ flex: 1, gap: theme.spacing.sm }}>
                {day.lines.map((line) => {
                  const off = line.state === "paused";
                  return (
                    <View key={line.lineId} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
                      <View style={{ flex: 1, gap: 1 }}>
                        <ThemedText variant="bodySmall" weight="semibold" style={{ color: off ? theme.colors.colorTextSecondary : theme.colors.colorTextPrimary, textDecorationLine: off ? "line-through" : "none" }}>
                          {line.slotName} · {formatClock(line.startTime)} × {line.quantity}
                        </ThemedText>
                        <ThemedText variant="caption" style={{ color: off ? theme.colors.colorHighlightText : theme.colors.colorTextSecondary }}>{t(`subs.day_${line.state}`)}</ThemedText>
                      </View>
                      {line.canChange ? (
                        <PressableScale accessibilityRole="button" accessibilityLabel={`${t("subs.skip")} ${formatShortDay(day.date, language, t)} ${line.slotName}`} disabled={busy} hitSlop={theme.spacing.sm} onPress={() => onSkip(day.date, line)} style={{ paddingHorizontal: theme.spacing.md - 4, paddingVertical: theme.spacing.xs + 2, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorSurfaceMuted, opacity: busy ? theme.opacity.disabled : theme.opacity.full }}>
                          <ThemedText variant="caption" weight="bold">{t("subs.skip")}</ThemedText>
                        </PressableScale>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
          {schedule.length > FIRST_DAYS && !showAll ? (
            <PressableScale accessibilityRole="button" onPress={() => setShowAll(true)} style={{ alignItems: "center", paddingVertical: theme.spacing.md - 2, borderTopWidth: theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
              <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorPrimary }}>{t("subs.showAllDays", { count: schedule.length })}</ThemedText>
            </PressableScale>
          ) : null}
        </Card>
      ) : null}
      {skipped > 0 ? (
        <Card padded={false}>
          <PressableScale accessibilityRole="button" accessibilityState={{ expanded: showSkipped }} onPress={() => setShowSkipped(!showSkipped)} style={{ minHeight: theme.layout.touchTargetMin, padding: theme.spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <ThemedText variant="label" weight="bold">{t("subs.skippedHistory", { count: skipped })}</ThemedText>
            <ThemedText>{showSkipped ? "▴" : "▾"}</ThemedText>
          </PressableScale>
          {showSkipped ? ranges.map(({ from, to, line }) => (
            <View key={`${line.lineId}-${from}`} style={{ gap: 2, padding: theme.spacing.md, borderTopWidth: theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
              <ThemedText variant="bodySmall" weight="semibold">
                {from === to ? formatDeliveryDate(from, language) : t("subs.skippedDateRange", { from: formatDeliveryDate(from, language), to: formatDeliveryDate(to, language) })}
              </ThemedText>
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{line.slotName} · {formatClock(line.startTime)} × {line.quantity} · {line.skipReason ? t(`subs.skip_${line.skipReason}`) : t("subs.day_skipped")}</ThemedText>
            </View>
          )) : null}
        </Card>
      ) : null}
    </View>
  );
}
