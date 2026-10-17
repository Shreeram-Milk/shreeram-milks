import { useEffect, useMemo, useState, type PropsWithChildren, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";

import { formatRupees } from "../../lib/catalogCart";
import { addDaysTo, formatOrderBy, formatShortDay, formatWindow } from "../../lib/deliveryText";
import { deliveriesUpTo, firstDeliveryOnOrAfter, isDeliveryDay, lastDeliveryDate } from "../../lib/subscriptionSchedule";
import { useTheme } from "../../theme";
import type { CatalogProductDetail } from "../../types/catalog";
import type { ServedSlot } from "../../types/delivery";
import type { AppLanguage } from "../../types/models";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { PressableScale } from "../atoms/PressableScale";
import { Skeleton } from "../atoms/Skeleton";
import { RadioDot } from "../atoms/RadioDot";
import { ThemedText } from "../atoms/ThemedText";
import { DeliveryRange } from "../molecules/DeliveryRange";
import { QuantityStepper } from "../molecules/QuantityStepper";
import { SegmentedTabs } from "../molecules/SegmentedTabs";
import { SharedCalendar } from "../molecules/SharedCalendar";
import { SubscriptionBottomSheet } from "./SubscriptionBottomSheet";

/** What the customer picked for a subscription or trial on the product page. The server prices and checks it at the review step. */
export interface SubscribeChoice {
  ruleId: string | null;
  /** A quick choice (a number of deliveries), or null. */
  quick: number | null;
  /** The last day picked on the calendar, or null. When set it wins over a quick choice. */
  endDate: string | null;
  trialPlanId: string | null;
  /** 1 = Monday ... 7 = Sunday, for "chosen weekdays" rules. */
  weekdays: number[];
  /** Quantity per delivery window; a window at 0 is not chosen. */
  quantities: Record<string, number>;
}

export const emptyChoice: SubscribeChoice = { ruleId: null, quick: null, endDate: null, trialPlanId: null, weekdays: [1, 2, 3, 4, 5, 6, 7], quantities: {} };
const MAX_PER_SLOT = 20;
const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type Rule = CatalogProductDetail["subscriptionRules"][number];

/**
 * The plan the choice resolves to, with defaults filled in (the first rule, the first trial pack, a plan length). It always
 * starts on the earliest day the chosen windows allow: today when a same-day cut-off is still open, otherwise the next day it
 * can. The last day is picked on a calendar (or by a quick choice); the deliveries are the schedule's days up to it. This is a
 * preview: the server counts and prices again.
 */
export function resolveChoice(choice: SubscribeChoice, kind: "subscription" | "trial", product: Pick<CatalogProductDetail, "subscriptionRules" | "trialPlans">, slots: ServedSlot[]) {
  const rule: Rule | undefined = product.subscriptionRules.find((item) => item.id === choice.ruleId) ?? product.subscriptionRules[0];
  const trial = kind === "trial" ? (product.trialPlans.find((item) => item.id === choice.trialPlanId) ?? product.trialPlans[0]) : undefined;
  const trialPlanId = trial?.id ?? null;
  // A window the customer has not touched starts at 1 when it is the only one, so the simplest case needs no tap.
  const quantities = Object.keys(choice.quantities).length === 0 && slots.length === 1 && slots[0] ? { [slots[0].slotId]: 1 } : choice.quantities;
  const lines = slots.filter((slot) => (quantities[slot.slotId] ?? 0) > 0).map((slot) => ({ slotId: slot.slotId, quantity: quantities[slot.slotId] ?? 0 }));
  const chosenSlots = slots.filter((slot) => lines.some((line) => line.slotId === slot.slotId));
  const earliest = (chosenSlots.length > 0 ? chosenSlots : slots).map((slot) => slot.earliestDate).sort().at(-1) ?? null;
  const weekdays = kind === "subscription" && rule?.systemType === "custom_weekdays" ? choice.weekdays : [];
  const scheduleType = kind === "trial" ? "daily" : (rule?.systemType ?? "daily");
  // On "chosen weekdays" the first delivery is the first chosen weekday on or after the earliest day.
  const startDate = earliest && scheduleType === "custom_weekdays" ? (weekdays.length ? Array.from({ length: 7 }, (_, index) => addDaysTo(earliest, index)).find((date) => isDeliveryDay(date, earliest, "custom_weekdays", weekdays)) ?? earliest : earliest) : earliest;

  // The earliest and latest last day the rule allows, and the quick choices that fit between them.
  const maxLast = startDate ? addDaysTo(startDate, (kind === "trial" ? 365 : (rule?.maxDays ?? 365)) - 1) : null;
  // The shortest plan is measured to its last delivery day, so a minimum that lands on a day without delivery rounds up to the next one.
  const minLast = startDate && maxLast ? firstDeliveryOnOrAfter(addDaysTo(startDate, (kind === "trial" ? 1 : (rule?.minDays ?? 1)) - 1), startDate, scheduleType, weekdays, maxLast) : null;
  const quickOptions = startDate && minLast && maxLast && rule
    ? rule.lengthOptions.filter((count) => { const last = lastDeliveryDate(startDate, count, scheduleType, weekdays); return Boolean(last && last >= minLast && last <= maxLast); })
    : [];

  let wanted: string | null = null;
  if (startDate && minLast && maxLast) {
    if (kind === "trial") wanted = trial ? lastDeliveryDate(startDate, trial.durationDays, "daily", []) : null;
    else if (choice.endDate) wanted = choice.endDate < minLast ? minLast : choice.endDate > maxLast ? maxLast : choice.endDate;
    else {
      const quick = choice.quick !== null && quickOptions.includes(choice.quick) ? choice.quick : quickOptions[0];
      wanted = quick !== undefined ? lastDeliveryDate(startDate, quick, scheduleType, weekdays) : minLast;
    }
  }
  const counted = startDate && wanted ? deliveriesUpTo(startDate, wanted, scheduleType, weekdays) : { count: 0, lastDate: null };
  const deliveries = counted.count > 0 ? counted.count : null;
  const endDate = counted.lastDate;
  const quickSelected = startDate && endDate ? (quickOptions.find((count) => lastDeliveryDate(startDate, count, scheduleType, weekdays) === endDate) ?? null) : null;
  const perDelivery = lines.reduce((sum, line) => sum + line.quantity, 0);
  const ready = Boolean(deliveries && startDate && endDate && lines.length > 0 && (kind === "trial" ? trialPlanId : rule) && (weekdays.length > 0 || rule?.systemType !== "custom_weekdays" || kind === "trial"));
  return { rule, deliveries, trialPlanId, quantities, lines, startDate, endDate, earliest, weekdays, scheduleType, minLast, maxLast, quickOptions, quickSelected, perDelivery, ready };
}

interface SubscribeSetupProps {
  kind: "subscription" | "trial";
  product: Pick<CatalogProductDetail, "subscriptionRules" | "trialPlans">;
  unitPricePaise: number;
  slots: ServedSlot[];
  language: AppLanguage;
  choice: SubscribeChoice;
  onChange: (choice: SubscribeChoice) => void;
}

/**
 * Setting up a subscription or trial: the schedule and length (or trial pack), the weekdays for a "chosen days" rule, and how
 * many of each delivery window. It starts on the earliest possible day, shown with the last day. Prices are a preview.
 */
export function SubscribeSetup({ kind, product, unitPricePaise, slots, language, choice, onChange }: SubscribeSetupProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolved = resolveChoice(choice, kind, product, slots);
  const set = (patch: Partial<SubscribeChoice>) => onChange({ ...choice, quantities: resolved.quantities, ...patch });
  const [lengthOpen, setLengthOpen] = useState(false);
  // The last day being tried in the drawer; it is only kept when the customer confirms.
  const [pendingEnd, setPendingEnd] = useState<string | null>(null);

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {kind === "trial" ? (
        <Section title={t("subs.trialPack")}>
          <TrialCards plans={product.trialPlans} selectedId={resolved.trialPlanId} pricePaise={unitPricePaise * Math.max(1, resolved.perDelivery)} onSelect={(id) => set({ trialPlanId: id })} />
        </Section>
      ) : (
        <>
          {product.subscriptionRules.length > 1 ? (
            <Section title={t("subs.schedule")}>
              <SegmentedTabs
                tabs={product.subscriptionRules.map((rule) => ({ key: rule.id, label: rule.name || t(`subs.schedule_${rule.systemType}`) }))}
                value={resolved.rule?.id ?? ""}
                onChange={(ruleId) => set({ ruleId, quick: null, endDate: null })}
              />
            </Section>
          ) : resolved.rule ? <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.scheduleIs", { schedule: t(`subs.schedule_${resolved.rule.systemType}`) })}</ThemedText> : null}
          {resolved.rule && resolved.startDate && resolved.endDate ? (
            <Section title={t("subs.length")}>
              <Pressable accessibilityRole="button" accessibilityLabel={`${t("subs.length")}: ${t("subs.deliveriesUntil", { count: resolved.deliveries ?? 0, date: formatShortDay(resolved.endDate, language, t) })}`} onPress={() => { setPendingEnd(resolved.endDate); setLengthOpen(true); }} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md, minHeight: theme.layout.touchTargetMin + 8, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText variant="bodySmall" weight="bold">{t("subs.deliveries", { count: resolved.deliveries ?? 0 })}</ThemedText>
                  <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.fromTo", { from: formatShortDay(resolved.startDate, language, t), to: formatShortDay(resolved.endDate, language, t) })}</ThemedText>
                </View>
                <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorPrimary }}>{t("subs.change")}</ThemedText>
              </Pressable>
              <LengthDrawer
                visible={lengthOpen}
                onClose={() => setLengthOpen(false)}
                language={language}
                start={resolved.startDate}
                type={resolved.scheduleType}
                weekdays={resolved.weekdays}
                minLast={resolved.minLast ?? resolved.startDate}
                maxLast={resolved.maxLast ?? resolved.startDate}
                minDays={resolved.rule.minDays}
                maxDays={resolved.rule.maxDays}
                quickOptions={resolved.quickOptions}
                pricePaise={unitPricePaise * Math.max(1, resolved.perDelivery)}
                pending={pendingEnd ?? resolved.endDate}
                onPending={setPendingEnd}
                onApply={(endDate) => { set({ endDate, quick: null }); setLengthOpen(false); }}
              />
            </Section>
          ) : null}
          {resolved.rule?.systemType === "custom_weekdays" ? (
            <Section title={t("subs.whichDays")}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs }}>
                {WEEKDAY_KEYS.map((key, index) => {
                  const day = index + 1;
                  const selected = choice.weekdays.includes(day);
                  return <Pressable key={key} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={t(`subs.weekday_${key}`)} onPress={() => set({ weekdays: selected ? choice.weekdays.filter((item) => item !== day) : [...choice.weekdays, day].sort() })} style={({ pressed }) => ({ flexGrow: 1, flexBasis: "12%", aspectRatio: 1, maxWidth: 56, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md, borderWidth: theme.borderWidths.hairline, borderColor: selected ? theme.colors.colorAccent : theme.colors.colorBorder, backgroundColor: selected ? theme.colors.colorAccent : theme.colors.colorSurface, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}><ThemedText variant="caption" weight="semibold" style={{ color: selected ? theme.colors.colorTextInverse : theme.colors.colorTextPrimary }}>{t(`subs.weekdayShort_${key}`)}</ThemedText></Pressable>;
                })}
              </View>
              {choice.weekdays.length === 0 ? <ThemedText variant="caption" style={{ color: theme.colors.colorDanger }}>{t("subs.pickADay")}</ThemedText> : null}
            </Section>
          ) : null}
        </>
      )}
      <Section title={t("subs.windows")}>
        {slots.length === 0 ? <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.noWindows")}</ThemedText> : (
          <Card padded={false}>
            {slots.map((slot, index) => {
              const quantity = resolved.quantities[slot.slotId] ?? 0;
              const orderBy = formatOrderBy(slot.orderBy, language, t);
              const setQuantity = (next: number) => set({ quantities: { ...resolved.quantities, [slot.slotId]: Math.min(MAX_PER_SLOT, Math.max(0, next)) } });
              return (
                <View key={slot.slotId} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md, borderTopWidth: index === 0 ? 0 : theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <ThemedText variant="bodySmall" weight="semibold">{slot.name}</ThemedText>
                    <ThemedText variant="caption" style={{ color: theme.colors.colorTextPrimary }}>{formatWindow(slot.startTime, slot.endTime)}{quantity > 0 ? ` · ${formatRupees(unitPricePaise * quantity)}` : ""}</ThemedText>
                    {orderBy ? <ThemedText variant="caption" numberOfLines={2} style={{ color: theme.colors.colorTextSecondary }}>{orderBy}</ThemedText> : null}
                  </View>
                  {quantity > 0 ? (
                    <QuantityStepper value={quantity} onDecrement={() => setQuantity(quantity - 1)} onIncrement={() => setQuantity(quantity + 1)} />
                  ) : (
                    <PressableScale accessibilityRole="button" accessibilityLabel={`${t("productCard.add")} ${slot.name}`} onPress={() => setQuantity(1)} pressScale={theme.motion.pressScale.compactControl} style={{ minWidth: 76, height: theme.sizes.quantityStepperHeight - 2, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.md - 2, borderRadius: theme.radii.md - 2, backgroundColor: theme.colors.colorPrimaryTint }}>
                      <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorPrimary, letterSpacing: 0.4 }}>{t("productCard.add")}</ThemedText>
                    </PressableScale>
                  )}
                </View>
              );
            })}
          </Card>
        )}
      </Section>
      {resolved.startDate ? (
        <Section title={t("subs.whenTitle")}>
          <DeliveryRange
            start={resolved.startDate}
            end={resolved.endDate}
            firstLabel={t("subs.firstDelivery")}
            lastLabel={t("subs.lastDelivery")}
            middle={t("subs.deliveries", { count: resolved.deliveries ?? 0 })}
            language={language}
          />
        </Section>
      ) : null}
    </View>
  );
}

