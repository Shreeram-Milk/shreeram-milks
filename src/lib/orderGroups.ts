import type { Order, OrderStatus } from "../types/orders";

export type OrderKind = "direct" | "subscription" | "trial";

/** What a customer sees on an order: its status, or "overdue" when it is still open after its delivery window ended. */
export type ShownStatus = OrderStatus | "overdue";

/** Orders placed on the same day in India. */
export type OrderDay = { date: string; orders: Order[] };

const IST_OFFSET_MS = 330 * 60 * 1000;

/** A trial or subscription delivery is told apart by how its first item was bought; everything else is a direct purchase. */
export function kindOf(order: Order): OrderKind {
  if (!order.subscriptionId) return "direct";
  return order.items[0]?.purchaseMethod === "trial" ? "trial" : "subscription";
}

const isOpen = (order: Order) => order.status === "placed" || order.status === "out_for_delivery";

/** The moment an order's delivery window ends, in India time ("2026-10-28" + "20:00"); a day without a window ends at midnight. */
function windowEnd(order: Order): number {
  const [year = 0, month = 1, day = 1] = order.deliveryDate.split("-").map(Number);
  const [hours = 24, minutes = 0] = order.slot ? order.slot.endTime.split(":").map(Number) : [24, 0];
  return Date.UTC(year, month - 1, day, hours, minutes) - IST_OFFSET_MS;
}

/**
 * Overdue: a local delivery still placed or out for delivery after its window ended. Only the label changes; staff still mark
 * it delivered or missed. Courier parcels take days, so they are never overdue.
 */
export function shownStatus(order: Order, now: Date): ShownStatus {
  if (order.deliveryMethod === "local_delivery" && isOpen(order) && now.getTime() >= windowEnd(order)) return "overdue";
  return order.status;
}

/** Newest purchase first. Older records without a placement timestamp fall back to their delivery date. */
export function groupByDay(orders: Order[]): OrderDay[] {
  const byDate = new Map<string, Order[]>();
  const entries = orders.map((order) => ({ order, placed: Date.parse(order.placedAt) }));
  entries.sort((a, b) => (b.placed || 0) - (a.placed || 0));
  for (const { order, placed } of entries) {
    const date = Number.isFinite(placed) ? new Date(placed + IST_OFFSET_MS).toISOString().slice(0, 10) : order.deliveryDate;
    const day = byDate.get(date);
    if (day) day.push(order);
    else byDate.set(date, [order]);
  }
  return [...byDate].sort(([a], [b]) => b.localeCompare(a)).map(([date, list]) => ({ date, orders: list }));
}
