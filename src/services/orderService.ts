import type { ServedSlot } from "../types/delivery";
import type { CheckoutHandle, CreditSummary, MyCredit, OnlinePayment, Order, OrderLine, OrderStatus, PaymentRequest, PaymentStart, PaymentState, Quote, QuoteOffer, QuoteOrder } from "../types/orders";
import { parseSlot } from "./deliveryAvailabilityService";
import { ApiRequestError, apiGet, apiSend, hasApi } from "./apiClient";

const record = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const whole = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const STATUSES: readonly OrderStatus[] = ["placed", "out_for_delivery", "delivered", "missed", "cancelled"];

/** Orders need the real backend and a signed-in customer; there are no sample orders to fall back on. */
const requireApi = (): void => {
  if (!hasApi()) throw new ApiRequestError("NETWORK_ERROR", 0);
};

function parseLine(raw: unknown): OrderLine | null {
  const item = record(raw);
  const variantId = text(item?.variantId);
  if (!item || !variantId) return null;
  return {
    id: text(item.id) || variantId,
    productId: text(item.productId),
    variantId,
    productName: text(item.productName),
    productNameGu: text(item.productNameGu),
    variantName: text(item.variantName),
    purchaseMethod: item.purchaseMethod === "trial" || item.purchaseMethod === "subscription" || item.purchaseMethod === "buy_once" ? item.purchaseMethod : undefined,
    unitPricePaise: whole(item.unitPricePaise),
    quantity: whole(item.quantity),
    lineTotalPaise: whole(item.lineTotalPaise),
    isGift: item.isGift === true,
  };
}
const lines = (raw: unknown): OrderLine[] => list(raw).map(parseLine).filter((line): line is OrderLine => line !== null);

/** Checks one order from the server. A malformed one is dropped rather than shown half-filled. */
export function parseOrder(raw: unknown): Order | null {
  const item = record(raw);
  const id = text(item?.id);
  const status = STATUSES.find((candidate) => candidate === item?.status);
  if (!item || !id || !status) return null;
  const slot = record(item.slot);
  return {
    id,
    orderNumber: text(item.orderNumber),
    status,
    deliveryMethod: item.deliveryMethod === "shipping" ? "shipping" : "local_delivery",
    deliveryDate: text(item.deliveryDate),
    slot: slot && text(slot.id) ? { id: text(slot.id), name: text(slot.name), startTime: text(slot.startTime), endTime: text(slot.endTime) } : null,
    recipientName: text(item.recipientName),
    addressText: [text(item.addressLine1), text(item.addressLine2), text(item.landmark), text(item.city)].filter(Boolean).join(", "),
    pinCode: text(item.pinCode),
    courierName: text(item.courierName),
    // Only a web link is ever opened.
    trackingUrl: /^https?:\/\//.test(text(item.trackingUrl)) ? text(item.trackingUrl) : "",
    totalPaise: whole(item.totalPaise),
    discountPaise: whole(item.discountPaise),
    offerTitle: text(item.offerTitle),
    offerTitleGu: text(item.offerTitleGu),
    paymentMethod: item.paymentMethod === "credit" ? "credit" : "online",
    paymentStatus: item.paymentStatus === "paid" || item.paymentStatus === "refunded" || item.paymentStatus === "partially_refunded" ? item.paymentStatus : "unpaid",
    placedAt: text(item.placedAt),
    subscriptionId: text(item.subscriptionId) || null,
    cancelReason: text(item.cancelReason),
    canCancel: item.canCancel === true,
    items: lines(item.items),
  };
}

const orders = (raw: unknown): Order[] => list(raw).map(parseOrder).filter((order): order is Order => order !== null);

