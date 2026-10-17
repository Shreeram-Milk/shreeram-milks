import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../../src/components/atoms/AppIcon";
import { Button } from "../../src/components/atoms/Button";
import { Card } from "../../src/components/atoms/Card";
import { IconButton } from "../../src/components/atoms/IconButton";
import { PressableScale } from "../../src/components/atoms/PressableScale";
import { RiseIn } from "../../src/components/atoms/RiseIn";
import { ThemedText } from "../../src/components/atoms/ThemedText";
import { ListSkeleton } from "../../src/components/molecules/LoadingSkeletons";
import { SegmentedTabs } from "../../src/components/molecules/SegmentedTabs";
import { ConfirmSheet } from "../../src/components/organisms/ConfirmSheet";
import { StateMessage } from "../../src/components/organisms/StateMessage";
import { useCatalogProductImage } from "../../src/hooks/useCatalog";
import { useChangeSubscription, useMySubscriptions } from "../../src/hooks/useSubscriptions";
import { CalendarIcon, RepeatIcon } from "../../src/icons/appIcons";
import { formatRupees } from "../../src/lib/catalogCart";
import { localized } from "../../src/lib/contentLocalization";
import { formatShortDay } from "../../src/lib/deliveryText";
import { tapFeedback } from "../../src/lib/haptics";
import { useToast } from "../../src/providers/ToastProvider";
import { describeError } from "../../src/services/errorMapper";
import { useAppStore } from "../../src/store/useAppStore";
import { useTheme } from "../../src/theme";
import type { Subscription } from "../../src/types/subscriptions";

type Tab = "active" | "paused" | "ended";
const TABS: Tab[] = ["active", "paused", "ended"];
const PHOTO_SIZE = 56;
const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const inTab = (subscription: Subscription, tab: Tab) => (tab === "ended" ? subscription.status === "completed" || subscription.status === "cancelled" : subscription.status === tab);

/** Status by meaning: mint while running, marigold while paused, grey once ended. */
function StatusPill({ status }: { status: Subscription["status"] }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tone = status === "active" ? { bg: theme.colors.colorAccentTint, fg: theme.colors.colorAccent } : status === "paused" ? { bg: theme.colors.colorHighlightTint, fg: theme.colors.colorHighlightText } : { bg: theme.colors.colorSurfaceMuted, fg: theme.colors.colorTextSecondary };
  return (
    <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: 2, backgroundColor: tone.bg }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone.fg }} />
      <ThemedText variant="badgeLabel" style={{ color: tone.fg }}>{t(`subs.status_${status}`)}</ThemedText>
    </View>
  );
}

/** One small column of the card's facts: a grey label over a bold value. */
function Fact({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <ThemedText variant="badgeLabel" weight="medium" numberOfLines={1} style={{ color: theme.colors.colorTextSecondary }}>{label}</ThemedText>
      <ThemedText variant="caption" weight="bold" numberOfLines={2} style={{ color: tone ?? theme.colors.colorTextPrimary, fontVariant: ["tabular-nums"] }}>{value}</ThemedText>
    </View>
  );
}

/**
 * One subscription or trial: a small photo tile with the name, status and schedule; then three columns (next delivery, time,
 * last day); then the price with one orange Skip next. Tapping the card opens the plan.
 */
