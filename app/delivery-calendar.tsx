import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { SharedCalendar, type CalendarDateStatus } from "../src/components/molecules/SharedCalendar";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useDeliveryCalendar } from "../src/hooks/useDeliveryCalendar";
import { CalendarIcon } from "../src/icons/appIcons";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { DeliveryState } from "../src/types/models";

const dateKey = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export default function DeliveryCalendarScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: deliveries = [], isError, isLoading, refetch } = useDeliveryCalendar();
  const overrides = useAppStore((state) => state.deliveryOverrides);
  const setDeliveryState = useAppStore((state) => state.setDeliveryState);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const today = new Date();
  const displayed = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = displayed.getFullYear();
  const monthIndex = displayed.getMonth();
  const selectedEntry = deliveries.find((delivery) => delivery.date === dateKey(year, monthIndex, selectedDay));
  const selected = selectedEntry ? { ...selectedEntry, state: overrides[selectedEntry.id] ?? selectedEntry.state } : undefined;
  const colorFor = (state?: DeliveryState) => state === "scheduled" ? theme.colors.colorPrimary : state === "delivered" ? theme.colors.colorInfo : state === "paused" ? theme.colors.colorWarning : state === "skipped" ? theme.colors.colorDanger : theme.colors.colorSurface;
  const dateStatuses: Record<string, CalendarDateStatus> = {};
  for (const delivery of deliveries) {
    const state = overrides[delivery.id] ?? delivery.state;
    dateStatuses[delivery.date] = { color: colorFor(state), label: t(`calendar.${state}`) };
  }
  const changeMonth = (delta: number) => { setMonthOffset((value) => value + delta); setSelectedDay(1); };

  if (isLoading || isError) return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}><StateMessage type={isError ? "error" : "loading"} title={t(isError ? "errors.UNKNOWN_ERROR" : "calendar.title")} actionLabel={isError ? t("common.retry") : undefined} onAction={isError ? () => refetch() : undefined} /></SafeAreaView>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
    <StatusBar barStyle="dark-content" />
    <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding }}>
      <ScreenHeader backLabel={t("commonActions.back")} title={t("calendar.title")} />
      <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md, paddingBottom: theme.spacing.xxl }}>
        <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("calendar.subtitle")}</ThemedText>
        <SharedCalendar
          mode="single"
          month={displayed}
          onMonthChange={(nextMonth) => {
            const offset = (nextMonth.getFullYear() - today.getFullYear()) * 12 + nextMonth.getMonth() - today.getMonth();
            changeMonth(offset - monthOffset);
          }}
          selectedDate={dateKey(year, monthIndex, selectedDay)}
          onDateSelect={(date) => setSelectedDay(Number(date.slice(-2)))}
          dateStatuses={dateStatuses}
          legend={(["scheduled", "delivered", "paused", "skipped"] as DeliveryState[]).map((state) => ({ color: colorFor(state), label: t(`calendar.${state}`) }))}
        />
        {selected ? <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurfaceMuted }}><ThemedText variant="overline" style={{ color: theme.colors.colorTextSecondary }}>{t("calendar.selected")}</ThemedText><ThemedText variant="body" weight="semibold">{selected.productName} · {selected.quantity}</ThemedText><ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{selected.timeSlot} · {selected.addressLabel}</ThemedText><ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorPrimary }}>{t(`calendar.${selected.state}`)}</ThemedText>{selected.state === "scheduled" ? <View style={{ flexDirection: "row", gap: theme.spacing.sm }}><Button style={{ flex: 1 }} variant="secondary" onPress={() => setDeliveryState(selected.id, "skipped")}>{t("calendar.skip")}</Button><Button style={{ flex: 1 }} onPress={() => router.push("/subscription-vacation")}>{t("calendar.pause")}</Button></View> : <Button variant="secondary" onPress={() => router.push("/subscription-manage")}>{t("calendar.manage")}</Button>}</View> : <StateMessage type="empty" icon={CalendarIcon} title={t("calendar.noDelivery")} description={t("calendar.noDeliveryDetail")} actionLabel={t("calendar.manage")} onAction={() => router.push("/subscription-manage")} />}
      </ScrollView>
    </View>
  </SafeAreaView>;
}
