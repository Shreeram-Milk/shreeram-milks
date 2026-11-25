import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/atoms/Button";
import { IconButton } from "../src/components/atoms/IconButton";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { dateRange, toggleDate } from "../src/lib/customSubscriptionDates";
import { isDeliveryDay } from "../src/lib/subscriptionSchedule";
import { SharedCalendar } from "../src/components/molecules/SharedCalendar";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useCatalogProduct } from "../src/hooks/useCatalog";
import { useMySubscriptions } from "../src/hooks/useSubscriptions";
import { BackIcon } from "../src/icons/appIcons";
import { localized } from "../src/lib/contentLocalization";
import { addDaysTo, indiaToday } from "../src/lib/deliveryText";
import { describeError } from "../src/services/errorMapper";
import { changeMySubscription } from "../src/services/subscriptionService";
import { queryKeys } from "../src/services/queryKeys";
import { useAppStore } from "../src/store/useAppStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { useTheme } from "../src/theme";
import type { Subscription } from "../src/types/subscriptions";
import { remoteImage } from "../src/lib/remoteImage";

/** Individual pause dates and individual restores use the same calendar and server cut-off checks. */
export default function SubscriptionVacationScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const resuming = params.mode === "resume";
  const { data = [], isLoading, isError, refetch } = useMySubscriptions();
  const client = useQueryClient();
  const customerId = useSessionStore(state => state.customer?.id ?? "");
  const today = indiaToday();
  const [month, setMonth] = useState(() => new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1));
  const [selectedIds, setSelectedIds] = useState<string[] | null>(id ? [id] : null);
  const choices = data.filter(item => (item.status === "active" || item.status === "paused") && (!id || item.id === id));
  const chosen = choices.filter(item => selectedIds === null || selectedIds.includes(item.id));
  const [dates, setDates] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const last = addDaysTo(today, 364);
  const available = new Set<string>();
  const paused = new Set<string>();
  const statuses: Record<string, { color: string; label: string }> = {};
  for (const item of chosen) {
    for (const day of item.days) if (day.date >= today && day.lines.some(line => line.canChange && (line.state === "upcoming" || line.state === "placed"))) available.add(day.date);
    for (const pause of item.pauses) {
      for (const date of dateRange(pause.fromDate > today ? pause.fromDate : today, pause.untilDate && pause.untilDate < last ? pause.untilDate : last)) {
        if (isDeliveryDay(date, item.startDate, item.scheduleType, item.weekdays)) paused.add(date);
      }
    }
  }
  for (const date of paused) statuses[date] = { color: theme.colors.colorWarning, label: t("subs.alreadyPaused") };
  const selectable = new Set([...paused, ...(resuming ? [] : available)]);
  const selected = dates.filter(date => selectable.has(date));
  const disabledDates = new Set(dateRange(today, last).filter(date => !selectable.has(date)));
  const toggle = (subscriptionId: string) => {
    const current = chosen.map(item => item.id);
    setSelectedIds(current.includes(subscriptionId) ? current.filter(value => value !== subscriptionId) : [...current, subscriptionId]);
    setDates([]);
    setFailure(null);
  };
  const confirm = async () => {
    if (inFlight.current || selected.length === 0) return;
    inFlight.current = true;
    setBusy(true);
    setDone(false);
    setFailure(null);
    try {
      for (const date of selected) {
        for (const item of chosen) {
          const restoring = item.pauses.some(pause => pause.fromDate <= date && (!pause.untilDate || pause.untilDate >= date));
          const pausing = !resuming && item.days.some(day => day.date === date && day.lines.some(line => line.canChange && (line.state === "upcoming" || line.state === "placed")));
          if (restoring) await changeMySubscription(item.id, { type: "resume", fromDate: date, onlyDate: true });
          else if (pausing) await changeMySubscription(item.id, { type: "pause", fromDate: date, untilDate: date });
        }
      }
      setDone(true);
    } catch (error) {
      setFailure(describeError(error));
    } finally {
      // A network failure may follow a successful change; refresh before the customer chooses again.
      setDates([]);
      await Promise.all([client.invalidateQueries({ queryKey: queryKeys.subscriptions(customerId) }), client.invalidateQueries({ queryKey: queryKeys.deliveries(customerId) }), client.invalidateQueries({ queryKey: queryKeys.orders(customerId) })]);
      inFlight.current = false;
      setBusy(false);
    }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
    <StatusBar barStyle="dark-content" />
    <View style={{ flexDirection: "row", alignItems: "center", padding: theme.layout.screenHorizontalPadding, gap: theme.spacing.md }}>
      <IconButton icon={BackIcon} label={t("subscriptionVacation.back")} onPress={() => router.back()} />
      <ThemedText variant="h2" style={{ flex: 1 }}>{t(done ? "subs.datesChanged" : resuming ? "subs.resumeTitle" : "subscriptionVacation.title")}</ThemedText>
    </View>
    {isLoading ? <StateMessage type="loading" title={t("subs.loading")} /> : isError ? <StateMessage type="error" title={t("errors.UNKNOWN_ERROR")} actionLabel={t("common.retry")} onAction={() => void refetch()} /> : <ScrollView contentContainerStyle={{ padding: theme.layout.screenHorizontalPadding, gap: theme.spacing.md }}>
      {done ? <ThemedText variant="body">{t("subs.datesChanged")}</ThemedText> : <>
        {choices.length > 1 ? choices.map(item => <ChoiceRow key={item.id} subscription={item} selected={chosen.some(value => value.id === item.id)} onToggle={() => !busy && toggle(item.id)} />) : null}
        <ThemedText variant="bodySmall">{t(resuming ? "subs.restoreDatesDetail" : "subs.pauseDatesDetail")}</ThemedText>
        {selectable.size === 0 ? <StateMessage type="empty" title={t("subs.noDatesToChange")} /> : <SharedCalendar mode="multiple" month={month} onMonthChange={setMonth} minDate={today} maxDate={last} disabledDates={disabledDates} dateStatuses={statuses} selectedDates={new Set(selected)} onDateSelect={date => { if (!busy && selectable.has(date)) setDates(current => toggleDate(current, date)); }} legend={[{ color: theme.colors.colorWarning, label: t("subs.alreadyPaused") }]} />}
        <ThemedText variant="bodySmall" weight="semibold">{t("subs.selectedDatesCount", { count: selected.length })}</ThemedText>
        {failure ? <ThemedText accessibilityRole="alert" variant="bodySmall" style={{ color: theme.colors.colorDanger }}>{failure}</ThemedText> : null}
        <InfoCard />
      </>}
    </ScrollView>}
    <View style={{ padding: theme.layout.screenHorizontalPadding }}>
      {done ? <Button onPress={() => router.back()}>{t("subscriptionVacation.backToSubscriptions")}</Button> : <Button disabled={isLoading || isError || selected.length === 0} loading={busy} onPress={() => void confirm()}>{t(resuming ? "subs.restoreSelectedDates" : "subs.saveDates")}</Button>}
    </View>
  </SafeAreaView>;
}

function ChoiceRow({ subscription, selected, onToggle }: { subscription: Subscription; selected: boolean; onToggle: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const lang = useAppStore((state) => state.language);
  const { data: product } = useCatalogProduct(subscription.productId);
  const name = localized(subscription.productName, subscription.productNameGu, lang);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.sm, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface }}>
      <Image source={product?.imageUrl ? remoteImage(product.imageUrl) : require("../assets/onboarding-milk-hero.png")} contentFit="cover" style={{ width: theme.sizes.avatarLg, height: theme.sizes.avatarLg, borderRadius: theme.radii.md }} />
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
