import { View } from "react-native";

import { useTheme } from "../../theme";
import type { AppLanguage } from "../../types/models";
import { ThemedText } from "../atoms/ThemedText";

/** "2026-10-17" as its parts, read as a calendar date (no timezone shift). */
function partsOf(date: string, language: AppLanguage) {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  const locale = language === "gu" ? "gu-IN" : "en-IN";
  return {
    weekday: value.toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" }),
    day: String(day),
    month: value.toLocaleDateString(locale, { month: "short", timeZone: "UTC" }),
  };
}

const TILE_WIDTH = 62;
const TILE_HEIGHT = 70;

function DayTile({ date, label, language }: { date: string; label: string; language: AppLanguage }) {
  const theme = useTheme();
  const parts = partsOf(date, language);
  return (
    <View accessible accessibilityLabel={`${label}: ${parts.weekday} ${parts.day} ${parts.month}`} style={{ alignItems: "center", gap: theme.spacing.xs }}>
      <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{label}</ThemedText>
      <View style={{ width: TILE_WIDTH, height: TILE_HEIGHT, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md, backgroundColor: theme.colors.colorNavigation }}>
        <ThemedText variant="badgeLabel" style={{ color: theme.colors.colorNavigationText }}>{parts.weekday}</ThemedText>
        <ThemedText variant="h1" weight="extrabold" style={{ color: theme.colors.colorTextInverse }}>{parts.day}</ThemedText>
        <ThemedText variant="badgeLabel" style={{ color: theme.colors.colorNavigationText }}>{parts.month}</ThemedText>
      </View>
    </View>
  );
}

interface DeliveryRangeProps {
  start: string;
  /** The last delivery day; without it only the first day shows. */
  end: string | null;
  firstLabel: string;
  lastLabel: string;
  /** What sits on the line between the two days, e.g. "12 deliveries". */
  middle?: string;
  /** A smaller line under it, e.g. the next delivery or the total. */
  middleDetail?: string;
  language: AppLanguage;
}

/** The first and last delivery day as two dark day tiles joined by a line, with the count (or the next delivery) on the line. */
export function DeliveryRange({ end, firstLabel, language, lastLabel, middle, middleDetail, start }: DeliveryRangeProps) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: theme.spacing.sm }}>
      <DayTile date={start} label={firstLabel} language={language} />
      <View style={{ flex: 1, height: TILE_HEIGHT, alignItems: "center", justifyContent: "center" }}>
        {/* The joining line, with a dot at each end, runs behind the label. */}
        <View style={{ position: "absolute", left: 0, right: 0, top: TILE_HEIGHT / 2 - 1, flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.colorNavigation }} />
          <View style={{ flex: 1, height: 2, backgroundColor: theme.colors.colorNavigation, opacity: 0.25 }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.colorNavigation }} />
        </View>
        {middle ? (
          <View style={{ alignItems: "center", paddingHorizontal: theme.spacing.sm, paddingVertical: 2, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
            <ThemedText variant="caption" weight="bold" numberOfLines={1}>{middle}</ThemedText>
          </View>
        ) : null}
        {middleDetail ? <ThemedText variant="badgeLabel" numberOfLines={1} style={{ position: "absolute", bottom: 0, color: theme.colors.colorTextSecondary, textAlign: "center" }}>{middleDetail}</ThemedText> : null}
      </View>
      {end ? <DayTile date={end} label={lastLabel} language={language} /> : null}
    </View>
  );
}
