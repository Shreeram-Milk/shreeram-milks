import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/atoms/Button";
import { RadioDot } from "../src/components/atoms/RadioDot";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { CheckoutSection } from "../src/components/molecules/CheckoutSection";
import { OfferCodeBox } from "../src/components/molecules/OfferCodeBox";
import { PaymentPoller } from "../src/components/molecules/PaymentPoller";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { CheckoutFooter } from "../src/components/organisms/CheckoutFooter";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useAddresses } from "../src/hooks/useAddresses";
import { useCheckPayment } from "../src/hooks/useOrders";
import { useStartSubscription, useSubscriptionQuote, type SubscribeResult } from "../src/hooks/useSubscriptions";
import { formatRupees } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";
import { formatDeliveryDate, formatWindow } from "../src/lib/deliveryText";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { OnlinePayment } from "../src/types/orders";
import type { SubscriptionDraft } from "../src/types/subscriptions";

const newKey = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/** The choices the product page passed on. Anything unreadable means going back; the server checks everything again anyway. */
function readDraft(raw: string | string[] | undefined): Omit<SubscriptionDraft, "addressId"> | null {
  try {
    const value: unknown = JSON.parse(Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? ""));
    if (typeof value !== "object" || value === null) return null;
    const draft = value as Record<string, unknown>;
    const lines = Array.isArray(draft.lines) ? draft.lines.filter((line): line is { slotId: string; quantity: number } => typeof line === "object" && line !== null && typeof (line as { slotId?: unknown }).slotId === "string" && typeof (line as { quantity?: unknown }).quantity === "number") : [];
    if ((draft.kind !== "subscription" && draft.kind !== "trial") || typeof draft.variantId !== "string" || typeof draft.startDate !== "string" || lines.length === 0) return null;
    return {
      kind: draft.kind, variantId: draft.variantId, startDate: draft.startDate, lines,
      ruleId: typeof draft.ruleId === "string" ? draft.ruleId : undefined, deliveries: typeof draft.deliveries === "number" ? draft.deliveries : undefined, endDate: typeof draft.endDate === "string" ? draft.endDate : undefined,
      trialPlanId: typeof draft.trialPlanId === "string" ? draft.trialPlanId : undefined,
      weekdays: Array.isArray(draft.weekdays) ? draft.weekdays.filter((day): day is number => typeof day === "number") : [],
    };
  } catch {
    return null;
  }
}

