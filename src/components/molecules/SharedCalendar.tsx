import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Easing, Pressable, View } from "react-native";

import { IconButton } from "../atoms/IconButton";
import { ThemedText } from "../atoms/ThemedText";
import { BackIcon, ForwardIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";

export type CalendarMode = "single" | "range";

export interface CalendarDateStatus {
  color: string;
  label: string;
}

interface SharedCalendarProps {
  mode: CalendarMode;
  month: Date;
  onMonthChange: (month: Date) => void;
  onDateSelect: (date: string) => void;
  selectedDate?: string;
  fromDate?: string;
  toDate?: string;
  minDate?: string;
  /** The latest day that can be picked; later days are greyed out. */
  maxDate?: string;
  /** Days that get a small dot under the number (for example the days a subscription delivers). */
  markedDates?: ReadonlySet<string>;
  dateStatuses?: Readonly<Record<string, CalendarDateStatus>>;
  legend?: readonly CalendarDateStatus[];
}

interface RangeSnapshot {
  fromDate?: string;
  toDate?: string;
}

interface RangeSegment {
  left: number;
  right: number;
}

const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function getRangeSegment(
  dates: (string | undefined)[],
  range: RangeSnapshot,
): RangeSegment | undefined {
  if (!range.fromDate || !range.toDate) return undefined;
  const start = range.fromDate <= range.toDate ? range.fromDate : range.toDate;
  const end = range.fromDate <= range.toDate ? range.toDate : range.fromDate;
  const columns = dates
    .map((date, index) => ({ date, index }))
    .filter(
      (cell): cell is { date: string; index: number } =>
        cell.date !== undefined && cell.date >= start && cell.date <= end,
    );
  if (columns.length === 0) return undefined;
  const firstDate = dates.find((date): date is string => date !== undefined);
  const lastDate = [...dates].reverse().find((date): date is string => date !== undefined);
  const left = firstDate && start < firstDate ? 0 : columns[0].index / 7;
  const lastColumn = columns[columns.length - 1];
  const right = lastDate && end > lastDate ? 1 : (lastColumn.index + 1) / 7;
  return { left, right };
}

export function SharedCalendar({
  dateStatuses,
  fromDate,
  legend,
  markedDates,
  maxDate,
  minDate,
  mode,
  month,
  onDateSelect,
  onMonthChange,
  selectedDate,
  toDate,
}: SharedCalendarProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [gridWidth, setGridWidth] = useState(0);
  const previousRange = useRef<RangeSnapshot>({ fromDate, toDate });
  const [rangeProgress] = useState(() => new Animated.Value(1));
  const [rangeTransition, setRangeTransition] = useState<{
    from: RangeSnapshot;
    to: RangeSnapshot;
  } | null>(null);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthLabel = month.toLocaleDateString(i18n.language, {
    month: "long",
    year: "numeric",
  });
  const firstOfMonth = new Date(year, monthIndex, 1);
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const cells = useMemo<(string | undefined)[]>(() => {
    const values: (string | undefined)[] = Array.from(
      { length: leadingDays },
      () => undefined,
    );
    for (let day = 1; day <= dayCount; day += 1) {
      values.push(dateKey(new Date(year, monthIndex, day)));
    }
    while (values.length % 7 !== 0) values.push(undefined);
    return values;
  }, [dayCount, leadingDays, monthIndex, year]);
  const weeks = useMemo(
    () => Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7)),
    [cells],
  );

  useLayoutEffect(() => {
    const next = { fromDate, toDate };
    const previous = previousRange.current;
    previousRange.current = next;
    if (mode !== "range" || (previous.fromDate === next.fromDate && previous.toDate === next.toDate)) return;

    rangeProgress.stopAnimation();
    rangeProgress.setValue(0);
    setRangeTransition({ from: previous, to: next });
    const animation = Animated.timing(rangeProgress, {
      toValue: 1,
      duration: theme.motion.duration.normal,
      easing: Easing.bezier(...theme.motion.easing.standard),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setRangeTransition(null);
    });
    return () => animation.stop();
  }, [fromDate, mode, rangeProgress, theme.motion.duration.normal, theme.motion.easing.standard, toDate]);

  const changeMonth = (delta: number) => {
    onMonthChange(new Date(year, monthIndex + delta, 1));
  };

  return (
    <View
      style={{
        padding: theme.spacing.md,
        gap: theme.spacing.md,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.colorSurface,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <IconButton icon={BackIcon} label={t("calendar.previous")} onPress={() => changeMonth(-1)} />
        <ThemedText variant="body" weight="semibold">{monthLabel}</ThemedText>
        <IconButton icon={ForwardIcon} label={t("calendar.next")} onPress={() => changeMonth(1)} />
      </View>
      <View style={{ flexDirection: "row" }}>
        {weekdays.map((day) => (
          <ThemedText key={day} variant="caption" style={{ flex: 1, textAlign: "center", color: theme.colors.colorTextSecondary }}>
            {t(`calendar.${day}`)}
          </ThemedText>
        ))}
      </View>
      <View
        onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
      >
        {weeks.map((week, weekIndex) => {
          const oldSegment = mode === "range" ? getRangeSegment(week, rangeTransition?.from ?? { fromDate, toDate }) : undefined;
          const newSegment = mode === "range" ? getRangeSegment(week, rangeTransition?.to ?? { fromDate, toDate }) : undefined;
          const shouldAnimate = Boolean(rangeTransition) && mode === "range";
          const start = oldSegment?.left ?? newSegment?.left ?? 0;
          const end = oldSegment?.right ?? newSegment?.right ?? start;
          const oldWidth = oldSegment ? oldSegment.right - oldSegment.left : 0;
          const newWidth = newSegment ? newSegment.right - newSegment.left : 0;
          const oldCenter = oldSegment ? (oldSegment.left + oldSegment.right) / 2 : start;
          const newCenter = newSegment ? (newSegment.left + newSegment.right) / 2 : end;
          const width = shouldAnimate
            ? rangeProgress.interpolate({ inputRange: [0, 1], outputRange: [oldWidth, newWidth] })
            : newWidth;
          const center = shouldAnimate
            ? rangeProgress.interpolate({ inputRange: [0, 1], outputRange: [oldCenter, newCenter] })
            : newCenter;
          const hasRange = Boolean(oldSegment || newSegment);

          return (
            <View key={weekIndex} style={{ flexDirection: "row", height: theme.layout.touchTargetMin, overflow: "hidden" }}>
              {hasRange ? (
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: (theme.layout.touchTargetMin - theme.sizes.avatarSm) / 2,
                    width: "100%",
                    height: theme.sizes.avatarSm,
                    borderRadius: theme.radii.pill,
                    backgroundColor: theme.colors.colorHighlightTint,
                    opacity: shouldAnimate
                      ? rangeProgress.interpolate({ inputRange: [0, 1], outputRange: [oldWidth > 0 ? theme.opacity.subdued : 0, newWidth > 0 ? theme.opacity.subdued : 0] })
                      : theme.opacity.subdued,
                    transform: [
                      {
                        translateX: Animated.multiply(
                          Animated.subtract(center, 0.5),
                          gridWidth,
                        ),
                      },
                      { scaleX: width },
                    ],
                  }}
                />
              ) : null}
              {week.map((date, dayIndex) => {
                const isEndpoint = mode === "range" && Boolean(date) && (date === fromDate || date === toDate);
                const rangeStart = fromDate && toDate && fromDate <= toDate ? fromDate : toDate;
                const rangeEnd = fromDate && toDate && fromDate <= toDate ? toDate : fromDate;
                const isBetweenRange = Boolean(
                  mode === "range" && date && rangeStart && rangeEnd &&
                  date > rangeStart && date < rangeEnd,
                );
                const status = date ? dateStatuses?.[date] : undefined;
                const isSelected = mode === "single" && Boolean(date) && date === selectedDate;
                const isDisabled = Boolean((date && minDate && date < minDate) || (date && maxDate && date > maxDate));
                const isMarked = Boolean(date && markedDates?.has(date) && !isDisabled);
                const label = date
                  ? new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" })
                  : "";
                const dateCircleSize = isEndpoint
                  ? theme.sizes.avatarSm + theme.spacing.xs
                  : theme.sizes.avatarSm;
                return date ? (
                  <Pressable
                    key={date}
                    accessibilityRole="button"
                    accessibilityLabel={status ? `${label}, ${status.label}` : label}
                    accessibilityState={{ selected: isSelected || isEndpoint, disabled: isDisabled }}
                    disabled={isDisabled}
                    onPress={() => onDateSelect(date)}
                    style={({ pressed }) => ({ flex: 1, alignItems: "center", justifyContent: "center", opacity: isDisabled ? theme.opacity.disabled : pressed ? theme.opacity.subdued : theme.opacity.full })}
                  >
                    <View
                      style={{
                        width: dateCircleSize,
                        height: dateCircleSize,
                        borderRadius: theme.radii.pill,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: mode === "single" && isSelected ? theme.borderWidths.medium : theme.borderWidths.none,
                        borderColor: theme.colors.colorPrimary,
                        backgroundColor: isDisabled
                          ? theme.colors.colorSurfaceDisabled
                          : isEndpoint
                            ? theme.colors.colorPrimary
                            : isBetweenRange
                              ? theme.colors.colorTransparent
                            : status?.color ?? theme.colors.colorSurface,
                      }}
                    >
                      <ThemedText
                        variant="caption"
                        weight={mode === "single" || isEndpoint || isSelected ? "semibold" : "regular"}
                        style={{ color: isDisabled ? theme.colors.colorTextDisabled : isEndpoint || status ? theme.colors.colorTextInverse : theme.colors.colorTextPrimary }}
                      >
                        {new Date(`${date}T12:00:00`).getDate()}
                      </ThemedText>
                    </View>
                    {isMarked ? <View pointerEvents="none" style={{ position: "absolute", bottom: 1, width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.colorPrimary }} /> : null}
                  </Pressable>
                ) : (
                  <View key={`blank-${weekIndex}-${dayIndex}`} style={{ flex: 1 }} />
                );
              })}
            </View>
          );
        })}
      </View>
      {legend?.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {legend.map((item) => (
            <View key={item.label} style={{ flexDirection: "row", gap: theme.spacing.xs, alignItems: "center" }}>
              <View style={{ width: theme.spacing.sm, height: theme.spacing.sm, borderRadius: theme.radii.pill, backgroundColor: item.color }} />
              <ThemedText variant="caption">{item.label}</ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
