export type SubscriptionKind = "subscription" | "trial";
export type ScheduleType = "daily" | "alternate_days" | "custom_weekdays";
export type SubscriptionState = "active" | "paused" | "completed" | "cancelled";
/** `paused`: inside a pause or vacation; it moves to the end. */
export type DayState = "upcoming" | "placed" | "out_for_delivery" | "delivered" | "missed" | "skipped" | "paused";
export type SkipReason = "customer" | "admin" | "order_cancelled" | "credit_limit" | "not_deliverable";

/** What the customer chose on the product page. Only choices and ids: the server decides prices, dates and how it is paid. */
export interface SubscriptionDraft {
  kind: SubscriptionKind;
  variantId: string;
  ruleId?: string;
  deliveries?: number;
  /** The last day the customer picked on the calendar; the server counts the deliveries from it. */
  endDate?: string;
  trialPlanId?: string;
  /** For "chosen weekdays" rules: 1 = Monday ... 7 = Sunday. */
  weekdays: number[];
  startDate: string;
  lines: { slotId: string; quantity: number }[];
  addressId: string;
  /** A code the customer typed. Without one the server picks the best automatic offer (if any). */
  offerCode?: string;
}

export interface SubscriptionQuote {
  kind: SubscriptionKind;
  productName: string;
  productNameGu: string;
  variantName: string;
  unitPricePaise: number;
  planName: string;
  scheduleType: ScheduleType;
  weekdays: number[];
  deliveriesPerLine: number;
  startDate: string;
  earliestStartDate: string;
  endDate: string;
  lines: { slotId: string; slotName: string; startTime: string; endTime: string; quantity: number; linePaise: number; endDate: string }[];
  /** The price before any offer, the money the offer takes off, and what is paid (`totalPaise`). */
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  offer: { title: string; titleGu: string; code: string | null; discountPaise: number; gift: { productName: string; productNameGu: string; variantName: string; quantity: number } | null } | null;
  /** Why a typed code does not work (the plan can still be bought without it). */
  offerProblem: { code: string; message: string } | null;
  paymentMethod: "credit" | "online";
  /** A credit customer paying online because this product is not sold on credit. */
  paymentNote: "excluded_product" | null;
  /** A credit customer's limit, what they owe and what is left: the whole plan must fit in what is left. */
  credit: { limitPaise: number; owedPaise: number; remainingPaise: number } | null;
}

export interface DayLine {
  lineId: string;
  slotName: string;
  startTime: string;
  quantity: number;
  state: DayState;
  skipReason: SkipReason | null;
  orderId: string | null;
  /** Before this day's cut-off: it can still be skipped (or a skip the customer made undone). */
  canChange: boolean;
}

export interface Subscription {
  id: string;
  number: string;
  kind: SubscriptionKind;
  status: SubscriptionState;
  productId: string;
  productName: string;
  productNameGu: string;
  variantName: string;
  unitPricePaise: number;
  planName: string;
  scheduleType: ScheduleType;
  weekdays: number[];
  deliveriesPerLine: number;
  startDate: string;
  /** Null while an open pause holds the remaining deliveries. */
  endDate: string | null;
  paymentMethod: "credit" | "online";
  totalPaise: number;
  /** The offer it started with ('' when none), the money it took off, and the free gift sent with the first delivery. */
  offerTitle: string;
  offerTitleGu: string;
  discountPaise: number;
  gift: { productName: string; productNameGu: string; variantName: string; quantity: number } | null;
  cancelledAt: string | null;
  lines: { id: string; slotName: string; startTime: string; endTime: string; quantity: number; delivered: number; remaining: number; endDate: string | null }[];
  pauses: { id: string; fromDate: string; untilDate: string | null }[];
  openPause: { fromDate: string; untilDate: string | null } | null;
  nextDelivery: { date: string; slotName: string; quantity: number } | null;
  days: { date: string; lines: DayLine[] }[];
}

/** One delivery on the calendar: a one-off order or one day of a subscription. */
export interface CalendarDelivery {
  date: string;
  source: "order" | "subscription";
  state: DayState | "cancelled";
  slotName: string | null;
  startTime: string | null;
  items: { productName: string; productNameGu: string; variantName: string; quantity: number }[];
  orderId: string | null;
  subscriptionId: string | null;
  subscriptionNumber: string | null;
  lineId: string | null;
  canChange: boolean;
}