export default function SubscribeReviewScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const deliveryPin = useAppStore((state) => state.deliveryPin);
  const params = useLocalSearchParams<{ draft?: string }>();
  const base = useMemo(() => readDraft(params.draft), [params.draft]);
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const [addressId, setAddressId] = useState<string | null>(null);
  // A code the customer typed. Without one the server picks the best automatic offer (if any).
  const [offerCode, setOfferCode] = useState("");
  // The address the product page checked (same PIN) comes first, then the default one.
  const address = addresses.find((item) => item.id === addressId) ?? addresses.find((item) => item.pincode === deliveryPin && item.isDefault) ?? addresses.find((item) => item.pincode === deliveryPin) ?? addresses.find((item) => item.isDefault) ?? addresses[0];
  const draft = useMemo(() => (base && address ? { ...base, addressId: address.id, ...(offerCode ? { offerCode } : {}) } : null), [base, address, offerCode]);
  const quote = useSubscriptionQuote(draft);
  const start = useStartSubscription();
  const check = useCheckPayment();
  const [outcome, setOutcome] = useState<OnlinePayment | null>(null);
  const [attempt, setAttempt] = useState(0);
  const draftKey = JSON.stringify(draft);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const idempotencyKey = useMemo(() => newKey(), [draftKey, attempt]);

  if (!base) return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}><StateMessage type="error" title={t("subs.reviewLost")} actionLabel={t("commonActions.back")} onAction={() => router.back()} /></SafeAreaView>;

  const open = (id: string) => router.replace({ pathname: "/subscription-manage", params: { id, started: "1" } });
  const onPayment = (payment: OnlinePayment) => {
    if (payment.status === "paid" && payment.fulfilment === "fulfilled" && payment.subscription) { open(payment.subscription.id); return; }
    setOutcome(payment);
    if (payment.status !== "pending") setAttempt((count) => count + 1);
  };
  const onResult = (result: SubscribeResult) => {
    if (result.subscription) open(result.subscription.id);
    else if (result.payment) onPayment(result.payment);
  };
  const data = quote.data;
  const busy = start.isPending || check.isPending;
  const submit = () => {
    if (!draft || !data || busy) return;
    setOutcome(null);
    start.mutate({ ...draft, idempotencyKey, expectedTotalPaise: data.totalPaise }, {
      onSuccess: onResult,
      onError: (failure) => {
        const code = (failure as { code?: string }).code;
        if (code === "PRICE_CHANGED") void quote.refetch();
        if (code === "PAYMENT_ALREADY_STARTED" || code === "PAYMENT_PROVIDER_UNAVAILABLE") setAttempt((count) => count + 1);
      },
    });
  };
  const failure = start.error ?? check.error;
  // A credit plan must fit in the credit left; otherwise it is blocked here, before anything starts.
  const overCredit = Boolean(data?.credit && data.totalPaise > data.credit.remainingPaise);
  // A typed code that does not work blocks starting, so nobody pays expecting a discount they do not get.
  const badCode = offerCode !== "" && data?.offerProblem != null;
  const kindText = base.kind === "trial" ? t("subs.trial") : t("subs.subscription");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ paddingHorizontal: theme.layout.screenHorizontalPadding }}><ScreenHeader backLabel={t("commonActions.back")} title={t("subs.reviewTitle", { kind: kindText })} /></View>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.xl, padding: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.xl }}>
        <CheckoutSection title={t("checkout.review.deliveryTitle")}>
          {addressesLoading ? <View style={{ padding: theme.spacing.md }}><ThemedText variant="caption">{t("subs.loading")}</ThemedText></View> : null}
          {!addressesLoading && addresses.length === 0 ? (
            <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
              <ThemedText variant="bodySmall">{t("checkout.review.noAddress")}</ThemedText>
              <Button variant="secondary" onPress={() => router.push("/delivery-address-form")}>{t("subs.addAddress")}</Button>
            </View>
          ) : null}
          {addresses.map((item, index) => {
            const selected = item.id === address?.id;
            return (
              <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setAddressId(item.id)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md, borderTopWidth: index === 0 ? theme.borderWidths.none : theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}>
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <ThemedText variant="bodySmall" weight="medium">{item.fullName}</ThemedText>
                  <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{[item.line1, item.line2, item.city].filter(Boolean).join(", ")} – {item.pincode}</ThemedText>
                </View>
                <RadioDot selected={selected} />
              </Pressable>
            );
          })}
        </CheckoutSection>

        {quote.isLoading ? <StateMessage type="loading" title={t("shop.checking")} /> : null}
        {quote.isError ? <StateMessage type="error" title={t("shop.errorTitle")} description={describeError(quote.error)} actionLabel={t("commonActions.back")} onAction={() => router.back()} /> : null}

        {data ? (
          <CheckoutSection title={localized(data.productName, data.productNameGu, language)}>
            <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
              <Row label={t("subs.plan")} value={`${data.planName || kindText} · ${t(`subs.schedule_${data.scheduleType}`)}`} />
              <Row label={t("subs.size")} value={`${data.variantName} · ${formatRupees(data.unitPricePaise)} ${t("checkout.review.each")}`} />
              <Row label={t("subs.length")} value={t("subs.deliveriesEach", { count: data.deliveriesPerLine })} />
              <Row label={t("subs.firstDelivery")} value={formatDeliveryDate(data.startDate, language)} />
              <Row label={t("subs.lastDelivery")} value={formatDeliveryDate(data.endDate, language)} />
            </View>
            <View style={{ height: theme.borderWidths.hairline, backgroundColor: theme.colors.colorBorder }} />
            {data.lines.map((line) => (
              <View key={line.slotId} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText variant="bodySmall" weight="medium">{line.slotName} × {line.quantity}</ThemedText>
                  <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{formatWindow(line.startTime, line.endTime)} · {t("subs.deliveries", { count: data.deliveriesPerLine })}</ThemedText>
                </View>
                <ThemedText variant="bodySmall" weight="medium">{formatRupees(line.linePaise)}</ThemedText>
              </View>
            ))}
            <View style={{ height: theme.borderWidths.hairline, backgroundColor: theme.colors.colorBorder }} />
            <View style={{ gap: theme.spacing.xs, padding: theme.spacing.md }}>
              {data.discountPaise > 0 ? <Row label={t("offers.discount")} value={`−${formatRupees(data.discountPaise)}`} /> : null}
              {data.offer?.gift ? <Row label={t("offers.freeGiftLine")} value={`${data.offer.gift.quantity > 1 ? `${data.offer.gift.quantity} × ` : ""}${localized(data.offer.gift.productName, data.offer.gift.productNameGu, language)} (${data.offer.gift.variantName})`} /> : null}
              <Row label={t("subs.total")} value={formatRupees(data.totalPaise)} strong />
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{data.paymentMethod === "credit" ? t("subs.payCredit") : t("subs.payUpfront")}</ThemedText>
              {data.paymentNote === "excluded_product" ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.notCredit")}</ThemedText> : null}
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.skipPromise")}</ThemedText>
            </View>
          </CheckoutSection>
        ) : null}

        {data ? (
          <OfferCodeBox
            language={language}
            applied={data.offer ? { title: data.offer.title, titleGu: data.offer.titleGu, discountPaise: data.offer.discountPaise, hasGift: data.offer.gift !== null } : null}
            code={offerCode}
            problem={data.offerProblem && offerCode !== "" ? describeError({ code: data.offerProblem.code }) : null}
            loading={quote.isFetching}
            onApply={setOfferCode}
            onRemove={() => setOfferCode("")}
          />
        ) : null}

        {data && data.credit && overCredit ? (
          <View accessibilityRole="alert" style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorDangerTint }}>
            <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorDanger }}>{t("subs.creditShortTitle")}</ThemedText>
            <ThemedText variant="caption">{t("subs.creditShortDetail", { total: formatRupees(data.totalPaise), left: formatRupees(data.credit.remainingPaise), limit: formatRupees(data.credit.limitPaise), owed: formatRupees(data.credit.owedPaise) })}</ThemedText>
            <Button variant="secondary" onPress={() => router.back()}>{t("subs.chooseFewer")}</Button>
          </View>
        ) : null}

        {outcome ? (
          <View accessibilityRole="alert" style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: outcome.status === "pending" ? theme.colors.colorSurfaceMuted : theme.colors.colorWarningTint }}>
            <ThemedText variant="bodySmall" weight="semibold">{outcome.status === "pending" ? t("shop.payment.pendingTitle") : outcome.status === "failed" ? t("shop.payment.failedTitle") : t("shop.payment.refundTitle")}</ThemedText>
            <ThemedText variant="caption">{outcome.status === "pending" ? t("subs.pendingDetail") : outcome.status === "failed" ? t("shop.payment.failed") : t("shop.payment.refundDetail", { amount: formatRupees(outcome.amountPaise) })}</ThemedText>
            {outcome.status === "pending" ? <Button variant="secondary" loading={check.isPending} onPress={() => check.mutate(outcome.merchantOrderId, { onSuccess: onPayment })}>{t("shop.payment.checkAgain")}</Button> : null}
            {outcome.status === "pending" ? <PaymentPoller merchantOrderId={outcome.merchantOrderId} onResult={onPayment} /> : null}
          </View>
        ) : null}
        {failure && !outcome ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(failure)}</ThemedText> : null}
      </ScrollView>
      <CheckoutFooter
        amountPaise={data?.totalPaise ?? 0}
        disabled={!data || quote.isFetching || busy || overCredit || badCode || outcome?.status === "pending"}
        loading={busy}
        label={data?.paymentMethod === "credit" ? t("subs.startButton", { kind: kindText }) : t("shop.payment.payButton", { amount: formatRupees(data?.totalPaise ?? 0) })}
        onPress={submit}
      />
    </SafeAreaView>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
      <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{label}</ThemedText>
      <ThemedText variant={strong ? "body" : "caption"} weight={strong ? "bold" : "semibold"} style={{ flexShrink: 1, textAlign: "right" }}>{value}</ThemedText>
    </View>
  );
}
