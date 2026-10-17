import type { PaymentStart } from "../types/orders";
import type { CalendarDelivery, DayLine, DayState, ScheduleType, SkipReason, Subscription, SubscriptionDraft, SubscriptionQuote, SubscriptionState } from "../types/subscriptions";
import { ApiRequestError, apiGet, apiSend, hasApi } from "./apiClient";
import { parseStart } from "./orderService";

const record = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const textOrNull = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);
const whole = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => allowed.find((item) => item === value) ?? fallback;
const numbers = (value: unknown): number[] => list(value).filter((item): item is number => typeof item === "number");

const SCHEDULES: readonly ScheduleType[] = ["daily", "alternate_days", "custom_weekdays"];
const STATES: readonly SubscriptionState[] = ["active", "paused", "completed", "cancelled"];
const DAY_STATES: readonly DayState[] = ["upcoming", "placed", "out_for_delivery", "delivered", "missed", "skipped", "paused"];
const SKIP_REASONS: readonly SkipReason[] = ["customer", "admin", "order_cancelled", "credit_limit", "not_deliverable"];

const requireApi = (): void => {
  if (!hasApi()) throw new ApiRequestError("NETWORK_ERROR", 0);
};

function parseGift(raw: unknown): { productName: string; productNameGu: string; variantName: string; quantity: number } | null {
  const gift = record(raw);
  return gift && text(gift.productName) ? { productName: text(gift.productName), productNameGu: text(gift.productNameGu), variantName: text(gift.variantName), quantity: whole(gift.quantity) || 1 } : null;
}

function parseOfferInfo(raw: unknown): SubscriptionQuote["offer"] {
  const offer = record(raw);
  return offer && text(offer.title) ? { title: text(offer.title), titleGu: text(offer.titleGu), code: textOrNull(offer.code), discountPaise: whole(offer.discountPaise), gift: parseGift(offer.gift) } : null;
}

function parseQuote(raw: unknown): SubscriptionQuote {
  const item = record(raw);
  if (!item) throw new ApiRequestError("UNKNOWN_ERROR", 0);
  return {
    kind: item.kind === "trial" ? "trial" : "subscription",
    productName: text(item.productName), productNameGu: text(item.productNameGu), variantName: text(item.variantName), unitPricePaise: whole(item.unitPricePaise),
    planName: text(item.planName), scheduleType: oneOf(item.scheduleType, SCHEDULES, "daily"), weekdays: numbers(item.weekdays), deliveriesPerLine: whole(item.deliveriesPerLine),
    startDate: text(item.startDate), earliestStartDate: text(item.earliestStartDate), endDate: text(item.endDate),
    lines: list(item.lines).flatMap((entry) => {
      const line = record(entry);
      return line ? [{ slotId: text(line.slotId), slotName: text(line.slotName), startTime: text(line.startTime), endTime: text(line.endTime), quantity: whole(line.quantity), linePaise: whole(line.linePaise), endDate: text(line.endDate) }] : [];
    }),
    subtotalPaise: whole(item.subtotalPaise) || whole(item.totalPaise),
    discountPaise: whole(item.discountPaise),
    totalPaise: whole(item.totalPaise),
    offer: parseOfferInfo(item.offer),
    offerProblem: record(item.offerProblem) && text(record(item.offerProblem)?.code) ? { code: text(record(item.offerProblem)?.code), message: text(record(item.offerProblem)?.message) } : null,
    paymentMethod: item.paymentMethod === "credit" ? "credit" : "online",
    paymentNote: item.paymentNote === "excluded_product" ? "excluded_product" : null,
    credit: record(item.credit) ? { limitPaise: whole(record(item.credit)?.limitPaise), owedPaise: whole(record(item.credit)?.owedPaise), remainingPaise: whole(record(item.credit)?.remainingPaise) } : null,
  };
}

function parseDayLine(raw: unknown): DayLine[] {
  const line = record(raw);
  if (!line || !text(line.lineId)) return [];
  return [{
    lineId: text(line.lineId), slotName: text(line.slotName), startTime: text(line.startTime), quantity: whole(line.quantity),
    state: oneOf(line.state, DAY_STATES, "upcoming"), skipReason: SKIP_REASONS.find((reason) => reason === line.skipReason) ?? null,
    orderId: textOrNull(line.orderId), canChange: line.canChange === true,
  }];
}

function parsePause(raw: unknown): { fromDate: string; untilDate: string | null } | null {
  const pause = record(raw);
  return pause && text(pause.fromDate) ? { fromDate: text(pause.fromDate), untilDate: textOrNull(pause.untilDate) } : null;
}

