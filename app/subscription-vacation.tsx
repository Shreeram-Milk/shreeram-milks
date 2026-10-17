import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/atoms/Button";
import { IconButton } from "../src/components/atoms/IconButton";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { SharedCalendar } from "../src/components/molecules/SharedCalendar";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useCatalogProduct } from "../src/hooks/useCatalog";
import { useMySubscriptions } from "../src/hooks/useSubscriptions";
import { BackIcon } from "../src/icons/appIcons";
import { localized } from "../src/lib/contentLocalization";
import { addDaysTo, formatDeliveryDate, indiaToday } from "../src/lib/deliveryText";
import { describeError } from "../src/services/errorMapper";
import { changeMySubscription } from "../src/services/subscriptionService";
import { queryKeys } from "../src/services/queryKeys";
import { useAppStore } from "../src/store/useAppStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { useTheme } from "../src/theme";
import type { Subscription } from "../src/types/subscriptions";

type Step = "products" | "dates" | "success";
type DateField = "pause" | "resume";

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
/** The days a plan can still be paused on: from its first day that can still change to its last delivery day. Null when nothing can change. */
function pauseWindow(subscription: Subscription): { start: string; end: string } | null {
  const start = subscription.days.find((day) => day.lines.some((line) => line.canChange))?.date;
  // The list of coming days is only the next few weeks, so the plan's own last delivery day is the true end.
  const end = subscription.endDate ?? subscription.days[subscription.days.length - 1]?.date;
  return start && end ? { start, end } : null;
}
const monthOf = (date: string) => new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, 1);

/**
 * A vacation: choose the subscriptions, then on the calendar the first day without delivery and the day deliveries come back.
 * Paused days are never lost: they are added at the end. With `mode=resume` it restarts a paused subscription on a chosen day.
 */
