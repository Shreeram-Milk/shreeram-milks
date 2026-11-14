import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../src/components/atoms/Button";
import { PressableScale } from "../src/components/atoms/PressableScale";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ListSkeleton } from "../src/components/molecules/LoadingSkeletons";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { ConfirmSheet } from "../src/components/organisms/ConfirmSheet";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { SubscriptionBottomSheet } from "../src/components/organisms/SubscriptionBottomSheet";
import { useMyWallet, useRequestWalletRefund, useTopUp, useWalletEntries } from "../src/hooks/useWallet";
import { WalletIcon } from "../src/icons/appIcons";
import { formatRupees } from "../src/lib/catalogCart";
import { useToast } from "../src/providers/ToastProvider";
import { describeError } from "../src/services/errorMapper";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { OnlinePayment } from "../src/types/orders";
import type { WalletEntry } from "../src/types/wallet";

/** Amounts offered for adding money, in paise. Only those that fit in the wallet are shown. */
const AMOUNTS = [20_000, 50_000, 100_000, 200_000];
const newKey = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

function useDate() {
  const language = useAppStore((state) => state.language);
  return (iso: string) => (iso ? new Date(iso).toLocaleDateString(language === "gu" ? "gu-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
}

/** One line of activity: what happened, when, and how the balance changed. */
function EntryRow({ entry }: { entry: WalletEntry }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const date = useDate();
  const credit = entry.direction === "credit";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.spacing.md - 2, borderBottomWidth: theme.borderWidths.hairline, borderBottomColor: theme.colors.colorBorder }}>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText variant="bodySmall" weight="semibold">{t(`wallet.entry_${entry.type}`, { order: entry.orderNumber ?? "" })}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{date(entry.createdAt)}</ThemedText>
      </View>
      <ThemedText variant="bodySmall" weight="bold" style={{ fontVariant: ["tabular-nums"], color: credit ? theme.colors.colorSuccess : theme.colors.colorTextPrimary }}>
        {credit ? "+" : "−"}{formatRupees(entry.amountPaise)}
      </ThemedText>
    </View>
  );
}

/**
 * The wallet: the balance, adding money with PhonePe, asking for the balance back, and every past change. The balance shown
 * always comes from the server; money is added only after PhonePe confirms the payment.
 */
