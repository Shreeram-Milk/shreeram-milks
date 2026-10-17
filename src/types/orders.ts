import type { ServedSlot } from "./delivery";

export type OrderStatus = "placed" | "out_for_delivery" | "delivered" | "missed" | "cancelled";
export type PaymentMethod = "credit" | "online";

/** One line of an order, with the name and price exactly as they were when it was placed. */
export interface OrderLine {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  productNameGu: string;
  variantName: string;
  /** How it was bought; a trial or subscription delivery is made by the delivery job, not placed in the cart. */
  purchaseMethod?: "buy_once" | "trial" | "subscription";
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
  /** A free gift from an offer: shown as "Free". */
  isGift?: boolean;
}

/** An order as the server describes it. Every price and date was decided by the server. */
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryMethod: "local_delivery" | "shipping";
  /** "2026-10-15", an India calendar date. */
  deliveryDate: string;
  slot: { id: string; name: string; startTime: string; endTime: string } | null;
  recipientName: string;
  addressText: string;
  /** Courier orders: the courier and tracking link staff added ('' until then). */
  courierName: string;
  trackingUrl: string;
  pinCode: string;
  totalPaise: number;
  /** The money an offer took off this order, and the offer's name ('' when none). */
  discountPaise: number;
  offerTitle: string;
  offerTitleGu: string;
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "paid" | "partially_refunded" | "refunded";
  placedAt: string;
  /** Set when the order is one delivery of a subscription or trial, and the same for all of that plan's deliveries. */
  subscriptionId?: string | null;
  cancelReason: string;
  /** Only on a single order read: whether the customer can still cancel it. */
  canCancel: boolean;
  items: OrderLine[];
}

/** One order a cart will become, as the checkout review shows it. */
export interface QuoteOrder {
  key: string;
  deliveryMethod: "local_delivery" | "shipping";
  items: OrderLine[];
  discountPaise: number;
  totalPaise: number;
  slots: ServedSlot[];
  selectedSlotId: string | null;
  deliveryDate: string | null;
  orderBy: string | null;
  payment: PaymentMethod;
  /** For a credit customer: why this order is not on credit. */
  paymentNote: "excluded_product" | null;
}

export interface QuoteProblem {
  code: string;
  message: string;
  /** For OFFER_MIN_ORDER: how much more the cart needs. */
  shortByPaise?: number;
}

/** The offer the server chose for the cart (or the typed code), with the money it takes off. */
export interface QuoteOffer {
  id: string;
  title: string;
  titleGu: string;
  code: string | null;
  discountPaise: number;
}

export interface CreditSummary {
  limitPaise: number;
  owedPaise: number;
  remainingPaise: number;
}

/** A cart item that cannot be delivered to the chosen address. It is not part of the orders or the total. */
export interface UnavailableItem {
  variantId: string;
  productId: string;
  productName: string;
  productNameGu: string;
  variantName: string;
  quantity: number;
}

export interface Quote {
  pinCode: string;
  orders: QuoteOrder[];
  unavailable: UnavailableItem[];
  totalPaise: number;
  offer: QuoteOffer | null;
  credit: (CreditSummary & { neededPaise: number }) | null;
  problems: QuoteProblem[];
}

export interface PaymentRequest {
  id: string;
  amountPaise: number;
  note: string;
}

/** A credit customer's limit, what they owe, and any open "pay now" requests. `account` is null for a prepaid customer. */
export interface MyCredit {
  account: CreditSummary | null;
  requests: PaymentRequest[];
}

export type PaymentState = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";

/** What the phone needs to open PhonePe's checkout. "TEST" means the backend has no PhonePe settings: no PhonePe screen, it confirms at once. */
export interface CheckoutHandle {
  environment: "SANDBOX" | "PRODUCTION" | "TEST";
  merchantId: string;
  providerOrderId: string;
  token: string;
}

/** An online payment as the server reports it. Orders appear only once the payment is confirmed and they were written. */
export interface OnlinePayment {
  merchantOrderId: string;
  purpose: "order" | "credit_settlement" | "subscription";
  status: PaymentState;
  /** Paid, and what it paid for was delivered ("fulfilled"), or it could not be, so it will be refunded ("refund_due"). */
  fulfilment: "none" | "fulfilled" | "refund_due";
  amountPaise: number;
  failureReason: string;
  orders: Order[];
  /** A subscription or trial paid upfront: the subscription it started, once PhonePe confirmed. */
  subscription: { id: string; number: string } | null;
}

/** The answer to "start paying": the payment, and how to open PhonePe (null when it was already paid). */
export interface PaymentStart {
  payment: OnlinePayment;
  checkout: CheckoutHandle | null;
}