export default function SubscriptionVacationScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const resuming = params.mode === "resume";
  const { data = [], isLoading } = useMySubscriptions();
  const client = useQueryClient();
  const customerId = useSessionStore((state) => state.customer?.id ?? "");
  const lang = useAppStore((state) => state.language);
  // Only live subscriptions without a pause already running can take a vacation.
  const choices = data.filter((item) => (item.status === "active" || item.status === "paused") && (resuming ? item.id === id : !item.openPause));
  const single = Boolean(id) || choices.length === 1;
  const [step, setStep] = useState<Step>(single || resuming ? "dates" : "products");
  const [selectedIds, setSelectedIds] = useState<string[] | null>(id ? [id] : null);
  const chosen = selectedIds ?? choices.map((item) => item.id);
  const today = indiaToday();
  const [activeField, setActiveField] = useState<DateField>("pause");
  // A vacation can only fall inside the days the chosen subscriptions still have deliveries (each plan's own limits are checked on confirm).
  const windows = data.filter((item) => chosen.includes(item.id)).map(pauseWindow).filter((item): item is { start: string; end: string } => item !== null);
  const windowStart = windows.length > 0 ? windows.reduce((first, item) => (item.start < first ? item.start : first), windows[0].start) : addDaysTo(today, 1);
  const windowEnd = windows.length > 0 ? windows.reduce((last, item) => (item.end > last ? item.end : last), windows[0].end) : addDaysTo(today, 1);
  // The day deliveries come back may be the day after the last delivery (a vacation to the very end).
  const lastResume = addDaysTo(windowEnd, 1);
  const [pickedPause, setPickedPause] = useState<string | null>(null);
  const [pickedResume, setPickedResume] = useState<string | null>(null);
  const pauseDate = pickedPause !== null && pickedPause >= windowStart && pickedPause <= windowEnd ? pickedPause : windowStart;
  const resumeDate = pickedResume !== null && pickedResume > pauseDate && pickedResume <= lastResume ? pickedResume : addDaysTo(pauseDate, 1) <= lastResume ? addDaysTo(pauseDate, 1) : lastResume;
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const duration = daysBetween(pauseDate, resumeDate);
  // Vacations already set on the chosen subscriptions, shown in the list and on the calendar so nobody pauses them twice.
  const existingPauses = data.filter((item) => chosen.includes(item.id)).flatMap((item) => item.pauses.filter((pause) => (pause.untilDate ?? pause.fromDate) >= today).map((pause) => ({ ...pause, name: localized(item.productName, item.productNameGu, lang) })));
  const pausedDays: Record<string, { color: string; label: string }> = {};
  for (const pause of existingPauses) {
    for (let date = pause.fromDate; date <= (pause.untilDate ?? pause.fromDate) && Object.keys(pausedDays).length < 400; date = addDaysTo(date, 1)) pausedDays[date] = { color: theme.colors.colorWarning, label: t("subs.alreadyPaused") };
  }

  const toggle = (subscriptionId: string) => setSelectedIds(chosen.includes(subscriptionId) ? chosen.filter((item) => item !== subscriptionId) : [...chosen, subscriptionId]);
  const selectDate = (date: string) => {
    if (date < today) return;
    if (resuming) { setPickedResume(date); return; }
    if (date < windowStart || date > lastResume) return;
    if (activeField === "pause") {
      if (date > windowEnd) return;
      setPickedPause(date);
      if (date >= resumeDate) setPickedResume(addDaysTo(date, 1));
      setActiveField("resume");
    } else if (date > pauseDate) setPickedResume(date);
  };

  const confirm = async () => {
    setBusy(true);
    setFailure(null);
    const problems: string[] = [];
    for (const subscriptionId of resuming && id ? [id] : chosen) {
      const own = data.find((item) => item.id === subscriptionId);
      const ownWindow = own ? pauseWindow(own) : null;
      if (!resuming && ownWindow && (pauseDate > ownWindow.end || addDaysTo(resumeDate, -1) < ownWindow.start)) {
        problems.push(`${localized(own!.productName, own!.productNameGu, lang)}: ${t("subs.outsideWindow")}`);
        continue;
      }
      try {
        await changeMySubscription(subscriptionId, resuming ? { type: "resume", fromDate: resumeDate } : { type: "pause", fromDate: pauseDate, untilDate: addDaysTo(resumeDate, -1) });
      } catch (error) {
        const earliest = (error as { details?: { earliestDate?: unknown } }).details?.earliestDate;
        const subscription = data.find((item) => item.id === subscriptionId);
        const label = subscription ? localized(subscription.productName, subscription.productNameGu, lang) : "";
        problems.push(`${label}: ${typeof earliest === "string" ? t("subs.earliestIs", { date: formatDeliveryDate(earliest, lang) }) : describeError(error)}`);
      }
    }
    await Promise.all([client.invalidateQueries({ queryKey: queryKeys.subscriptions(customerId) }), client.invalidateQueries({ queryKey: queryKeys.deliveries(customerId) }), client.invalidateQueries({ queryKey: queryKeys.orders(customerId) })]);
    setBusy(false);
    if (problems.length > 0) setFailure(problems.join("\n"));
    else setStep("success");
  };

  if (isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}><StateMessage type="loading" title={t("subs.loading")} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.layout.screenHorizontalPadding, paddingVertical: theme.spacing.md, borderBottomWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
          <IconButton icon={BackIcon} label={t("subscriptionVacation.back")} onPress={() => (step === "dates" && !single && !resuming ? setStep("products") : router.back())} />
          <ThemedText variant="body" weight="semibold">{step === "success" ? t(resuming ? "subs.resumedTitle" : "subscriptionVacation.confirmedTitle") : t(resuming ? "subs.resumeTitle" : "subscriptionVacation.title")}</ThemedText>
          <View style={{ width: theme.layout.touchTargetMin }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: theme.spacing.lg, padding: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.lg }} showsVerticalScrollIndicator={false}>
          {resuming ? null : <Progress current={step === "products" ? 1 : step === "dates" ? 2 : 3} />}
          {step === "products" ? (
            <>
              <View style={{ gap: theme.spacing.xs }}>
                <ThemedText variant="body" weight="semibold">{t("subscriptionVacation.pauseDeliveries")}</ThemedText>
                <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("subscriptionVacation.pauseDetail")}</ThemedText>
              </View>
              {choices.length === 0 ? <StateMessage type="empty" title={t("subs.nothingToPause")} /> : null}
              <View style={{ gap: theme.spacing.sm }}>{choices.map((item) => <ChoiceRow key={item.id} subscription={item} selected={chosen.includes(item.id)} onToggle={() => toggle(item.id)} />)}</View>
              <InfoCard />
            </>
          ) : null}
          {step === "dates" ? (
            <>
              <View style={{ gap: theme.spacing.xs }}>
                <ThemedText variant="body" weight="semibold">{t(resuming ? "subs.restartOn" : "subscriptionVacation.selectDates")}</ThemedText>
                <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t(resuming ? "subs.resumeDetail" : "subs.vacationDatesDetail")}</ThemedText>
              </View>
              {resuming ? null : (
                <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                  <DateCard active={activeField === "pause"} label={t("subs.noDeliveryFrom")} value={pauseDate} onPress={() => setActiveField("pause")} />
                  <DateCard active={activeField === "resume"} label={t("subs.deliveriesBackOn")} value={resumeDate} onPress={() => setActiveField("resume")} />
                </View>
              )}
              {!resuming && existingPauses.length > 0 ? (
                <View style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorWarningTint }}>
                  <ThemedText variant="bodySmall" weight="semibold">{t("subs.alreadyPausedTitle")}</ThemedText>
                  {existingPauses.map((pause) => <ThemedText key={pause.id} variant="caption">• {pause.name}: {formatDeliveryDate(pause.fromDate, lang)} – {pause.untilDate ? formatDeliveryDate(pause.untilDate, lang) : t("subs.untilResume")}</ThemedText>)}
                </View>
              ) : null}
              {resuming ? null : <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.windowHint", { from: formatDeliveryDate(windowStart, lang), to: formatDeliveryDate(windowEnd, lang) })}</ThemedText>}
              <CalendarPicker resuming={resuming} pauseDate={pauseDate} resumeDate={resumeDate} minDate={resuming ? today : windowStart} maxDate={resuming ? undefined : lastResume} onDateSelect={selectDate} pausedDays={resuming ? undefined : pausedDays} />
              {resuming ? null : (
                <View style={{ flexDirection: "row", justifyContent: "space-between", padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorHighlightTint }}>
                  <ThemedText variant="bodySmall" weight="semibold">{t("subscriptionVacation.totalDuration")}</ThemedText>
                  <ThemedText variant="bodySmall" weight="semibold">{t("subscriptionVacation.durationDays", { count: duration })}</ThemedText>
                </View>
              )}
              {failure ? <View accessibilityRole="alert" style={{ padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorDangerTint }}><ThemedText variant="caption" style={{ color: theme.colors.colorDanger }}>{failure}</ThemedText></View> : null}
              <InfoCard />
            </>
          ) : null}
          {step === "success" ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.md, paddingTop: theme.spacing.xl }}>
              <View style={{ width: theme.sizes.avatarLg * 2, height: theme.sizes.avatarLg * 2, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorPrimary }}>
                <ThemedText variant="h1" style={{ color: theme.colors.colorTextInverse }}>✓</ThemedText>
              </View>
              <ThemedText variant="h2">{t(resuming ? "subs.resumedTitle" : "subscriptionVacation.successTitle")}</ThemedText>
              <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>
                {resuming ? t("subs.restartSummary", { date: formatDeliveryDate(resumeDate, lang) }) : t("subscriptionVacation.successDetail", { pauseDate: formatDeliveryDate(pauseDate, lang), resumeDate: formatDeliveryDate(resumeDate, lang) })}
              </ThemedText>
            </View>
          ) : null}
        </ScrollView>
        <View style={{ paddingHorizontal: theme.layout.screenHorizontalPadding, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.colorBackground }}>
          {step === "products" ? <Button disabled={chosen.length === 0} onPress={() => setStep("dates")}>{t("subscriptionVacation.continueDates")} →</Button> : null}
          {step === "dates" ? <Button loading={busy} disabled={!resuming && duration <= 0} onPress={() => void confirm()}>{resuming ? t("subs.resumeButton") : t("subscriptionVacation.confirmDays", { count: duration })}</Button> : null}
          {step === "success" ? <Button onPress={() => router.back()}>{t("subscriptionVacation.backToSubscriptions")}</Button> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Progress({ current }: { current: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("subscriptionVacation.step", { current })}</ThemedText>
      <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
        {[1, 2, 3].map((item) => <View key={item} style={{ flex: 1, height: theme.spacing.xs, borderRadius: theme.radii.pill, backgroundColor: item <= current ? theme.colors.colorPrimary : theme.colors.colorBorder }} />)}
      </View>
    </View>
  );
}

