import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Card } from "../atoms/Card";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";
import { formatShortDay, formatClock } from "../../lib/deliveryText";
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

/**
 * The coming deliveries of one subscription, in one card: the date on the left, each window with its quantity, and a small Skip
 * while it can still change. The first week shows; the rest opens on request. A skip is final: there is no undo here.
 */
export function SubscriptionDayList({ busy, days, language, onSkip }: SubscriptionDayListProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? days : days.slice(0, FIRST_DAYS);
  if (days.length === 0) return null;

  return (
    <Card padded={false}>
      {shown.map((day, index) => (
        <View key={day.date} style={{ flexDirection: "row", gap: theme.spacing.md, paddingVertical: theme.spacing.md - 4, paddingHorizontal: theme.spacing.md, borderTopWidth: index === 0 ? 0 : theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
          <ThemedText variant="label" weight="bold" style={{ width: 92 }}>{formatShortDay(day.date, language, t)}</ThemedText>
          <View style={{ flex: 1, gap: theme.spacing.sm }}>
            {day.lines.map((line) => {
              const off = line.state === "skipped" || line.state === "paused";
              const stateText = line.state === "skipped" && line.skipReason ? t(`subs.skip_${line.skipReason}`) : t(`subs.day_${line.state}`);
              return (
                <View key={line.lineId} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
                  <View style={{ flex: 1, gap: 1 }}>
                    <ThemedText variant="bodySmall" weight="semibold" style={{ color: off ? theme.colors.colorTextSecondary : theme.colors.colorTextPrimary, textDecorationLine: off ? "line-through" : "none" }}>
                      {line.slotName} · {formatClock(line.startTime)} × {line.quantity}
                    </ThemedText>
                    <ThemedText variant="caption" style={{ color: off ? theme.colors.colorHighlightText : theme.colors.colorTextSecondary }}>{stateText}</ThemedText>
                  </View>
                  {line.canChange && line.state !== "skipped" ? (
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
      {days.length > FIRST_DAYS && !showAll ? (
        <PressableScale accessibilityRole="button" onPress={() => setShowAll(true)} style={{ alignItems: "center", paddingVertical: theme.spacing.md - 2, borderTopWidth: theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
          <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorPrimary }}>{t("subs.showAllDays", { count: days.length })}</ThemedText>
        </PressableScale>
      ) : null}
    </Card>
  );
}
