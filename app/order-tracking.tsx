import { router, useLocalSearchParams } from "expo-router";
import { useState, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { Linking, RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon, type IconSvgElement } from "../src/components/atoms/AppIcon";
import { Button } from "../src/components/atoms/Button";
import { Skeleton } from "../src/components/atoms/Skeleton";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { DashedRule } from "../src/components/molecules/DashedRule";
import { OrderStepsDown } from "../src/components/molecules/OrderSteps";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { ConfirmSheet } from "../src/components/organisms/ConfirmSheet";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useCountdownLabel } from "../src/hooks/useCountdownLabel";
import { useCancelOrder, useMyOrder } from "../src/hooks/useOrders";
import { AlertCircleIcon, CalendarIcon, HelpIcon, LocationIcon, TruckIcon, WalletIcon } from "../src/icons/appIcons";
import { formatRupees } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";
import { formatPlacedAt, formatShortDay, formatWindow } from "../src/lib/deliveryText";
import { shownStatus } from "../src/lib/orderGroups";
import { describeError } from "../src/services/errorMapper";
import { useToast } from "../src/providers/ToastProvider";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { Order } from "../src/types/orders";

/** A white section with a small grey title. */
function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
      <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.colorTextSecondary, letterSpacing: 0.6 }}>{title.toUpperCase()}</ThemedText>
      {children}
    </View>
  );
}

/** An icon, a label and its value, for the delivery details. */
function InfoRow({ icon, label, value, detail }: { icon: IconSvgElement; label: string; value: string; detail?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
      <View style={{ width: 32, height: 32, borderRadius: theme.radii.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.colorSurfaceMuted }}>
        <AppIcon icon={icon} size="sm" tone="secondary" accessibilityLabel="" />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{label}</ThemedText>
        <ThemedText variant="bodySmall" weight="semibold">{value}</ThemedText>
        {detail ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{detail}</ThemedText> : null}
      </View>
    </View>
  );
}

function MoneyRow({ label, value, tone, strong = false }: { label: string; value: string; tone?: string; strong?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
      <ThemedText variant={strong ? "body" : "bodySmall"} weight={strong ? "bold" : "regular"} style={{ flex: 1, color: strong ? theme.colors.colorTextPrimary : theme.colors.colorTextSecondary }}>{label}</ThemedText>
      <ThemedText variant={strong ? "body" : "bodySmall"} weight={strong ? "extrabold" : "semibold"} style={{ color: tone ?? theme.colors.colorTextPrimary, fontVariant: ["tabular-nums"] }}>{value}</ThemedText>
    </View>
  );
}

/** The status at the top: a small coloured label, a clear sentence, and when to expect it. */
function StatusSummary({ order, overdue, expected, countdown }: { order: Order; overdue: boolean; expected: string; countdown: string | null }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const tone = order.status === "delivered" ? { text: theme.colors.colorSuccess, tint: theme.colors.colorSuccessTint }
    : order.status === "missed" || order.status === "cancelled" || overdue ? { text: theme.colors.colorDanger, tint: theme.colors.colorDangerTint }
      : order.status === "out_for_delivery" ? { text: theme.colors.colorHighlightText, tint: theme.colors.colorHighlightTint }
        : { text: theme.colors.colorPrimary, tint: theme.colors.colorPrimaryTint };
  const label = overdue ? t("shop.status.overdue") : t(`shop.status.${order.status}`);
  const headline = overdue ? t("track.headline.overdue") : t(`track.headline.${order.status}`);
  const sub = order.status === "delivered"
    ? t("track.deliveredAt", { when: formatPlacedAt((order.timeline ?? []).find((entry) => entry.status === "delivered")?.at ?? order.placedAt, language) })
    : order.status === "cancelled" ? (order.cancelReason ? t("shop.tracking.cancelledWithReason", { reason: order.cancelReason }) : t("shop.tracking.cancelledNote"))
      : order.status === "missed" ? t("shop.tracking.missedNote")
        : overdue ? t("shop.tracking.overdueNote")
          : expected;
  return (
    <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
      <View style={{ alignSelf: "flex-start", paddingHorizontal: theme.spacing.sm, paddingVertical: 3, borderRadius: theme.radii.pill, backgroundColor: tone.tint }}>
        <ThemedText variant="caption" weight="bold" style={{ color: tone.text }}>{label}</ThemedText>
      </View>
      <ThemedText variant="h1" style={{ fontSize: 21, lineHeight: 27 }}>{headline}</ThemedText>
      <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{sub}</ThemedText>
      {countdown && order.status === "placed" && !overdue ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
          <AppIcon icon={CalendarIcon} size="sm" tone="accent" accessibilityLabel="" />
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorAccent }}>{t("subs.arrivesIn", { when: countdown })}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

/** While the order loads: grey shapes in the same layout as the page. */
function TrackingSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md, padding: theme.layout.screenHorizontalPadding }}>
      <Skeleton height={124} radius={theme.radii.lg} />
      <Skeleton height={168} radius={theme.radii.lg} />
      <Skeleton height={140} radius={theme.radii.lg} />
    </View>
  );
}