function ChoiceRow({ subscription, selected, onToggle }: { subscription: Subscription; selected: boolean; onToggle: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const lang = useAppStore((state) => state.language);
  const { data: product } = useCatalogProduct(subscription.productId);
  const name = localized(subscription.productName, subscription.productNameGu, lang);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.sm, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface }}>
      <Image source={product?.imageUrl ? { uri: product.imageUrl } : require("../assets/onboarding-milk-hero.png")} contentFit="cover" style={{ width: theme.sizes.avatarLg, height: theme.sizes.avatarLg, borderRadius: theme.radii.md }} />
      <View style={{ flex: 1 }}>
        <ThemedText variant="bodySmall" weight="semibold">{name}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{subscription.variantName} · {subscription.lines.map((line) => `${line.slotName} × ${line.quantity}`).join(", ")}</ThemedText>
      </View>
      <Pressable accessibilityRole="switch" accessibilityLabel={t("subscriptionVacation.pauseProduct", { product: name })} accessibilityState={{ checked: selected }} onPress={onToggle} style={{ width: theme.sizes.buttonHeight, height: theme.spacing.lg + theme.spacing.xs, justifyContent: "center", borderRadius: theme.radii.pill, padding: theme.spacing.xs, backgroundColor: selected ? theme.colors.colorAccent : theme.colors.colorBorder }}>
        <View style={{ width: theme.spacing.md, height: theme.spacing.md, alignSelf: selected ? "flex-end" : "flex-start", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorSurface }} />
      </Pressable>
    </View>
  );
}