const SubscriptionCard = memo(function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const language = useAppStore((state) => state.language);
  const imageUrl = useCatalogProductImage(subscription.productId);
  const change = useChangeSubscription(subscription.id);
  const [confirming, setConfirming] = useState(false);
  const name = localized(subscription.productName, subscription.productNameGu, language);
  const schedule = subscription.kind === "trial" ? t("subs.trialDaily") : subscription.scheduleType === "custom_weekdays" ? subscription.weekdays.map((day) => t(`subs.weekdayShort_${WEEKDAY_KEYS[day - 1]}`)).join(", ") : t(`subs.schedule_${subscription.scheduleType}`);
  const perDelivery = subscription.unitPricePaise * subscription.lines.reduce((sum, line) => sum + line.quantity, 0);
  // The next delivery the customer can still skip (all of that day's windows), if any.
  const nextChangeable = subscription.days.find((day) => day.lines.some((line) => line.canChange && line.state !== "skipped"));
  const live = subscription.status === "active" || subscription.status === "paused";
  const paused = subscription.status === "paused";
  const next = paused ? t("subs.pausedNow") : subscription.nextDelivery ? formatShortDay(subscription.nextDelivery.date, language, t) : "—";
  const time = subscription.lines.map((line) => `${line.slotName} × ${line.quantity}`).join(", ");
  const ends = subscription.endDate ? formatShortDay(subscription.endDate, language, t) : t("subs.whenResumed");
  const openManage = () => router.push({ pathname: "/subscription-manage", params: { id: subscription.id } });

  const skip = () => {
    if (!nextChangeable) return;
    change.mutate({ type: "skip", date: nextChangeable.date }, {
      onSuccess: () => { tapFeedback(); setConfirming(false); showToast(t("subs.skipped", { date: formatShortDay(nextChangeable.date, language, t) })); },
      onError: (failure) => showToast(describeError(failure), "error"),
    });
  };

  return (
    <Card padded={false}>
      <PressableScale accessibilityRole="button" accessibilityLabel={t("subscriptionsManage.manage", { product: name })} onPress={openManage} pressScale={theme.motion.pressScale.card} style={{ gap: theme.spacing.md, padding: theme.spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4 }}>
          <View style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, overflow: "hidden", borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }}>
            <Image source={imageUrl ? { uri: imageUrl } : require("../../assets/onboarding-milk-hero.png")} contentFit="cover" transition={theme.motion.duration.fast} style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }} />
          </View>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <ThemedText variant="body" weight="bold" numberOfLines={2}>{name}</ThemedText>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: theme.spacing.sm }}>
              <StatusPill status={subscription.status} />
              <ThemedText variant="caption" numberOfLines={1} style={{ flexShrink: 1, color: theme.colors.colorTextSecondary }}>{schedule} · {subscription.variantName}</ThemedText>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm, paddingTop: theme.spacing.md - 4, borderTopWidth: theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
          <Fact label={t("subs.colNext")} value={next} tone={paused ? theme.colors.colorHighlightText : theme.colors.colorAccent} />
          <Fact label={t("subs.colTime")} value={time} />
          <Fact label={t("subs.colEnds")} value={ends} />
        </View>
      </PressableScale>
      {/* Price and the one action, set off by a line like the facts above, with a thin divider between the two. */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, marginHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md - 4, borderTopWidth: theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText variant="badgeLabel" weight="medium" style={{ color: theme.colors.colorTextSecondary }}>{t("subs.colPrice")}</ThemedText>
          <ThemedText variant="body" weight="extrabold" style={{ fontVariant: ["tabular-nums"] }}>{formatRupees(perDelivery)}</ThemedText>
        </View>
        {live && nextChangeable ? (
          <>
            <View style={{ width: theme.borderWidths.hairline, alignSelf: "stretch", backgroundColor: theme.colors.colorBorder }} />
            <Button compact variant="tonal" icon={CalendarIcon} accessibilityLabel={t("subscriptionsManage.skip", { product: name })} onPress={() => setConfirming(true)} style={{ alignSelf: "center" }}>{t("subscriptionsManage.skipNext")}</Button>
          </>
        ) : null}
      </View>
      {nextChangeable ? (
        <ConfirmSheet
          visible={confirming}
          icon={CalendarIcon}
          title={t("subs.skipConfirmTitle", { date: formatShortDay(nextChangeable.date, language, t) })}
          description={t("subs.skipConfirmDetail")}
          consequences={nextChangeable.lines.filter((line) => line.canChange && line.state !== "skipped").map((line) => `${line.slotName} × ${line.quantity}`)}
          confirmLabel={t("subs.skipConfirm")}
          cancelLabel={t("subs.keepDelivery")}
          loading={change.isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={skip}
        />
      ) : null}
    </Card>
  );
});

