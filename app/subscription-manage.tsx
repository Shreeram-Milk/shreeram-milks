import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon, type IconSvgElement, type IconTone } from "../src/components/atoms/AppIcon";
import { Button } from "../src/components/atoms/Button";
import { Card } from "../src/components/atoms/Card";
import { Chip } from "../src/components/atoms/Chip";
import { PressableScale } from "../src/components/atoms/PressableScale";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { DeliveryRange } from "../src/components/molecules/DeliveryRange";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { ConfirmSheet } from "../src/components/organisms/ConfirmSheet";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { SubscriptionDayList } from "../src/components/organisms/SubscriptionDayList";
import { SubscriptionBottomSheet } from "../src/components/organisms/SubscriptionBottomSheet";
import { useCatalogProductImage } from "../src/hooks/useCatalog";
import { useCountdownLabel } from "../src/hooks/useCountdownLabel";
import { useChangeSubscription, useMySubscription } from "../src/hooks/useSubscriptions";
import { CalendarIcon, ForwardIcon, RepeatIcon } from "../src/icons/appIcons";
import { formatRupees } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";
import { formatDeliveryDate, formatShortDay, formatWindow, indiaToday } from "../src/lib/deliveryText";
import { tapFeedback } from "../src/lib/haptics";
import { useToast } from "../src/providers/ToastProvider";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { DayLine, Subscription } from "../src/types/subscriptions";
import { remoteImage } from "../src/lib/remoteImage";

const CANCEL_REASONS = ["notNeeded", "quality", "price", "moving", "other"] as const;
const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** A skip (or undo) waiting for the customer to confirm it. */
type PendingSkip = { date: string; line: DayLine };