function CalendarPicker({ resuming, pauseDate, resumeDate, minDate, maxDate, onDateSelect, pausedDays }: { resuming: boolean; pauseDate: string; resumeDate: string; minDate: string; maxDate?: string; onDateSelect: (date: string) => void; pausedDays?: Record<string, { color: string; label: string }> }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const lang = useAppStore((state) => state.language);
  const [visibleMonth, setVisibleMonth] = useState(() => monthOf(resuming ? resumeDate : pauseDate));
  if (resuming) return <SharedCalendar mode="single" month={visibleMonth} onMonthChange={setVisibleMonth} selectedDate={resumeDate} minDate={minDate} onDateSelect={onDateSelect} />;
  return (
    <SharedCalendar
      mode="range"
      month={visibleMonth}
      onMonthChange={setVisibleMonth}
      fromDate={pauseDate}
      toDate={resumeDate}
      minDate={minDate}
      maxDate={maxDate}
      onDateSelect={onDateSelect}
      dateStatuses={pausedDays}
      legend={[
        { color: theme.colors.colorHighlightTint, label: t("subscriptionVacation.vacationRange") },
        { color: theme.colors.colorPrimary, label: t("subscriptionVacation.deliveriesResume", { date: formatDeliveryDate(resumeDate, lang) }) },
        ...(pausedDays && Object.keys(pausedDays).length > 0 ? [{ color: theme.colors.colorWarning, label: t("subs.alreadyPaused") }] : []),
      ]}
    />
  );
}

function DateCard({ active, label, onPress, value }: { active: boolean; label: string; onPress: () => void; value: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const lang = useAppStore((state) => state.language);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={{ flex: 1, gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.lg, borderWidth: active ? theme.borderWidths.medium : theme.borderWidths.hairline, borderColor: active ? theme.colors.colorPrimary : theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface }}>
      <ThemedText variant="caption" weight="semibold">{label}</ThemedText>
      <ThemedText variant="bodySmall" weight="semibold">{formatDeliveryDate(value, lang)}</ThemedText>
      <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{active ? t("subscriptionVacation.selecting") : t("subscriptionVacation.tapEdit")}</ThemedText>
    </Pressable>
  );
}

function InfoCard() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurfaceMuted }}>
      <ThemedText variant="bodySmall" weight="semibold">{t("subs.vacationPromiseTitle")}</ThemedText>
      <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.vacationPromise")}</ThemedText>
    </View>
  );
}
