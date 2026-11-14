/** Money is whole paise (₹100 = 10000). */
export type RefundStatus = "requested" | "sent" | "cancelled";

/** A request to get the wallet balance back. The amount was set aside from the wallet when it was asked for. */
export interface WalletRefund {
  id: string;
  amountPaise: number;
  status: RefundStatus;
  requestedAt: string;
  /** When ShreeRam sent it (or cancelled it). */
  handledAt: string | null;
  /** When the money reached the customer's bank. Set automatically once PhonePe confirms it (live payments only). */
  completedAt: string | null;
  /** The PhonePe refund reference(s), to find it on a bank statement. */
  providerReference: string;
  /** Why it was cancelled, when it was. */
  staffNote: string;
}

/** The customer's wallet as the server reports it. */
export interface MyWallet {
  /** False for pay-later (credit) customers: they cannot add money or pay with it. A balance they still hold can be refunded. */
  enabled: boolean;
  balancePaise: number;
  /** A refund on its way, if any. Only one at a time. */
  openRefund: WalletRefund | null;
  minTopUpPaise: number;
  maxBalancePaise: number;
  /** How much more can be added right now. */
  roomPaise: number;
}

export type WalletEntryType = "top_up" | "order_payment" | "order_return" | "refund_hold" | "refund_release" | "manual_adjustment";

/** One line of wallet activity. */
export interface WalletEntry {
  id: string;
  type: WalletEntryType;
  direction: "credit" | "debit";
  amountPaise: number;
  orderNumber: string | null;
  createdAt: string;
}