function EmptySubscriptions({ tab }: { tab: Tab }) {
  const theme = useTheme();
  const { t } = useTranslation();
  if (tab !== "active") return <View style={{ paddingTop: theme.spacing.lg }}><StateMessage type="empty" icon={CalendarIcon} title={t(tab === "paused" ? "subs.emptyPaused" : "subs.emptyEnded")} /></View>;
  return (
    <View style={{ gap: theme.spacing.lg, paddingVertical: theme.spacing.md }}>
      <View style={{ alignItems: "center", gap: theme.spacing.md - 4, paddingTop: theme.spacing.lg }}>
        <View style={{ width: 88, height: 88, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorAccentTint }}>
          <AppIcon icon={RepeatIcon} accessibilityLabel={t("subscriptions.emptyIcon")} size="lg" tone="accent" />
        </View>
        <ThemedText variant="h2" style={{ textAlign: "center" }}>{t("subs.emptyTitle")}</ThemedText>
        <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t("subs.emptyDetail")}</ThemedText>
        <Button style={{ alignSelf: "center" }} onPress={() => router.navigate("/products")}>{t("subs.browse")}</Button>
      </View>
      <Card tone="muted" style={{ gap: theme.spacing.sm }}>
        <ThemedText variant="label" weight="bold">{t("subscriptions.perks")}</ThemedText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {["subs.perkSkip", "subs.perkPause", "subs.perkEnd"].map((key) => (
            <View key={key} style={{ borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm + 2, paddingVertical: theme.spacing.xs, backgroundColor: theme.colors.colorSurface }}>
              <ThemedText variant="caption" weight="semibold">{t(key)}</ThemedText>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

export default function SubscriptionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data = [], isLoading, isError, refetch, isRefetching } = useMySubscriptions();
  const [tab, setTab] = useState<Tab>("active");
  const shown = data.filter((item) => inTab(item, tab));
  const live = data.filter((item) => item.status === "active" || item.status === "paused");
  const tabs = TABS.map((key) => ({ key, label: t(`subs.tab_${key}`, { count: data.filter((entry) => inTab(entry, key)).length }) }));

  const listHeader = (
    <View style={{ gap: theme.spacing.md - 4, paddingBottom: theme.spacing.xs }}>
      <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
      {live.length > 0 && tab !== "ended" ? (
        <PressableScale accessibilityRole="button" onPress={() => router.push("/subscription-vacation")} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4, padding: theme.spacing.md - 4, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorHighlightTint }}>
          <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurface }}>
            <AppIcon icon={CalendarIcon} accessibilityLabel="" tone="highlight" size="sm" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText variant="bodySmall" weight="bold">{t("subscriptions.awayTitle")}</ThemedText>
            <ThemedText variant="caption" style={{ color: theme.colors.colorHighlightText }}>{t("subscriptions.awayDetail")}</ThemedText>
          </View>
          <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorPrimary }}>{t("subscriptions.pause")}</ThemedText>
        </PressableScale>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
        <ThemedText variant="h1">{t("subscriptions.title")}</ThemedText>
        <IconButton icon={CalendarIcon} label={t("calendar.title")} filled onPress={() => router.push("/delivery-calendar")} />
      </View>
      <FlatList
        data={isLoading || isError ? [] : shown}
        renderItem={({ item, index }) => <RiseIn index={index}><SubscriptionCard subscription={item} /></RiseIn>}
        keyExtractor={(item) => item.id}
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        contentContainerStyle={{ gap: theme.spacing.md - 4, paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.xs, paddingBottom: theme.spacing.lg }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={isLoading ? <ListSkeleton count={3} rowHeight={150} /> : isError ? <StateMessage type="error" title={t("errors.UNKNOWN_ERROR")} actionLabel={t("common.retry")} onAction={() => void refetch()} /> : <EmptySubscriptions tab={tab} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