/** One subscription or trial: the plan at a glance, quick Skip / Going away / Resume, the details, the coming days, and a quiet Cancel. */
export default function ManageSubscriptionScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const language = useAppStore((state) => state.language);
  const params = useLocalSearchParams<{ id?: string; started?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: subscription, isLoading, isError, refetch } = useMySubscription(id);
  // The photo comes from the catalogue already on the phone, not a second request.
  const imageUrl = useCatalogProductImage(subscription?.productId);
  const change = useChangeSubscription(id ?? "");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState<(typeof CANCEL_REASONS)[number]>("notNeeded");
  const [pending, setPending] = useState<PendingSkip | null>(null);
  const nextLine = subscription?.lines.find((line) => line.slotName === subscription.nextDelivery?.slotName);
  const countdown = useCountdownLabel(subscription?.nextDelivery?.date, nextLine?.startTime);

  const goBack = () => (params.started ? router.replace("/subscriptions") : router.back());
  const title = t(subscription?.kind === "trial" ? "subs.manageTrial" : "subscriptionManage.title");
  const header = <View style={{ paddingHorizontal: theme.layout.screenHorizontalPadding }}><ScreenHeader backLabel={t("subscriptionManage.back")} title={title} onBack={goBack} /></View>;
  if (isLoading || isError || !subscription) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
        {header}
        <View style={{ paddingHorizontal: theme.layout.screenHorizontalPadding }}>
          <StateMessage type={isError || (!isLoading && !subscription) ? "error" : "loading"} title={t(isError ? "errors.UNKNOWN_ERROR" : "subs.loading")} actionLabel={isError ? t("common.retry") : undefined} onAction={isError ? () => void refetch() : undefined} />
        </View>
      </SafeAreaView>
    );
  }

  const live = subscription.status === "active" || subscription.status === "paused";
  const paused = subscription.status === "paused";
  const name = localized(subscription.productName, subscription.productNameGu, language);
  const perDelivery = subscription.unitPricePaise * subscription.lines.reduce((sum, line) => sum + line.quantity, 0);
  const schedule = subscription.kind === "trial" ? t("subs.trialDaily") : subscription.scheduleType === "custom_weekdays" ? subscription.weekdays.map((day) => t(`subs.weekdayShort_${WEEKDAY_KEYS[day - 1]}`)).join(", ") : t(`subs.schedule_${subscription.scheduleType}`);
  const nextText = paused ? t("subs.pausedNow") : subscription.nextDelivery ? `${formatShortDay(subscription.nextDelivery.date, language, t)} · ${subscription.nextDelivery.slotName}${countdown ? ` · ${countdown}` : ""}` : undefined;
  // Vacations still ahead (or running), so the customer sees what is already paused.
  const vacations = subscription.pauses.filter((pause) => pause.untilDate !== null && pause.untilDate >= indiaToday());
  const pauseNote = subscription.openPause
    ? t("subs.pausedFrom", { date: formatDeliveryDate(subscription.openPause.fromDate, language) })
    : vacations.length > 0 ? t("subs.vacationsSet", { list: vacations.map((pause) => `${formatShortDay(pause.fromDate, language, t)} – ${formatShortDay(pause.untilDate ?? pause.fromDate, language, t)}`).join(", ") }) : null;
  const nextChangeable = subscription.days.flatMap((day) => day.lines.filter((line) => line.canChange && line.state !== "skipped").map((line) => ({ date: day.date, line })))[0] ?? null;
  const openVacation = (mode?: "resume") => router.push({ pathname: "/subscription-vacation", params: mode ? { id: subscription.id, mode } : { id: subscription.id } });

  const confirmSkip = () => {
    if (!pending) return;
    change.mutate({ type: "skip", date: pending.date, lineId: pending.line.lineId }, {
      onSuccess: () => { tapFeedback(); showToast(t("subs.skipped", { date: formatShortDay(pending.date, language, t) })); setPending(null); },
      onError: (failure) => { showToast(describeError(failure), "error"); setPending(null); },
    });
  };
  const cancel = () => change.mutate({ type: "cancel", reason: t(`subs.reason_${reason}`) }, {
    onSuccess: () => { setCancelOpen(false); showToast(t("subs.cancelledToast")); },
    onError: (failure) => showToast(describeError(failure), "error"),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      {header}
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xxl }} showsVerticalScrollIndicator={false}>
        {params.started ? (
          <Card tone="highlight" accessibilityRole="alert" style={{ gap: theme.spacing.xs }}>
            <ThemedText variant="bodySmall" weight="bold" style={{ color: theme.colors.colorAccent }}>{t("subs.startedTitle")}</ThemedText>
            <ThemedText variant="caption">{t("subs.startedDetail")}</ThemedText>
          </Card>
        ) : null}

        {/* The plan at a glance: what, its state, and the first and last day joined by the next delivery. */}
        <Card style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4 }}>
            <View style={{ width: 64, height: 64, overflow: "hidden", borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }}>
              <Image source={imageUrl ? remoteImage(imageUrl) : require("../assets/onboarding-milk-hero.png")} contentFit="cover" style={{ width: "100%", height: "100%" }} />
            </View>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <StatusPill status={subscription.status} />
              <ThemedText variant="body" weight="bold" numberOfLines={2}>{name}</ThemedText>
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{subscription.variantName} · #{subscription.number}</ThemedText>
            </View>
          </View>
          <DeliveryRange
            start={subscription.startDate}
            end={subscription.endDate}
            firstLabel={t("subs.firstDelivery")}
            lastLabel={t("subs.lastDelivery")}
            middle={nextText ? t("subs.nextDelivery") : undefined}
            middleDetail={nextText}
            language={language}
          />
        </Card>

        {live ? (
          <View style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: "row", gap: theme.spacing.sm + 2 }}>
              <QuickAction icon={ForwardIcon} label={t("subs.quickSkip")} tone="brand" tint={theme.colors.colorPrimaryTint} onPress={nextChangeable ? () => setPending(nextChangeable) : undefined} />
              {!subscription.openPause ? <QuickAction icon={CalendarIcon} label={t("subs.quickAway")} tone="highlight" tint={theme.colors.colorHighlightTint} onPress={() => openVacation()} /> : null}
              {subscription.pauses.length > 0 ? <QuickAction icon={RepeatIcon} label={t("subs.quickResume")} tone="accent" tint={theme.colors.colorAccentTint} onPress={() => openVacation("resume")} /> : null}
            </View>
            {pauseNote ? <ThemedText variant="caption" style={{ color: theme.colors.colorHighlightText }}>{pauseNote}</ThemedText> : null}
          </View>
        ) : null}

        <View style={{ gap: theme.spacing.sm }}>
          <ThemedText variant="label" weight="bold">{t("subs.planDetails")}</ThemedText>
          <Card padded={false}>
            <DetailRow label={t("subs.scheduleLabel")} value={schedule} />
            {subscription.lines.map((line) => <DetailRow key={line.id} label={`${line.slotName} · ${formatWindow(line.startTime, line.endTime)}`} value={t("subs.lineProgress", { quantity: line.quantity, delivered: line.delivered, left: line.remaining })} />)}
            <DetailRow label={t("subs.paymentLabel")} value={t(subscription.paymentMethod === "credit" ? "subs.onCredit" : "subs.paidOnline")} />
            {subscription.offerTitle ? <DetailRow label={t("offers.offerUsed")} value={localized(subscription.offerTitle, subscription.offerTitleGu, language)} detail={subscription.discountPaise > 0 ? t("offers.youSave", { amount: formatRupees(subscription.discountPaise) }) : undefined} /> : null}
            {subscription.gift ? <DetailRow label={t("offers.freeGiftLine")} value={`${subscription.gift.quantity > 1 ? `${subscription.gift.quantity} × ` : ""}${localized(subscription.gift.productName, subscription.gift.productNameGu, language)}`} detail={t("offers.giftFirstDelivery")} /> : null}
            <DetailRow label={t("subs.perDeliveryLabel")} value={formatRupees(perDelivery)} detail={t("subs.totalPaid", { total: formatRupees(subscription.totalPaise) })} strong />
          </Card>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ gap: 2 }}>
            <ThemedText variant="label" weight="bold">{t("subs.comingDays")}</ThemedText>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.skipPromise")}</ThemedText>
          </View>
          {subscription.days.length === 0 ? <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t(live ? "subs.noComingDays" : "subs.noMoreDays")}</ThemedText> : null}
          <SubscriptionDayList busy={change.isPending} days={subscription.days} language={language} onSkip={(date, line) => setPending({ date, line })} />
        </View>

        {live ? (
          <View style={{ alignItems: "center", gap: theme.spacing.xs }}>
            <PressableScale accessibilityRole="button" hitSlop={theme.spacing.sm} onPress={() => setCancelOpen(true)} style={{ paddingVertical: theme.spacing.sm }}>
              <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorDanger }}>{t("subs.cancelButton")}</ThemedText>
            </PressableScale>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t(subscription.paymentMethod === "online" ? "subs.cancelOnline" : "subs.cancelCredit")}</ThemedText>
          </View>
        ) : null}
      </ScrollView>

      {pending ? (
        <ConfirmSheet
          visible
          icon={CalendarIcon}
          title={t("subs.skipConfirmTitle", { date: formatShortDay(pending.date, language, t) })}
          description={t("subs.skipConfirmDetail")}
          consequences={[`${pending.line.slotName} × ${pending.line.quantity}`]}
          confirmLabel={t("subs.skipConfirm")}
          cancelLabel={t("subs.keepDelivery")}
          loading={change.isPending}
          onCancel={() => setPending(null)}
          onConfirm={confirmSkip}
        />
      ) : null}

      <SubscriptionBottomSheet visible={cancelOpen} onClose={() => (change.isPending ? undefined : setCancelOpen(false))}>
        <View style={{ gap: theme.spacing.md }}>
          <View style={{ gap: theme.spacing.xs }}>
            <ThemedText variant="h2">{t("subs.cancelTitle")}</ThemedText>
            <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t(subscription.paymentMethod === "online" ? "subs.cancelOnline" : "subs.cancelCredit")}</ThemedText>
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <ThemedText variant="label" weight="bold">{t("subscriptionManage.selectReason")}</ThemedText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
              {CANCEL_REASONS.map((item) => <Chip key={item} selected={item === reason} onPress={() => setReason(item)}>{t(`subs.reason_${item}`)}</Chip>)}
            </View>
          </View>
          {!subscription.openPause ? (
            <PressableScale accessibilityRole="button" onPress={() => { setCancelOpen(false); openVacation(); }} style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorHighlightTint }}>
              <ThemedText variant="bodySmall" weight="bold">{t("subscriptionManage.awayTitle")}</ThemedText>
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.awayInstead")}</ThemedText>
              <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorPrimary }}>{t("subscriptionManage.pauseInstead")}</ThemedText>
            </PressableScale>
          ) : null}
          <Button disabled={change.isPending} onPress={() => setCancelOpen(false)}>{t("subscriptionManage.keep")}</Button>
          <Button variant="danger" loading={change.isPending} onPress={cancel}>{t("subscriptionManage.cancelAnyway")}</Button>
        </View>
      </SubscriptionBottomSheet>
    </SafeAreaView>
  );
}