function parseQuoteOrder(raw: unknown): QuoteOrder | null {
  const item = record(raw);
  const key = text(item?.key);
  if (!item || !key) return null;
  return {
    key,
    deliveryMethod: item.deliveryMethod === "shipping" ? "shipping" : "local_delivery",
    items: lines(item.items),
    discountPaise: whole(item.discountPaise),
    totalPaise: whole(item.totalPaise),
    slots: list(item.slots).map(parseSlot).filter((slot): slot is ServedSlot => slot !== null),
    selectedSlotId: text(item.selectedSlotId) || null,
    deliveryDate: text(item.deliveryDate) || null,
    orderBy: text(item.orderBy) || null,
    payment: item.payment === "credit" ? "credit" : "online",
    paymentNote: item.paymentNote === "excluded_product" ? "excluded_product" : null,
  };
}

function parseQuoteOffer(raw: unknown): QuoteOffer | null {
  const item = record(raw);
  const id = text(item?.id);
  if (!item || !id) return null;
  return { id, title: text(item.title), titleGu: text(item.titleGu), code: text(item.code) || null, discountPaise: whole(item.discountPaise) };
}

const credit = (raw: unknown): CreditSummary | null => {
  const item = record(raw);
  return item ? { limitPaise: whole(item.limitPaise), owedPaise: whole(item.owedPaise), remainingPaise: whole(item.remainingPaise) } : null;
};

export interface CheckoutRequest {
  addressId: string;
  lines: { variantId: string; quantity: number; slotId?: string }[];
  /** The delivery window chosen for each order, keyed by the order's `key`. */
  slots: Record<string, string>;
  /** A code the customer typed. Without one, the server picks the best automatic offer (if any). */
  offerCode?: string;
}

/** Asks the server to price the cart and say what it becomes. Nothing is saved. */
export async function quoteOrder(request: CheckoutRequest): Promise<Quote> {
  requireApi();
  const body = record(await apiSend<unknown>("POST", "/customer/orders/quote", request, { auth: true }));
  const quote = record(body?.quote);
  if (!quote) throw new ApiRequestError("UNKNOWN_ERROR", 0);
  const needed = record(quote.credit);
  const summary = credit(quote.credit);
  return {
    pinCode: text(quote.pinCode),
    orders: list(quote.orders).map(parseQuoteOrder).filter((order): order is QuoteOrder => order !== null),
    unavailable: list(quote.unavailable).flatMap((entry) => {
      const item = record(entry);
      return item ? [{ variantId: text(item.variantId), productId: text(item.productId), productName: text(item.productName), productNameGu: text(item.productNameGu), variantName: text(item.variantName), quantity: whole(item.quantity) }] : [];
    }),
    totalPaise: whole(quote.totalPaise),
    offer: parseQuoteOffer(quote.offer),
    credit: summary && needed ? { ...summary, neededPaise: whole(needed.neededPaise) } : null,
    problems: list(quote.problems).flatMap((problem) => {
      const item = record(problem);
      const shortBy = whole(record(item?.details)?.shortByPaise);
      return item && text(item.code) ? [{ code: text(item.code), message: text(item.message), ...(shortBy > 0 ? { shortByPaise: shortBy } : {}) }] : [];
    }),
  };
}

const PAYMENT_STATES: readonly PaymentState[] = ["pending", "paid", "failed", "refunded", "partially_refunded"];

/** Checks a payment from the server. Anything unreadable is treated as still pending, never as paid. */
export function parsePayment(raw: unknown): OnlinePayment {
  const item = record(raw);
  const merchantOrderId = text(item?.merchantOrderId);
  if (!item || !merchantOrderId) throw new ApiRequestError("UNKNOWN_ERROR", 0);
  const status = PAYMENT_STATES.find((candidate) => candidate === item.status) ?? "pending";
  const fulfilment = item.fulfilment === "fulfilled" || item.fulfilment === "refund_due" ? item.fulfilment : "none";
  return {
    merchantOrderId,
    purpose: item.purpose === "credit_settlement" || item.purpose === "subscription" ? item.purpose : "order",
    status,
    fulfilment,
    amountPaise: whole(item.amountPaise),
    failureReason: text(item.failureReason),
    orders: orders(item.orders),
    subscription: record(item.subscription) && text(record(item.subscription)?.id) ? { id: text(record(item.subscription)?.id), number: text(record(item.subscription)?.number) } : null,
  };
}

