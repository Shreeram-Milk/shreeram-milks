import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CheckIcon, CloseIcon } from "../../icons/appIcons";
import { formatPlacedAt } from "../../lib/deliveryText";
import { useTheme } from "../../theme";
import type { Order, OrderStatus } from "../../types/orders";
import { AppIcon } from "../atoms/AppIcon";
import { ThemedText } from "../atoms/ThemedText";

const FLOW: readonly OrderStatus[] = ["placed", "out_for_delivery", "delivered"];
type StepState = "done" | "current" | "todo" | "stopped";
export type OrderStep = { key: string; status: OrderStatus; state: StepState; at: string | null };

/**
 * The steps of an order in order, each done (with the time it happened), current or still to come. A missed or cancelled order
 * ends with that step in red instead of the rest of the delivery.
 */
export function orderSteps(order: Pick<Order, "status" | "timeline" | "placedAt">): OrderStep[] {
  // "Placed" always has a time: the order's own, even where the server sent no step times.
  // Orders saved on the phone by an older version have no step times; they show without them instead of failing.
  const timeOf = (status: OrderStatus) => (order.timeline ?? []).find((entry) => entry.status === status)?.at ?? (status === "placed" && order.placedAt ? order.placedAt : null);
  const stopped = order.status === "missed" || order.status === "cancelled";
  if (stopped) {
    const reached = FLOW.filter((status) => status === "placed" || timeOf(status) !== null);
    return [
      ...reached.map((status): OrderStep => ({ key: status, status, state: "done", at: timeOf(status) })),
      { key: order.status, status: order.status, state: "stopped", at: timeOf(order.status) },
    ];
  }
  const index = FLOW.indexOf(order.status);
  return FLOW.map((status, position): OrderStep => ({
    key: status,
    status,
    state: position < index || order.status === "delivered" ? "done" : position === index ? "current" : "todo",
    at: timeOf(status),
  }));
}

function Dot({ state }: { state: StepState }) {
  const theme = useTheme();
  const filled = state === "done" ? theme.colors.colorAccent : state === "stopped" ? theme.colors.colorDanger : state === "current" ? theme.colors.colorPrimary : theme.colors.colorSurface;
  return (
    <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: filled, borderWidth: state === "todo" ? 2 : 0, borderColor: theme.colors.colorBorder }}>
      {state === "done" ? <AppIcon icon={CheckIcon} accessibilityLabel="" size="sm" tone="onPrimary" strong /> : null}
      {state === "stopped" ? <AppIcon icon={CloseIcon} accessibilityLabel="" size="sm" tone="onPrimary" strong /> : null}
      {state === "current" ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.colorSurface }} /> : null}
    </View>
  );
}

/** Three steps across: Placed, Out for delivery, Delivered. Small, for the order-placed screen. */
export function OrderStepsAcross({ order }: { order: Pick<Order, "status" | "timeline" | "placedAt"> }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const steps = orderSteps(order);
  return (
    <View accessible accessibilityLabel={steps.map((step) => `${t(`shop.status.${step.status}`)}: ${t(`track.state.${step.state}`)}`).join(", ")} style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {steps.map((step, index) => (
        <Fragment key={step.key}>
          <View style={{ alignItems: "center", gap: theme.spacing.xs, width: 84 }}>
            <Dot state={step.state} />
            <ThemedText variant="caption" weight={step.state === "todo" ? "regular" : "semibold"} style={{ textAlign: "center", color: step.state === "todo" ? theme.colors.colorTextSecondary : theme.colors.colorTextPrimary }}>{t(`shop.status.${step.status}`)}</ThemedText>
          </View>
          {index < steps.length - 1 ? (
            <View style={{ flex: 1, height: 2, marginTop: 10, borderRadius: 1, backgroundColor: steps[index + 1]?.state === "todo" ? theme.colors.colorBorder : theme.colors.colorAccent }} />
          ) : null}
        </Fragment>
      ))}
    </View>
  );
}

/** The steps down the page, each with the exact time it happened, or what to expect next. For the tracking screen. */
export function OrderStepsDown({ order, expected }: { order: Pick<Order, "status" | "timeline" | "placedAt">; expected: string }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? i18n.language).startsWith("gu") ? "gu" : "en";
  const steps = orderSteps(order);
  return (
    <View>
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const detail = step.at
          ? formatPlacedAt(step.at, language)
          : step.state === "todo" && step.status === "delivered" ? expected
            : step.state === "current" ? t(`track.now.${step.status}`)
              : step.state === "todo" ? t("track.pending") : "";
        return (
          <View key={step.key} style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <View style={{ alignItems: "center", width: 22 }}>
              <Dot state={step.state} />
              {last ? null : <View style={{ flex: 1, width: 2, minHeight: 28, marginVertical: 2, borderRadius: 1, backgroundColor: steps[index + 1]?.state === "todo" ? theme.colors.colorBorder : theme.colors.colorAccent }} />}
            </View>
            <View style={{ flex: 1, gap: 2, paddingBottom: last ? 0 : theme.spacing.md }}>
              <ThemedText variant="bodySmall" weight={step.state === "todo" ? "medium" : "bold"} style={{ color: step.state === "todo" ? theme.colors.colorTextSecondary : step.state === "stopped" ? theme.colors.colorDanger : theme.colors.colorTextPrimary }}>{t(`shop.status.${step.status}`)}</ThemedText>
              {detail ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, fontVariant: ["tabular-nums"] }}>{detail}</ThemedText> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