/** Active, paused or ended as a small coloured pill. */
function StatusPill({ status }: { status: Subscription["status"] }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tone = status === "active" ? { bg: theme.colors.colorAccentTint, fg: theme.colors.colorAccent } : status === "paused" ? { bg: theme.colors.colorHighlightTint, fg: theme.colors.colorHighlightText } : { bg: theme.colors.colorSurfaceMuted, fg: theme.colors.colorTextSecondary };
  return (
    <View style={{ alignSelf: "flex-start", borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: 2, backgroundColor: tone.bg }}>
      <ThemedText variant="badgeLabel" style={{ color: tone.fg }}>{t(`subs.status_${status}`)}</ThemedText>
    </View>
  );
}

/** One of the plan's quick actions: a coloured icon over a short label. Greyed out when there is nothing to do. */
function QuickAction({ icon, label, onPress, tint, tone }: { icon: IconSvgElement; label: string; onPress?: () => void; tint: string; tone: IconTone }) {
  const theme = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityState={{ disabled: !onPress }} disabled={!onPress} onPress={onPress} containerStyle={{ flex: 1 }} style={{ alignItems: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.md - 2, paddingHorizontal: theme.spacing.xs, borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface, opacity: onPress ? theme.opacity.full : theme.opacity.disabled, ...theme.elevation.card }}>
      <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md, backgroundColor: tint }}>
        <AppIcon icon={icon} accessibilityLabel="" size="sm" tone={tone} />
      </View>
      <ThemedText variant="caption" weight="bold" numberOfLines={2} style={{ textAlign: "center" }}>{label}</ThemedText>
    </PressableScale>
  );
}

/** A label on the left and its value on the right, in readable text, with an optional small line under the value. */
function DetailRow({ detail, label, strong = false, value }: { detail?: string; label: string; strong?: boolean; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.md, paddingVertical: theme.spacing.md - 4, paddingHorizontal: theme.spacing.md, borderTopWidth: theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder, marginTop: -theme.borderWidths.hairline }}>
      <ThemedText variant="bodySmall" style={{ flexShrink: 1, color: theme.colors.colorTextSecondary }}>{label}</ThemedText>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <ThemedText variant="bodySmall" weight={strong ? "extrabold" : "semibold"} style={{ textAlign: "right", fontVariant: ["tabular-nums"] }}>{value}</ThemedText>
        {detail ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{detail}</ThemedText> : null}
      </View>
    </View>
  );
}