export default function WalletScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const date = useDate();
  const wallet = useMyWallet();
  const entries = useWalletEntries();
  const topUp = useTopUp();
  const refund = useRequestWalletRefund();
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState(AMOUNTS[1] ?? 50_000);
  const [topUpKey, setTopUpKey] = useState(newKey);
  const [pending, setPending] = useState<OnlinePayment | null>(null);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [refundKey, setRefundKey] = useState(newKey);

  const data = wallet.data;
  const choices = data ? AMOUNTS.filter((value) => value >= data.minTopUpPaise && value <= data.roomPaise) : [];
  const chosen = choices.includes(amount) ? amount : (choices[0] ?? 0);

  const onPaid = (payment: OnlinePayment) => {
    setTopUpKey(newKey());
    if (payment.status === "paid" && payment.fulfilment === "fulfilled") { setAdding(false); setPending(null); showToast(t("wallet.added", { amount: formatRupees(payment.amountPaise) })); return; }
    if (payment.status === "pending") { setAdding(false); setPending(payment); return; }
    if (payment.fulfilment === "refund_due") { setAdding(false); setPending(null); showToast(t("wallet.addRefunded"), "info"); return; }
    showToast(t("shop.payment.failed"), "info");
  };
  const startTopUp = () => {
    if (!chosen || topUp.isPending) return;
    topUp.mutate({ amountPaise: chosen, idempotencyKey: topUpKey }, { onSuccess: onPaid, onError: () => setTopUpKey(newKey()) });
  };
  const askRefund = () => {
    refund.mutate(refundKey, {
      onSuccess: () => { setConfirmRefund(false); setRefundKey(newKey()); showToast(t("wallet.refundRequested")); },
    });
  };

  const header = (
    <View style={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
      <ScreenHeader backLabel={t("wallet.back")} title={t("wallet.title")} />
      {data ? (
        <>
          <View style={{ gap: theme.spacing.xs, padding: theme.spacing.lg, borderRadius: theme.radii.xl, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
            <ThemedText variant="label" style={{ color: theme.colors.colorTextSecondary }}>{t("wallet.balance")}</ThemedText>
            <ThemedText accessibilityRole="header" variant="display" weight="bold" style={{ fontSize: 40, lineHeight: 46, fontVariant: ["tabular-nums"] }}>{formatRupees(data.balancePaise)}</ThemedText>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{data.enabled ? t("wallet.useIt") : t("wallet.notAvailable")}</ThemedText>
            <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              {data.enabled ? <Button style={{ flex: 1 }} disabled={choices.length === 0} onPress={() => setAdding(true)}>{t("wallet.addMoney")}</Button> : null}
              <Button style={{ flex: 1 }} variant="secondary" disabled={data.balancePaise <= 0 || data.openRefund !== null} onPress={() => setConfirmRefund(true)}>{t("wallet.refund")}</Button>
            </View>
            {data.enabled && choices.length === 0 ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("wallet.full", { max: formatRupees(data.maxBalancePaise) })}</ThemedText> : null}
          </View>

          {data.openRefund ? (
            <View accessibilityRole="summary" style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorBrandTint }}>
              <ThemedText variant="bodySmall" weight="bold">{t("wallet.refundOnWay", { amount: formatRupees(data.openRefund.amountPaise) })}</ThemedText>
              <ThemedText variant="caption">{t("wallet.refundTimeline", { date: date(data.openRefund.requestedAt) })}</ThemedText>
              <Pressable accessibilityRole="link" onPress={() => router.push("/support")} hitSlop={theme.spacing.sm}>
                <ThemedText variant="caption" weight="bold" style={{ textDecorationLine: "underline" }}>{t("wallet.contactUs")}</ThemedText>
              </Pressable>
            </View>
          ) : null}

          {pending ? (
            <View accessibilityRole="alert" style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurfaceMuted }}>
              <ThemedText variant="bodySmall" weight="bold">{t("shop.payment.pendingTitle")}</ThemedText>
              <ThemedText variant="caption">{t("wallet.pendingDetail")}</ThemedText>
            </View>
          ) : null}

          <ThemedText accessibilityRole="header" variant="h2">{t("wallet.activity")}</ThemedText>
        </>
      ) : null}
    </View>
  );

  const items = entries.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={data ? items : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EntryRow entry={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          wallet.isLoading || entries.isLoading ? <ListSkeleton count={3} rowHeight={56} />
            : wallet.isError ? <StateMessage type="error" title={t("wallet.loadFailed")} description={describeError(wallet.error)} actionLabel={t("common.retry")} onAction={() => void wallet.refetch()} />
              : <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary, paddingVertical: theme.spacing.md }}>{t("wallet.noActivity")}</ThemedText>
        }
        onEndReached={() => { if (entries.hasNextPage && !entries.isFetchingNextPage) void entries.fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        refreshing={wallet.isRefetching}
        onRefresh={() => { void wallet.refetch(); void entries.refetch(); }}
        contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.xxl }}
        showsVerticalScrollIndicator={false}
      />

      <SubscriptionBottomSheet visible={adding} onClose={() => { if (!topUp.isPending) setAdding(false); }}>
        <View style={{ gap: theme.spacing.md }}>
          <ThemedText variant="h2">{t("wallet.addMoney")}</ThemedText>
          <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("wallet.addDetail")}</ThemedText>
          <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {choices.map((value) => {
              const selected = value === chosen;
              return (
                <PressableScale
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setAmount(value)}
                  pressScale={theme.motion.pressScale.control}
                  style={{ minHeight: theme.layout.touchTargetMin + 4, minWidth: 72, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.md, borderWidth: selected ? 1.5 : theme.borderWidths.hairline, borderColor: selected ? theme.colors.colorPrimary : theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface }}
                >
                  <ThemedText variant="body" weight={selected ? "bold" : "medium"}>{formatRupees(value)}</ThemedText>
                </PressableScale>
              );
            })}
          </View>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{data ? t("wallet.limits", { max: formatRupees(data.maxBalancePaise) }) : ""}</ThemedText>
          {topUp.error ? <ThemedText variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(topUp.error)}</ThemedText> : null}
          <Button loading={topUp.isPending} disabled={!chosen} onPress={startTopUp}>{t("wallet.payWithPhonePe", { amount: formatRupees(chosen) })}</Button>
        </View>
      </SubscriptionBottomSheet>

      <ConfirmSheet
        visible={confirmRefund}
        icon={WalletIcon}
        title={t("wallet.refundTitle", { amount: formatRupees(data?.balancePaise ?? 0) })}
        description={t("wallet.refundDetail")}
        consequences={[t("wallet.refundPoint1"), t("wallet.refundPoint2")]}
        confirmLabel={t("wallet.requestRefund")}
        cancelLabel={t("wallet.notNow")}
        loading={refund.isPending}
        errorText={refund.error ? describeError(refund.error) : undefined}
        onCancel={() => setConfirmRefund(false)}
        onConfirm={askRefund}
      />
    </SafeAreaView>
  );
}
