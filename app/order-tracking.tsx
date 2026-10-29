import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/atoms/Button";
import { RiseIn } from "../src/components/atoms/RiseIn";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { TrackingTimeline, type TimelineStep } from "../src/components/molecules/TrackingTimeline";
import { ConfirmSheet } from "../src/components/organisms/ConfirmSheet";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { TrackingHero } from "../src/components/organisms/TrackingHero";
import { useCountdownLabel } from "../src/hooks/useCountdownLabel";
import { useCancelOrder, useMyOrder } from "../src/hooks/useOrders";
import { formatRupees } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";
import { formatPlacedAt, formatShortDay, formatWindow } from "../src/lib/deliveryText";
import { AlertCircleIcon, CloseIcon, HomeIcon, PackageIcon, SuccessIcon, TruckIcon } from "../src/icons/appIcons";
import { describeError } from "../src/services/errorMapper";
import { useToast } from "../src/providers/ToastProvider";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import { shownStatus } from "../src/lib/orderGroups";
import type { OrderStatus } from "../src/types/orders";

const STEPS: readonly OrderStatus[] = ["placed", "out_for_delivery", "delivered"];
const STEP_ICONS = { placed: PackageIcon, out_for_delivery: TruckIcon, delivered: HomeIcon } as const;
const HERO_ICONS = { placed: PackageIcon, out_for_delivery: TruckIcon, delivered: SuccessIcon, missed: AlertCircleIcon, cancelled: CloseIcon } as const;

