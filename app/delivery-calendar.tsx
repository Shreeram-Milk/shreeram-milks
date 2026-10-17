import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { SharedCalendar, type CalendarDateStatus } from "../src/components/molecules/SharedCalendar";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { ConfirmSheet } from "../src/components/organisms/ConfirmSheet";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useChangeSubscription, useMyDeliveries } from "../src/hooks/useSubscriptions";
import { CalendarIcon } from "../src/icons/appIcons";
import { localized } from "../src/lib/contentLocalization";
import { formatClock, formatShortDay, indiaToday } from "../src/lib/deliveryText";
import { describeError } from "../src/services/errorMapper";
import { useToast } from "../src/providers/ToastProvider";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { CalendarDelivery } from "../src/types/subscriptions";

const pad = (value: number) => String(value).padStart(2, "0");
const monthStart = (year: number, month: number) => `${year}-${pad(month + 1)}-01`;
const monthEnd = (year: number, month: number) => `${year}-${pad(month + 1)}-${pad(new Date(Date.UTC(year, month + 1, 0)).getUTCDate())}`;
type Bucket = "coming" | "delivered" | "skipped" | "paused" | "missed";
const bucketOf = (entry: CalendarDelivery): Bucket | null => entry.state === "delivered" ? "delivered" : entry.state === "skipped" ? "skipped" : entry.state === "paused" ? "paused" : entry.state === "missed" ? "missed" : entry.state === "cancelled" ? null : "coming";

/** Every delivery of one month: one-off orders and subscription days together. A subscription day can be skipped here. */
export default function DeliveryCalendarScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const language = useAppStore((state) => state.language);
  const today = indiaToday();
  const [month, setMonth] = useState(() => ({ year: Number(today.slice(0, 4)), index: Number(today.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState(today);
  const { data: deliveries = [], isError, isLoading, refetch } = useMyDeliveries(monthStart(month.year, month.index), monthEnd(month.year, month.index));
  const colorFor = (bucket: Bucket) => bucket === "coming" ? theme.colors.colorPrimary : bucket === "delivered" ? theme.colors.colorInfo : bucket === "skipped" ? theme.colors.colorWarning : bucket === "paused" ? theme.colors.colorTextSecondary : theme.colors.colorDanger;
  const dateStatuses: Record<string, CalendarDateStatus> = {};
  for (const entry of deliveries) {
    const bucket = bucketOf(entry);
    if (bucket && !dateStatuses[entry.date]) dateStatuses[entry.date] = { color: colorFor(bucket), label: t(`subs.cal_${bucket}`) };
  }
  const ofDay = deliveries.filter((entry) => entry.date === selected && entry.state !== "cancelled");

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
    <StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
      <ScreenHeader backLabel={t("commonActions.back")} title={t("calendar.title")} />
      <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}>
        <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("calendar.subtitle")}</ThemedText>
        <SharedCalendar
          mode="single"
          month={new Date(month.year, month.index, 1)}
          onMonthChange={(next) => { setMonth({ year: next.getFullYear(), index: next.getMonth() }); setSelected(monthStart(next.getFullYear(), next.getMonth())); }}
          selectedDate={selected}
          onDateSelect={setSelected}
          dateStatuses={dateStatuses}
          legend={(["coming", "delivered", "skipped", "paused", "missed"] as Bucket[]).map((bucket) => ({ color: colorFor(bucket), label: t(`subs.cal_${bucket}`) }))}
        />
        {isLoading ? <StateMessage type="loading" title={t("subs.loading")} /> : isError ? <StateMessage type="error" title={t("errors.UNKNOWN_ERROR")} actionLabel={t("common.retry")} onAction={() => void refetch()} /> : ofDay.length === 0
          ? <StateMessage type="empty" icon={CalendarIcon} title={t("calendar.noDelivery")} description={t("calendar.noDeliveryDetail")} actionLabel={t("subs.myTitle")} onAction={() => router.push("/subscriptions")} />
          : ofDay.map((entry, index) => <DayEntry key={`${entry.orderId ?? entry.lineId}-${index}`} entry={entry} language={language} onDone={(message) => showToast(message)} />)}
      </ScrollView>
    </View>
  </SafeAreaView>;
}

function DayEntry({ entry, language, onDone }: { entry: CalendarDelivery; language: "en" | "gu"; onDone: (message: string) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const change = useChangeSubscription(entry.subscriptionId ?? "");
  const [confirming, setConfirming] = useState(false);
  const skipped = entry.state === "skipped";
  const day = formatShortDay(entry.date, language, t);
  const skip = () => change.mutate({ type: "skip", date: entry.date, lineId: entry.lineId ?? undefined }, {
    onSuccess: () => { setConfirming(false); onDone(t("subs.skipped", { date: day })); },
    onError: (failure) => { setConfirming(false); onDone(describeError(failure)); },
  });
  return <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurfaceMuted }}>
    <ThemedText variant="overline" style={{ color: theme.colors.colorTextSecondary }}>{entry.source === "subscription" ? `${t("subs.subscription")} ${entry.subscriptionNumber ?? ""}` : t("subs.oneOff")}</ThemedText>
    {entry.items.map((item, index) => <ThemedText key={index} variant="body" weight="semibold">{localized(item.productName, item.productNameGu, language)} · {item.variantName} × {item.quantity}</ThemedText>)}
    <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{entry.slotName ? `${entry.slotName}${entry.startTime ? ` · ${formatClock(entry.startTime)}` : ""}` : t("subs.courier")} · {t(`subs.day_${entry.state === "cancelled" ? "skipped" : entry.state}`)}</ThemedText>
    <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
      {entry.subscriptionId && entry.canChange && !skipped ? <Button style={{ flex: 1 }} variant="secondary" onPress={() => setConfirming(true)}>{t("subs.skip")}</Button> : null}
      {entry.subscriptionId ? <Button style={{ flex: 1 }} variant="secondary" onPress={() => router.push({ pathname: "/subscription-manage", params: { id: entry.subscriptionId ?? "" } })}>{t("calendar.manage")}</Button> : null}
      {entry.orderId && !entry.subscriptionId ? <Button style={{ flex: 1 }} variant="secondary" onPress={() => router.push({ pathname: "/order-tracking", params: { orderId: entry.orderId ?? "" } })}>{t("subs.track")}</Button> : null}
    </View>
    <ConfirmSheet
      visible={confirming}
      icon={CalendarIcon}
      title={t("subs.skipConfirmTitle", { date: day })}
      description={t("subs.skipConfirmDetail")}
      consequences={entry.items.map((item) => `${entry.slotName ?? ""} · ${localized(item.productName, item.productNameGu, language)} × ${item.quantity}`)}
      confirmLabel={t("subs.skipConfirm")}
      cancelLabel={t("subs.keepDelivery")}
      loading={change.isPending}
      onCancel={() => setConfirming(false)}
      onConfirm={skip}
    />
  </View>;
}
