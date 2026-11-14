import type { PaymentStart } from "../types/orders";
import type { MyWallet, RefundStatus, WalletEntry, WalletEntryType, WalletRefund } from "../types/wallet";
import { ApiRequestError, apiGet, apiSend, hasApi } from "./apiClient";
import { parseStart } from "./orderService";

const record = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const whole = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0);
const ENTRY_TYPES: readonly WalletEntryType[] = ["top_up", "order_payment", "order_return", "refund_hold", "refund_release", "manual_adjustment"];
const REFUND_STATUSES: readonly RefundStatus[] = ["requested", "sent", "cancelled"];

/** The wallet needs the real backend and a signed-in customer; there is no sample wallet. */
const requireApi = (): void => {
  if (!hasApi()) throw new ApiRequestError("NETWORK_ERROR", 0);
};

function parseRefund(raw: unknown): WalletRefund | null {
  const item = record(raw);
  const id = text(item?.id);
  const status = REFUND_STATUSES.find((value) => value === item?.status);
  if (!item || !id || !status) return null;
  return { id, amountPaise: whole(item.amountPaise), status, requestedAt: text(item.requestedAt), handledAt: text(item.handledAt) || null };
}

/** Checks the wallet from the server. Anything unreadable shows as an empty, unusable wallet, never as money that is not there. */
export function parseWallet(raw: unknown): MyWallet {
  const item = record(raw);
  if (!item) throw new ApiRequestError("UNKNOWN_ERROR", 0);
  return {
    enabled: item.enabled === true,
    balancePaise: Math.max(0, whole(item.balancePaise)),
    openRefund: parseRefund(item.openRefund),
    minTopUpPaise: whole(item.minTopUpPaise),
    maxBalancePaise: whole(item.maxBalancePaise),
    roomPaise: Math.max(0, whole(item.roomPaise)),
  };
}

function parseEntry(raw: unknown): WalletEntry | null {
  const item = record(raw);
  const id = text(item?.id);
  const type = ENTRY_TYPES.find((value) => value === item?.type);
  if (!item || !id || !type || (item.direction !== "credit" && item.direction !== "debit")) return null;
  return { id, type, direction: item.direction, amountPaise: whole(item.amountPaise), orderNumber: text(item.orderNumber) || null, createdAt: text(item.createdAt) };
}

export async function getMyWallet(): Promise<MyWallet> {
  requireApi();
  return parseWallet(record(await apiGet<unknown>("/customer/wallet", { auth: true }))?.wallet);
}

/** One page of wallet activity, newest first. */
export async function getWalletEntries(page: number, pageSize = 20): Promise<{ items: WalletEntry[]; total: number }> {
  requireApi();
  const body = record(await apiGet<unknown>(`/customer/wallet/entries?page=${page}&pageSize=${pageSize}`, { auth: true }));
  const items = Array.isArray(body?.items) ? body.items.map(parseEntry).filter((entry): entry is WalletEntry => entry !== null) : [];
  return { items, total: whole(body?.total) };
}

/** Starts adding money with PhonePe. The wallet grows only once PhonePe confirms. The same key returns the same payment. */
export async function startTopUp(amountPaise: number, idempotencyKey: string): Promise<PaymentStart> {
  requireApi();
  return parseStart(await apiSend<unknown>("POST", "/customer/wallet/top-ups", { amountPaise, idempotencyKey }, { auth: true }));
}

/** Asks for the whole balance back. The same key returns the same request. */
export async function requestWalletRefund(idempotencyKey: string, note = ""): Promise<WalletRefund> {
  requireApi();
  const refund = parseRefund(record(await apiSend<unknown>("POST", "/customer/wallet/refund-requests", { idempotencyKey, note }, { auth: true }))?.request);
  if (!refund) throw new ApiRequestError("UNKNOWN_ERROR", 0);
  return refund;
}