/** One order: where it is (an animated hero and a three-step timeline), what and when, the address, the money, and cancelling while that is still allowed. */
export default function OrderTrackingScreen() {
  const { showToast } = useToast();
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const id = Array.isArray(orderId) ? orderId[0] : orderId;
  const { data: order, isError, isLoading, error, refetch, isRefetching } = useMyOrder(id);
  const cancel = useCancelOrder(id ?? "");
  const [confirming, setConfirming] = useState(false);
  const countdown = useCountdownLabel(order?.status === "placed" ? order.deliveryDate : null, order?.slot?.startTime);

  if (isLoading || isError || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
        <StateMessage
          type={isError || !order ? "error" : "loading"}
          title={t(isError || !order ? "tracking.unavailable" : "tracking.loading")}
          description={isError ? describeError(error) : undefined}
          actionLabel={id && isError ? t("common.retry") : undefined}
          onAction={id && isError ? () => void refetch() : undefined}
        />
      </SafeAreaView>
    );
  }

  const stopped = order.status === "cancelled" || order.status === "missed";
  const overdue = shownStatus(order, new Date()) === "overdue";
  const reached = STEPS.indexOf(order.status);
  const when = order.deliveryMethod === "local_delivery" && order.slot
    ? `${formatShortDay(order.deliveryDate, language, t)} · ${order.slot.name} ${formatWindow(order.slot.startTime, order.slot.endTime)}${countdown ? ` · ${t("subs.arrivesIn", { when: countdown })}` : ""}`
    : t("shop.courier");
  const stoppedNote = order.status === "missed" ? t("shop.tracking.missedNote") : order.cancelReason ? t("shop.tracking.cancelledWithReason", { reason: order.cancelReason }) : t("shop.tracking.cancelledNote");
  const timelineSteps: TimelineStep[] = STEPS.map((step) => ({ key: step, label: t(`shop.status.${step}`), hint: t(`shop.tracking.hint.${step}`), icon: STEP_ICONS[step as keyof typeof STEP_ICONS] }));
  const card = { gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface } as const;
  const goBack = () => { if (router.canGoBack()) router.back(); else router.replace("/orders"); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ paddingHorizontal: theme.layout.screenHorizontalPadding, backgroundColor: theme.colors.colorBackground }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("tracking.title", { number: order.orderNumber })} onBack={goBack} />
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />} contentContainerStyle={{ padding: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.xxl, gap: theme.spacing.md }}>
        <RiseIn>
          <TrackingHero
            status={order.status}
            icon={HERO_ICONS[order.status]}
            headline={overdue ? t("shop.status.overdue") : t(`shop.tracking.headline.${order.status}`)}
            when={when}
            note={stopped ? stoppedNote : overdue ? t("shop.tracking.overdueNote") : undefined}
            progress={stopped ? undefined : order.status === "delivered" ? 1 : (reached + 0.5) / STEPS.length}
          />
        </RiseIn>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t("orders.placedOn", { when: formatPlacedAt(order.placedAt, language) })}</ThemedText>

        {stopped ? null : (
          <RiseIn index={1} style={card}>
            <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.tracking.progressTitle")}</ThemedText>
            <TrackingTimeline steps={timelineSteps} reached={reached} />
          </RiseIn>
        )}

        <RiseIn index={2} style={card}>
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.tracking.items")}</ThemedText>
          {order.items.map((item) => (
            <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
              <ThemedText variant="bodySmall" style={{ flex: 1 }}>{item.quantity} × {localized(item.productName, item.productNameGu, language)} ({item.variantName})</ThemedText>
              <ThemedText variant="bodySmall" weight="medium">{item.isGift ? t("offers.free") : formatRupees(item.lineTotalPaise)}</ThemedText>
            </View>
          ))}
          {order.discountPaise > 0 ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
              <ThemedText variant="bodySmall" style={{ flex: 1, color: theme.colors.colorAccent }}>{t("offers.discount")}{order.offerTitle ? ` · ${localized(order.offerTitle, order.offerTitleGu, language)}` : ""}</ThemedText>
              <ThemedText variant="bodySmall" weight="medium" style={{ color: theme.colors.colorAccent }}>−{formatRupees(order.discountPaise)}</ThemedText>
            </View>
          ) : order.offerTitle ? <ThemedText variant="caption" style={{ color: theme.colors.colorAccent }}>{t("offers.offerUsed")} · {localized(order.offerTitle, order.offerTitleGu, language)}</ThemedText> : null}
          <View style={{ height: theme.borderWidths.hairline, backgroundColor: theme.colors.colorBorder }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <ThemedText variant="bodySmall" weight="semibold">{order.paymentMethod === "credit" ? t("shop.tracking.onCredit") : t("shop.tracking.paidOnline")}</ThemedText>
            <ThemedText variant="bodySmall" weight="bold">{formatRupees(order.totalPaise)}</ThemedText>
          </View>
        </RiseIn>

        <RiseIn index={3} style={card}>
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.tracking.address")}</ThemedText>
          <ThemedText variant="bodySmall" weight="medium">{order.recipientName}</ThemedText>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{order.addressText} – {order.pinCode}</ThemedText>
        </RiseIn>

        {order.deliveryMethod === "shipping" && (order.courierName || order.trackingUrl) ? (
          <RiseIn index={4} style={card}>
            <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.courierTitle")}</ThemedText>
            {order.courierName ? <ThemedText variant="bodySmall" weight="medium">{order.courierName}</ThemedText> : null}
            {order.trackingUrl ? <Button variant="secondary" onPress={() => void Linking.openURL(order.trackingUrl)}>{t("subs.trackParcel")}</Button> : null}
          </RiseIn>
        ) : null}

        {overdue ? <RiseIn index={5}><Button variant="secondary" onPress={() => router.push("/report-issue")}>{t("shop.tracking.overdueReport")}</Button></RiseIn> : null}
        {order.canCancel ? <RiseIn index={5}><Button variant="secondary" onPress={() => setConfirming(true)}>{t("shop.tracking.cancelOrder")}</Button></RiseIn> : null}
      </ScrollView>
      <ConfirmSheet
        visible={confirming}
        tone="danger"
        icon={AlertCircleIcon}
        title={t("shop.tracking.cancelTitle")}
        description={t("shop.tracking.cancelBody")}
        consequences={[order.paymentMethod === "credit" ? t("shop.tracking.cancelCredit") : t("shop.tracking.cancelRefund")]}
        cancelLabel={t("shop.tracking.keepOrder")}
        confirmLabel={t("shop.tracking.cancelOrder")}
        loading={cancel.isPending}
        errorText={cancel.isError ? describeError(cancel.error) : undefined}
        onCancel={() => { setConfirming(false); cancel.reset(); }}
        onConfirm={() => cancel.mutate("", { onSuccess: () => { setConfirming(false); showToast(t("toast.orderCancelled")); } })}
      />
    </SafeAreaView>
  );
}