export function parseSubscription(raw: unknown): Subscription | null {
  const item = record(raw);
  if (!item || !text(item.id)) return null;
  const next = record(item.nextDelivery);
  return {
    id: text(item.id), number: text(item.number), kind: item.kind === "trial" ? "trial" : "subscription", status: oneOf(item.status, STATES, "active"),
    productId: text(item.productId), productName: text(item.productName), productNameGu: text(item.productNameGu), variantName: text(item.variantName), unitPricePaise: whole(item.unitPricePaise),
    planName: text(item.planName), scheduleType: oneOf(item.scheduleType, SCHEDULES, "daily"), weekdays: numbers(item.weekdays), deliveriesPerLine: whole(item.deliveriesPerLine),
    startDate: text(item.startDate), endDate: textOrNull(item.endDate), paymentMethod: item.paymentMethod === "credit" ? "credit" : "online", totalPaise: whole(item.totalPaise),
    offerTitle: text(item.offerTitle), offerTitleGu: text(item.offerTitleGu), discountPaise: whole(item.discountPaise), gift: parseGift(item.gift),
    cancelledAt: textOrNull(item.cancelledAt),
    lines: list(item.lines).flatMap((entry) => {
      const line = record(entry);
      return line && text(line.id) ? [{ id: text(line.id), slotName: text(line.slotName), startTime: text(line.startTime), endTime: text(line.endTime), quantity: whole(line.quantity), delivered: whole(line.delivered), remaining: whole(line.remaining), endDate: textOrNull(line.endDate) }] : [];
    }),
    pauses: list(item.pauses).flatMap((entry) => {
      const pause = parsePause(entry);
      const id = text(record(entry)?.id);
      return pause && id ? [{ id, ...pause }] : [];
    }),
    openPause: parsePause(item.openPause),
    nextDelivery: next && text(next.date) ? { date: text(next.date), slotName: text(next.slotName), quantity: whole(next.quantity) } : null,
    days: list(item.days).flatMap((entry) => {
      const day = record(entry);
      return day && text(day.date) ? [{ date: text(day.date), lines: list(day.lines).flatMap(parseDayLine) }] : [];
    }),
  };
}

function subscriptionOf(body: unknown): Subscription {
  const subscription = parseSubscription(record(body)?.subscription);
  if (!subscription) throw new ApiRequestError("UNKNOWN_ERROR", 0);
  return subscription;
}

/** The server's price and dates for what the customer chose. Nothing is written. */
export async function quoteSubscription(draft: SubscriptionDraft): Promise<SubscriptionQuote> {
  requireApi();
  return parseQuote(record(await apiSend<unknown>("POST", "/customer/subscriptions/quote", draft, { auth: true }))?.quote);
}

/**
 * Starts it. On credit the subscription exists at once; paying online returns a started payment instead, and the subscription
 * is written only once PhonePe confirms. The same `idempotencyKey` returns the same subscription or payment.
 */
export async function startSubscription(draft: SubscriptionDraft & { idempotencyKey: string; expectedTotalPaise: number }): Promise<{ subscription: Subscription | null; start: PaymentStart | null }> {
  requireApi();
  const body = record(await apiSend<unknown>("POST", "/customer/subscriptions", draft, { auth: true }));
  const subscription = parseSubscription(body?.subscription);
  return { subscription, start: subscription || !body?.payment ? null : parseStart(body) };
}

export async function getMySubscriptions(): Promise<Subscription[]> {
  requireApi();
  return list(record(await apiGet<unknown>("/customer/subscriptions", { auth: true }))?.subscriptions).flatMap((raw) => {
    const subscription = parseSubscription(raw);
    return subscription ? [subscription] : [];
  });
}

export async function getMySubscription(id: string): Promise<Subscription> {
  requireApi();
  return subscriptionOf(await apiGet<unknown>(`/customer/subscriptions/${encodeURIComponent(id)}`, { auth: true }));
}

export type SubscriptionAction =
  | { type: "skip"; date: string; lineId?: string }
  | { type: "pause"; fromDate: string; untilDate: string | null }
  | { type: "resume"; fromDate: string }
  | { type: "cancel"; reason: string };

export async function changeMySubscription(id: string, action: SubscriptionAction): Promise<Subscription> {
  requireApi();
  const { type, ...body } = action;
  return subscriptionOf(await apiSend<unknown>("POST", `/customer/subscriptions/${encodeURIComponent(id)}/${type}`, body, { auth: true }));
}

/** Everything coming (or past) between two dates, one-off orders and subscription days together. At most 62 days at a time. */
export async function getMyDeliveries(from: string, to: string): Promise<CalendarDelivery[]> {
  requireApi();
  const body = record(await apiGet<unknown>(`/customer/deliveries?from=${from}&to=${to}`, { auth: true }));
  return list(body?.deliveries).flatMap((raw): CalendarDelivery[] => {
    const item = record(raw);
    if (!item || !text(item.date)) return [];
    return [{
      date: text(item.date), source: item.source === "subscription" ? "subscription" : "order",
      state: item.state === "cancelled" ? "cancelled" : oneOf(item.state, DAY_STATES, "upcoming"),
      slotName: textOrNull(item.slotName), startTime: textOrNull(item.startTime),
      items: list(item.items).flatMap((entry) => {
        const line = record(entry);
        return line ? [{ productName: text(line.productName), productNameGu: text(line.productNameGu), variantName: text(line.variantName), quantity: whole(line.quantity) }] : [];
      }),
      orderId: textOrNull(item.orderId), subscriptionId: textOrNull(item.subscriptionId), subscriptionNumber: textOrNull(item.subscriptionNumber), lineId: textOrNull(item.lineId), canChange: item.canChange === true,
    }];
  });
}