/**
 * One order, laid out like a delivery company's tracking page: what is happening and when, every step with the exact time it
 * happened, the delivery details, the bill, the order information, and help or cancelling while that is still allowed.
 */
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
  const goBack = () => { if (router.canGoBack()) router.back(); else router.replace("/orders"); };

  if (isLoading || isError || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorSurfaceMuted }}>
        <StatusBar barStyle="dark-content" />
        <View style={{ paddingHorizontal: theme.layout.screenHorizontalPadding }}>
          <ScreenHeader backLabel={t("commonActions.back")} title={t("track.title")} onBack={goBack} />
        </View>
        {isLoading ? <TrackingSkeleton /> : (
          <StateMessage type="error" title={t("tracking.unavailable")} description={isError ? describeError(error) : undefined} actionLabel={id && isError ? t("common.retry") : undefined} onAction={id && isError ? () => void refetch() : undefined} />
        )}
      </SafeAreaView>
    );
  }

  const overdue = shownStatus(order, new Date()) === "overdue";
  const slot = order.deliveryMethod === "local_delivery" ? order.slot : null;
  const expected = slot ? t("track.expected", { day: formatShortDay(order.deliveryDate, language, t), window: `${slot.name} ${formatWindow(slot.startTime, slot.endTime)}` }) : t("shop.courier");
  const itemsPaise = order.items.reduce((sum, item) => sum + (item.isGift ? 0 : item.lineTotalPaise), 0);
  const paymentState = order.paymentStatus === "refunded" ? t("track.payment.refunded")
    : order.paymentStatus === "partially_refunded" ? t("track.payment.partlyRefunded")
      : order.paymentMethod === "online" ? t("track.payment.paidOnline") : t("track.payment.onCredit");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorSurfaceMuted }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ paddingHorizontal: theme.layout.screenHorizontalPadding }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("track.titleNumber", { number: order.orderNumber })} onBack={goBack} />
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />} contentContainerStyle={{ padding: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xxl, gap: theme.spacing.md }}>
        <StatusSummary order={order} overdue={overdue} expected={expected} countdown={countdown} />

        <Section title={t("track.progress")}>
          <OrderStepsDown order={order} expected={expected} />
        </Section>

        <Section title={t("track.deliveryDetails")}>
          <InfoRow icon={slot ? CalendarIcon : TruckIcon} label={t("track.deliveryWindow")} value={slot ? `${formatShortDay(order.deliveryDate, language, t)}, ${slot.name}` : t("track.courier")} detail={slot ? formatWindow(slot.startTime, slot.endTime) : order.courierName || undefined} />
          <InfoRow icon={LocationIcon} label={t("track.deliverTo")} value={order.recipientName} detail={`${order.addressText}${order.pinCode ? ` – ${order.pinCode}` : ""}`} />
          {order.deliveryMethod === "shipping" && order.trackingUrl ? <Button variant="secondary" onPress={() => void Linking.openURL(order.trackingUrl)}>{t("subs.trackParcel")}</Button> : null}
        </Section>

        <Section title={t("track.bill")}>
          <View style={{ gap: theme.spacing.sm }}>
            {order.items.map((item) => (
              <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
                <View style={{ flex: 1, gap: 1 }}>
                  <ThemedText variant="bodySmall" weight="semibold">{item.quantity} × {localized(item.productName, item.productNameGu, language)}</ThemedText>
                  <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{item.variantName}</ThemedText>
                </View>
                <ThemedText variant="bodySmall" weight="semibold" style={{ fontVariant: ["tabular-nums"], color: item.isGift ? theme.colors.colorAccent : theme.colors.colorTextPrimary }}>{item.isGift ? t("offers.free") : formatRupees(item.lineTotalPaise)}</ThemedText>
              </View>
            ))}
          </View>
          <DashedRule />
          <View style={{ gap: theme.spacing.xs + 2 }}>
            <MoneyRow label={t("receipt.itemTotal")} value={formatRupees(itemsPaise)} />
            {order.discountPaise > 0 ? <MoneyRow label={order.offerTitle ? `${t("offers.discount")} (${localized(order.offerTitle, order.offerTitleGu, language)})` : t("offers.discount")} value={`−${formatRupees(order.discountPaise)}`} tone={theme.colors.colorAccent} /> : null}
            <MoneyRow label={t("receipt.deliveryFee")} value={t("offers.free")} tone={theme.colors.colorAccent} />
          </View>
          <DashedRule />
          <MoneyRow label={t("receipt.total")} value={formatRupees(order.totalPaise)} strong />
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
            <AppIcon icon={WalletIcon} size="sm" tone="secondary" accessibilityLabel="" />
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{paymentState}</ThemedText>
          </View>
        </Section>

        <Section title={t("track.orderInfo")}>
          <View style={{ gap: theme.spacing.xs + 2 }}>
            <MoneyRow label={t("receipt.orderNumber")} value={order.orderNumber} />
            <MoneyRow label={t("receipt.placedOn")} value={formatPlacedAt(order.placedAt, language)} />
          </View>
        </Section>

        <View style={{ gap: theme.spacing.sm }}>
          <Button variant="secondary" icon={HelpIcon} onPress={() => router.push("/report-issue")}>{overdue ? t("shop.tracking.overdueReport") : t("track.help")}</Button>
          {order.canCancel ? <Button variant="danger" onPress={() => setConfirming(true)}>{t("shop.tracking.cancelOrder")}</Button> : null}
          {order.canCancel ? <ThemedText variant="caption" style={{ textAlign: "center", color: theme.colors.colorTextSecondary }}>{t("shop.tracking.cancelBody")}</ThemedText> : null}
        </View>
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
