import { router, useNavigation } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/atoms/Button";
import { RadioDot } from "../src/components/atoms/RadioDot";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { CheckoutEmptyCart } from "../src/components/molecules/CheckoutEmptyCart";
import { CheckoutProgress } from "../src/components/molecules/CheckoutProgress";
import { CheckoutSection } from "../src/components/molecules/CheckoutSection";
import { OfferCodeBox } from "../src/components/molecules/OfferCodeBox";
import { PaymentPoller } from "../src/components/molecules/PaymentPoller";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { CheckoutFooter } from "../src/components/organisms/CheckoutFooter";
import { useAddresses } from "../src/hooks/useAddresses";
import { useCheckPayment, usePayForOrder, usePlaceOrder, useQuote } from "../src/hooks/useOrders";
import { formatRupees } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";
import { formatShortDay, formatOrderBy, formatWindow } from "../src/lib/deliveryText";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { OnlinePayment, Order, QuoteOrder } from "../src/types/orders";

/** A fresh value for each distinct request. The same request retried keeps its key, so the server never makes a second order. */
const newKey = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export default function CheckoutReviewScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? i18n.language).startsWith("gu") ? "gu" : "en";
  const cart = useAppStore((state) => state.cart);
  const removeFromCart = useAppStore((state) => state.removeFromCart);
  const selection = useAppStore((state) => state.checkoutSelection);
  const { data: addresses = [] } = useAddresses();
  const address = addresses.find((item) => item.id === selection.addressId);
  const [slots, setSlots] = useState<Record<string, string>>({});
  // A code the customer typed. Without one the server picks the best automatic offer (if any).
  const [offerCode, setOfferCode] = useState("");

  const request = useMemo(
    () => (address && cart.length > 0 ? { addressId: address.id, lines: cart.map((item) => ({ variantId: item.product.id, quantity: item.quantity, ...(item.slotId ? { slotId: item.slotId } : {}) })), slots, ...(offerCode ? { offerCode } : {}) } : null),
    [address, cart, slots, offerCode],
  );
  const quote = useQuote(request);
  const place = usePlaceOrder();
  const pay = usePayForOrder();
  const check = useCheckPayment();
  // A payment that did not end in an order (still confirming, failed, or to be refunded), shown until the customer acts.
  const [outcome, setOutcome] = useState<OnlinePayment | null>(null);
  // A new attempt after a failed or abandoned payment needs a new request key; the same key would return the old payment.
  const [attempt, setAttempt] = useState(0);
  const requestKey = JSON.stringify(request);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const idempotencyKey = useMemo(() => newKey(), [requestKey, attempt]);

  // The delivery date or order-by time moved while the customer was reading (a window closed): they are told before ordering.
  const [dateChangedFor, setDateChangedFor] = useState<string | null>(null);
  const dateChanged = dateChangedFor === requestKey;
  // A message about an earlier attempt is dropped as soon as the customer changes anything.
  useEffect(() => {
    if (!place.isPending && !pay.isPending && !check.isPending) { place.reset(); pay.reset(); check.reset(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  if (cart.length === 0 && !place.isSuccess && !pay.isSuccess) {
    return (
      <SafeAreaView style={{ flex: 1, padding: theme.layout.screenHorizontalPadding, backgroundColor: theme.colors.colorBackground }}>
        <CheckoutProgress step={2} title={t("checkout.review.title")} />
        <CheckoutEmptyCart />
      </SafeAreaView>
    );
  }
  if (!address) {
    return (
      <SafeAreaView style={{ flex: 1, gap: theme.spacing.lg, padding: theme.layout.screenHorizontalPadding, backgroundColor: theme.colors.colorBackground }}>
        <CheckoutProgress step={2} title={t("checkout.review.title")} />
        <ThemedText variant="body">{t("checkout.review.noAddress")}</ThemedText>
        <Button onPress={() => router.replace("/checkout-address")}>{t("checkout.address.title")}</Button>
      </SafeAreaView>
    );
  }

  const data = quote.data;
  const problemCodes = data?.problems.map((problem) => problem.code) ?? [];
  const offerProblem = data?.problems.find((problem) => problem.code.startsWith("OFFER_")) ?? null;
  const otherProblems = [...new Set(problemCodes.filter((code) => code !== "SLOT_REQUIRED" && !code.startsWith("OFFER_")))];
  const busy = place.isPending || pay.isPending || check.isPending;
  const blocked = !data || data.orders.length === 0 || problemCodes.length > 0 || quote.isFetching || busy;
  // Anything paid online goes through PhonePe first; the orders are written only once PhonePe confirms the payment.
  const payOnlinePaise = data?.orders.filter((order) => order.payment === "online").reduce((sum, order) => sum + order.totalPaise, 0) ?? 0;

  const finish = (orders: Order[]) => {
    // The checkout steps leave the history, so Back from the success page returns to where the customer started (the product page).
    const params = { ids: orders.map((order) => order.id).join(","), numbers: orders.map((order) => order.orderNumber).join(",") };
    const kept = navigation.getState()?.routes.filter((route) => route.name !== "checkout-address" && route.name !== "checkout-review") ?? [];
    navigation.dispatch({ type: "RESET", payload: { index: kept.length, routes: [...kept, { name: "order-success", params }] } });
    // Only what was ordered leaves the cart: items that could not be delivered here stay for another address.
    // A free gift is not a cart line: it must not remove a paid cart item of the same size.
    for (const order of orders) for (const item of order.items) if (!item.isGift) removeFromCart(item.variantId);
  };
  const onPayment = (payment: OnlinePayment) => {
    if (payment.status === "paid" && payment.fulfilment === "fulfilled" && payment.orders.length > 0) { finish(payment.orders); return; }
    setOutcome(payment);
    if (payment.status !== "pending") setAttempt((count) => count + 1);
  };
  const onFailure = (failure: unknown) => {
    const code = (failure as { code?: string }).code;
    // If prices changed while the customer was looking, show the new prices before anything is charged.
    if (code === "PRICE_CHANGED") void quote.refetch();
    if (code === "PAYMENT_ALREADY_STARTED" || code === "PAYMENT_PROVIDER_UNAVAILABLE") setAttempt((count) => count + 1);
  };
  const submit = async () => {
    if (!request || blocked) return;
    setOutcome(null);
    // Ask once more right before ordering: the server decides the delivery date from the clock, so it may have moved.
    const shown = JSON.stringify(data?.orders.map((order) => [order.key, order.selectedSlotId, order.deliveryDate, order.orderBy]));
    const latest = await quote.refetch();
    if (latest.data && JSON.stringify(latest.data.orders.map((order) => [order.key, order.selectedSlotId, order.deliveryDate, order.orderBy])) !== shown) { setDateChangedFor(requestKey); return; }
    setDateChangedFor(null);
    const body = { ...request, idempotencyKey, expectedTotalPaise: data?.totalPaise ?? 0 };
    if (payOnlinePaise > 0) pay.mutate(body, { onSuccess: onPayment, onError: onFailure });
    else place.mutate(body, { onSuccess: finish, onError: onFailure });
  };
  const failure = place.error ?? pay.error ?? check.error;

  const changeLink = (
    <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={theme.spacing.sm}>
      <ThemedText variant="caption" weight="semibold" style={{ textDecorationLine: "underline" }}>{t("checkout.change")}</ThemedText>
    </Pressable>
  );

  const renderOrder = (order: QuoteOrder, index: number, count: number) => {
    const local = order.deliveryMethod === "local_delivery";
    return (
      <CheckoutSection key={order.key} title={count > 1 ? t("shop.orderOf", { index: index + 1, count }) : t("checkout.review.itemsTitle", { count: order.items.length })}>
        {order.items.map((item, position) => (
          <View key={item.variantId} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md, borderTopWidth: position === 0 ? theme.borderWidths.none : theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
            <View style={{ minWidth: theme.sizes.avatarSm, height: theme.sizes.avatarSm, paddingHorizontal: theme.spacing.xs, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }}>
              <ThemedText variant="caption" weight="bold">{item.quantity}×</ThemedText>
            </View>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <ThemedText variant="bodySmall" weight="medium" numberOfLines={1}>{localized(item.productName, item.productNameGu, language)}</ThemedText>
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{item.isGift ? t("offers.freeGiftLine") : `${item.variantName} · ${formatRupees(item.unitPricePaise)} ${t("checkout.review.each")}`}</ThemedText>
            </View>
            <ThemedText variant="bodySmall" weight="medium">{item.isGift ? t("offers.free") : formatRupees(item.lineTotalPaise)}</ThemedText>
          </View>
        ))}
        <View style={{ height: theme.borderWidths.hairline, backgroundColor: theme.colors.colorBorder }} />
        {local ? (
          <View accessibilityRole="radiogroup" style={{ paddingVertical: theme.spacing.sm }}>
            <ThemedText variant="caption" style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xs, color: theme.colors.colorTextSecondary }}>{t("shop.chooseWindow")}</ThemedText>
            {order.slots.map((slot) => {
              const active = slot.slotId === order.selectedSlotId;
              const orderBy = formatOrderBy(slot.orderBy, language, t);
              return (
                <Pressable
                  key={slot.slotId}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSlots((current) => ({ ...current, [order.key]: slot.slotId }))}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", gap: theme.spacing.md, marginHorizontal: theme.spacing.sm, marginTop: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.md,
                    borderWidth: theme.borderWidths.hairline, borderColor: active ? theme.colors.colorTextSecondary : theme.colors.colorTransparent,
                    backgroundColor: active ? theme.colors.colorSurfaceMuted : theme.colors.colorTransparent, opacity: pressed ? theme.opacity.subdued : theme.opacity.full,
                  })}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText variant="body" weight="semibold">{slot.name}</ThemedText>
                    <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{formatWindow(slot.startTime, slot.endTime)}</ThemedText>
                    <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.firstDelivery", { date: formatShortDay(slot.earliestDate, language, t) })}</ThemedText>
                    {orderBy ? <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorPrimary }}>{orderBy}</ThemedText> : null}
                  </View>
                  <RadioDot selected={active} />
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={{ gap: theme.spacing.xs, padding: theme.spacing.md }}>
            <ThemedText variant="bodySmall" weight="medium">{t("shop.courierTitle")}</ThemedText>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.courierDetail")}</ThemedText>
          </View>
        )}
        <View style={{ height: theme.borderWidths.hairline, backgroundColor: theme.colors.colorBorder }} />
        <View style={{ gap: theme.spacing.xs, padding: theme.spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <ThemedText variant="bodySmall" weight="medium">{order.payment === "credit" ? t("shop.onCredit") : t("shop.payOnline")}</ThemedText>
            <ThemedText variant="bodySmall" weight="bold">{formatRupees(order.totalPaise)}</ThemedText>
          </View>
          {order.paymentNote === "excluded_product" ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.notCredit")}</ThemedText> : null}
        </View>
      </CheckoutSection>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ gap: theme.spacing.xl, padding: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.xl }}>
        <CheckoutProgress step={2} title={t("checkout.review.title")} />
        <CheckoutSection title={t("checkout.review.deliveryTitle")} aside={changeLink}>
          <View style={{ gap: theme.spacing.xs, padding: theme.spacing.md }}>
            <ThemedText variant="bodySmall" weight="medium">{address.fullName}</ThemedText>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{[address.line1, address.line2, address.city].filter(Boolean).join(", ")} – {address.pincode}</ThemedText>
          </View>
        </CheckoutSection>

        {quote.isLoading ? <StateMessage type="loading" title={t("shop.checking")} /> : null}
        {quote.isError ? (
          <View style={{ gap: theme.spacing.md }}>
            <StateMessage type="error" title={t("shop.errorTitle")} description={describeError(quote.error)} actionLabel={t("common.retry")} onAction={() => void quote.refetch()} />
            <Button variant="secondary" onPress={() => router.replace("/cart")}>{t("shop.backToCart")}</Button>
          </View>
        ) : null}

        {data && data.unavailable.length > 0 ? (
          <View accessibilityRole="alert" style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorWarningTint }}>
            <ThemedText variant="bodySmall" weight="semibold">{t("shop.unavailableTitle", { count: data.unavailable.length })}</ThemedText>
            <ThemedText variant="caption">{t("shop.unavailableDetail", { pin: address.pincode })}</ThemedText>
            {data.unavailable.map((item) => (
              <ThemedText key={item.variantId} variant="caption" weight="medium">• {localized(item.productName, item.productNameGu, language)} · {item.variantName} × {item.quantity}</ThemedText>
            ))}
            <ThemedText variant="caption">{t("shop.unavailableContinue")}</ThemedText>
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={theme.spacing.sm}>
              <ThemedText variant="caption" weight="semibold" style={{ textDecorationLine: "underline" }}>{t("shop.tryOtherAddress")}</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {data ? data.orders.map((order, index) => renderOrder(order, index, data.orders.length)) : null}

        {data && data.orders.length > 0 ? (
          <OfferCodeBox
            language={language}
            applied={data.offer ? { title: data.offer.title, titleGu: data.offer.titleGu, discountPaise: data.offer.discountPaise, hasGift: data.orders.some((order) => order.items.some((item) => item.isGift)) } : null}
            code={offerCode}
            problem={offerProblem ? (offerProblem.code === "OFFER_MIN_ORDER" && offerProblem.shortByPaise ? t("offers.minOrder", { amount: formatRupees(offerProblem.shortByPaise) }) : describeError({ code: offerProblem.code })) : null}
            loading={quote.isFetching}
            onApply={setOfferCode}
            onRemove={() => setOfferCode("")}
          />
        ) : null}

        {data?.credit && data.credit.neededPaise > 0 ? (
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
            {t("shop.creditSummary", { needed: formatRupees(data.credit.neededPaise), owed: formatRupees(data.credit.owedPaise), limit: formatRupees(data.credit.limitPaise) })}
          </ThemedText>
        ) : null}

        {data && otherProblems.length > 0 ? (
          <View accessibilityRole="alert" style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorWarningTint }}>
            <ThemedText variant="bodySmall" weight="semibold">{t("shop.problemsTitle")}</ThemedText>
            {otherProblems.map((code) => (
              <ThemedText key={code} variant="caption">
                {code === "CREDIT_LIMIT_EXCEEDED" && data.credit ? t("shop.creditShort", { left: formatRupees(data.credit.remainingPaise), needed: formatRupees(data.credit.neededPaise) }) : describeError({ code })}
              </ThemedText>
            ))}
          </View>
        ) : null}
        {outcome ? (
          <View accessibilityRole="alert" style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: outcome.status === "pending" ? theme.colors.colorSurfaceMuted : theme.colors.colorWarningTint }}>
            <ThemedText variant="bodySmall" weight="semibold">
              {outcome.status === "pending" ? t("shop.payment.pendingTitle") : outcome.status === "failed" ? t("shop.payment.failedTitle") : t("shop.payment.refundTitle")}
            </ThemedText>
            <ThemedText variant="caption">
              {outcome.status === "pending" ? t("shop.payment.pendingDetail") : outcome.status === "failed" ? t("shop.payment.failed") : t("shop.payment.refundDetail", { amount: formatRupees(outcome.amountPaise) })}
            </ThemedText>
            {outcome.status === "pending" ? (
              <Button variant="secondary" loading={check.isPending} onPress={() => check.mutate(outcome.merchantOrderId, { onSuccess: onPayment })}>{t("shop.payment.checkAgain")}</Button>
            ) : null}
            {outcome.status === "pending" ? <PaymentPoller merchantOrderId={outcome.merchantOrderId} onResult={onPayment} /> : null}
          </View>
        ) : null}
        {dateChanged ? <ThemedText accessibilityRole="alert" accessibilityLiveRegion="polite" variant="caption" weight="semibold" style={{ color: theme.colors.colorDanger }}>{t("shop.dateChanged")}</ThemedText> : null}
        {failure && !outcome ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(failure)}</ThemedText> : null}
        {data && problemCodes.includes("SLOT_REQUIRED") ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.chooseWindowHint")}</ThemedText> : null}
      </ScrollView>
      <CheckoutFooter
        amountPaise={data?.totalPaise ?? 0}
        disabled={blocked || outcome?.status === "pending"}
        loading={busy}
        label={payOnlinePaise > 0 ? t("shop.payment.payButton", { amount: formatRupees(payOnlinePaise) }) : t("shop.place")}
        onPress={() => void submit()}
      />
    </SafeAreaView>
  );
}