export function parseStart(raw: unknown): PaymentStart {
  const body = record(raw);
  const handle = record(body?.checkout);
  const environment = handle?.environment === "PRODUCTION" || handle?.environment === "SANDBOX" || handle?.environment === "TEST" ? handle.environment : null;
  const checkout: CheckoutHandle | null = handle && environment && text(handle.token) && text(handle.providerOrderId)
    ? { environment, merchantId: text(handle.merchantId), providerOrderId: text(handle.providerOrderId), token: text(handle.token) }
    : null;
  return { payment: parsePayment(body?.payment), checkout };
}

/**
 * Starts paying online for a checkout. The server freezes the orders and creates the payment with PhonePe; the orders are written
 * only once PhonePe confirms the payment. The same `idempotencyKey` returns the same payment.
 */
export async function startOrderPayment(request: CheckoutRequest & { idempotencyKey: string; expectedTotalPaise: number }): Promise<PaymentStart> {
  requireApi();
  return parseStart(await apiSend<unknown>("POST", "/customer/orders/payments", request, { auth: true }));
}

/** Asks the server how a payment stands. The server asks PhonePe; what the phone saw on PhonePe's screen is never trusted. */
export async function confirmPayment(merchantOrderId: string): Promise<OnlinePayment> {
  requireApi();
  const body = record(await apiSend<unknown>("POST", `/customer/payments/${encodeURIComponent(merchantOrderId)}/confirm`, undefined, { auth: true }));
  return parsePayment(body?.payment);
}

/** Places the order(s). The same `idempotencyKey` twice returns the same orders, never a second set. `expectedTotalPaise` is the total the customer was shown: if prices changed, the server refuses (PRICE_CHANGED). */
export async function placeOrders(request: CheckoutRequest & { idempotencyKey: string; expectedTotalPaise: number }): Promise<Order[]> {
  requireApi();
  const body = record(await apiSend<unknown>("POST", "/customer/orders", request, { auth: true }));
  return orders(body?.orders);
}

export async function getMyOrders(): Promise<Order[]> {
  requireApi();
  const body = record(await apiGet<unknown>("/customer/orders?pageSize=50", { auth: true }));
  return orders(body?.orders);
}

export async function getMyOrder(orderId: string): Promise<Order> {
  requireApi();
  const body = record(await apiGet<unknown>(`/customer/orders/${encodeURIComponent(orderId)}`, { auth: true }));
  const order = parseOrder(body?.order);
  if (!order) throw new ApiRequestError("ORDER_NOT_FOUND", 404);
  return order;
}

export async function cancelMyOrder(orderId: string, reason: string): Promise<Order> {
  requireApi();
  const body = record(await apiSend<unknown>("POST", `/customer/orders/${encodeURIComponent(orderId)}/cancel`, { reason }, { auth: true }));
  const order = parseOrder(body?.order);
  if (!order) throw new ApiRequestError("UNKNOWN_ERROR", 0);
  return order;
}

export async function getMyCredit(): Promise<MyCredit> {
  requireApi();
  const body = record(await apiGet<unknown>("/customer/credit", { auth: true }));
  return {
    account: credit(body?.account),
    requests: list(body?.requests).flatMap((raw): PaymentRequest[] => {
      const item = record(raw);
      return item && text(item.id) ? [{ id: text(item.id), amountPaise: whole(item.amountPaise), note: text(item.note) }] : [];
    }),
  };
}

/** Starts paying a payment request online. What the customer owes drops only once PhonePe confirms. */
export async function payRequest(requestId: string, idempotencyKey: string): Promise<PaymentStart> {
  requireApi();
  return parseStart(await apiSend<unknown>("POST", `/customer/payment-requests/${encodeURIComponent(requestId)}/pay`, { idempotencyKey }, { auth: true }));
}