interface LengthDrawerProps {
  visible: boolean;
  onClose: () => void;
  language: AppLanguage;
  start: string;
  type: "daily" | "alternate_days" | "custom_weekdays";
  weekdays: number[];
  minLast: string;
  maxLast: string;
  minDays: number;
  maxDays: number;
  quickOptions: number[];
  /** The price of one delivery of everything chosen (all windows). */
  pricePaise: number;
  pending: string;
  onPending: (endDate: string) => void;
  onApply: (endDate: string) => void;
}

/**
 * The plan-length drawer. The first delivery day is fixed; the customer taps the last day on a calendar (days that deliver carry a
 * dot, days outside the rule's shortest and longest plan are greyed out) or taps a quick choice. A card at the top shows the first
 * and last day as day tiles, how many deliveries that is, and the total, updating as they tap.
 */
function LengthDrawer({ visible, onClose, language, start, type, weekdays, minLast, maxLast, minDays, maxDays, quickOptions, pricePaise, pending, onPending, onApply }: LengthDrawerProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const [month, setMonth] = useState(() => new Date(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1, 1));
  const marked = useMemo(() => {
    const days = new Set<string>();
    for (let date = start; date <= maxLast; date = addDaysTo(date, 1)) if (isDeliveryDay(date, start, type, weekdays)) days.add(date);
    return days;
  }, [start, maxLast, type, weekdays]);
  const counted = deliveriesUpTo(start, pending, type, weekdays);
  const last = counted.lastDate ?? pending;
  const select = (date: string) => onPending(date < minLast ? minLast : date > maxLast ? maxLast : date);
  // The note turns amber when the pick sits at the shortest or longest plan the rule allows.
  const atLimit = pending === minLast || pending === maxLast;

  return (
    <SubscriptionBottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xs, paddingRight: theme.layout.touchTargetMin }}>
          <ThemedText variant="h2">{t("subs.pickEndTitle")}</ThemedText>
          <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.pickEndDetail")}</ThemedText>
        </View>
        <ScrollView style={{ maxHeight: height * 0.62 }} contentContainerStyle={{ gap: theme.spacing.md }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <DeliveryRange
            start={start}
            end={last}
            firstLabel={t("subs.firstDelivery")}
            lastLabel={t("subs.lastDelivery")}
            middle={t("subs.deliveries", { count: counted.count })}
            middleDetail={formatRupees(pricePaise * counted.count)}
            language={language}
          />
          {quickOptions.length > 0 ? (
            <View style={{ gap: theme.spacing.xs }}>
              <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.quickChoices")}</ThemedText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
                {quickOptions.map((count) => {
                  const lastOfQuick = lastDeliveryDate(start, count, type, weekdays);
                  const selected = lastOfQuick !== null && lastOfQuick === counted.lastDate;
                  return (
                    <Pressable key={count} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => lastOfQuick && onPending(lastOfQuick)} style={({ pressed }) => ({ minHeight: theme.layout.touchTargetMin - 8, justifyContent: "center", paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.pill, borderWidth: 1.5, borderColor: selected ? theme.colors.colorAccent : theme.colors.colorBorder, backgroundColor: selected ? theme.colors.colorAccentTint : theme.colors.colorSurface, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}>
                      <ThemedText variant="caption" weight="semibold" style={{ color: selected ? theme.colors.colorAccent : theme.colors.colorTextPrimary }}>{t("subs.deliveries", { count })}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
          <AfterOpen fallback={<Skeleton height={320} radius={theme.radii.lg} />}>
          <SharedCalendar
            mode="range"
            month={month}
            onMonthChange={setMonth}
            fromDate={start}
            toDate={last}
            minDate={start}
            maxDate={maxLast}
            markedDates={marked}
            onDateSelect={select}
            legend={[{ color: theme.colors.colorPrimary, label: t(`subs.dot_${type}`) }]}
          />
          </AfterOpen>
          <ThemedText variant="caption" style={{ color: atLimit ? theme.colors.colorWarning : theme.colors.colorTextSecondary }}>{t("subs.limitsNote", { min: minDays, max: maxDays })}</ThemedText>
        </ScrollView>
        <Button disabled={counted.count < 1} onPress={() => onApply(last)}>{t("subs.useDeliveries", { count: counted.count })}</Button>
      </View>
    </SubscriptionBottomSheet>
  );
}

/** The trial packs as cards: the days, what the pack costs in total, and a radio dot. */
function TrialCards({ plans, selectedId, pricePaise, onSelect }: { plans: { id: string; name: string; durationDays: number }[]; selectedId: string | null; pricePaise: number; onSelect: (id: string) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: theme.spacing.sm }}>
      {plans.map((item) => {
        const active = item.id === selectedId;
        const title = t("productDetails.trialDays", { count: item.durationDays });
        const detail = t("productDetails.trialDetail", { count: item.durationDays, total: formatRupees(pricePaise * item.durationDays) });
        // Admins often name a plan just "2-Day"; that only repeats the title, so it is left out.
        const showName = item.name.replace(/\D/g, "") !== String(item.durationDays);
        return (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${title}, ${detail}`}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => ({ width: "48%", gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, borderWidth: 1.5, borderColor: active ? theme.colors.colorAccent : theme.colors.colorBorder, backgroundColor: active ? theme.colors.colorAccentTint : theme.colors.colorSurface, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.sm }}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText variant="bodySmall" weight="bold">{title}</ThemedText>
                {showName ? <ThemedText variant="caption" numberOfLines={2} style={{ color: theme.colors.colorTextSecondary }}>{item.name}</ThemedText> : null}
              </View>
              <RadioDot selected={active} />
            </View>
            <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{detail}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Shows its content only after the drawer's slide-up has finished (a placeholder until then), so heavy content never stutters the slide. */
function AfterOpen({ children, fallback }: PropsWithChildren<{ fallback: ReactNode }>) {
  const theme = useTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), theme.motion.duration.overlay);
    return () => clearTimeout(timer);
  }, [theme.motion.duration.overlay]);
  return <>{ready ? children : fallback}</>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md - 4 }}>
      <ThemedText variant="body" weight="bold">{title}</ThemedText>
      {children}
    </View>
  );
}
