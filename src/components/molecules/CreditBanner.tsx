import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { useMyCredit, usePayRequest } from "../../hooks/useOrders";
import { formatRupees } from "../../lib/catalogCart";
import { describeError } from "../../services/errorMapper";
import { useTheme } from "../../theme";

/** A fresh key for each tap of Pay: a network retry of the same tap reuses it, so one tap never starts two payments. */
const newKey = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/**
 * For a credit customer: a "Pay now" card for each payment the shop has asked for, and a quiet line saying how much they owe.
 * A prepaid customer sees nothing here.
 */
export function CreditBanner() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data } = useMyCredit();
  const pay = usePayRequest();
  if (!data?.account) return null;
  const { account, requests } = data;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {requests.map((request) => (
        <View key={request.id} style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSuccessTint }}>
          <ThemedText variant="bodySmall" weight="semibold" style={{ color: theme.colors.colorSuccess }}>{t("shop.credit.payNowTitle")}</ThemedText>
          <ThemedText variant="caption">{t("shop.credit.payNowDetail", { amount: formatRupees(request.amountPaise), note: request.note ? ` · ${request.note}` : "" })}</ThemedText>
          <View style={{ overflow: "hidden", borderRadius: theme.radii.md }}>
            <Button style={{ backgroundColor: theme.colors.colorTextPrimary }} loading={pay.isPending && pay.variables?.requestId === request.id} disabled={pay.isPending} onPress={() => pay.mutate({ requestId: request.id, idempotencyKey: newKey() })}>{t("shop.credit.payAmount", { amount: formatRupees(request.amountPaise) })}</Button>
            {/* A soft light band that deepens toward the bottom edge: it makes the flat black button look raised. */}
            <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
              {[0.03, 0.05, 0.07, 0.09].map((opacity) => (
                <View key={opacity} style={{ height: theme.spacing.xs, backgroundColor: `rgba(255,255,255,${opacity})` }} />
              ))}
            </View>
          </View>
          {pay.isError && pay.variables?.requestId === request.id ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger }}>{describeError(pay.error)}</ThemedText> : null}
        </View>
      ))}
      {/* The server's answer, after PhonePe: the card itself disappears once the request is paid. */}
      {pay.data ? (
        <ThemedText accessibilityLiveRegion="polite" variant="caption" weight="semibold" style={{ color: pay.data.status === "paid" ? theme.colors.colorSuccess : pay.data.status === "failed" ? theme.colors.colorDanger : theme.colors.colorTextSecondary }}>
          {pay.data.status === "paid" ? t("shop.credit.paidToast") : pay.data.status === "failed" ? t("shop.payment.failed") : t("shop.payment.pendingDetail")}
        </ThemedText>
      ) : null}
      {account.owedPaise > 0 ? (
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("shop.credit.owedLine", { owed: formatRupees(account.owedPaise), limit: formatRupees(account.limitPaise) })}</ThemedText>
      ) : null}
    </View>
  );
}
