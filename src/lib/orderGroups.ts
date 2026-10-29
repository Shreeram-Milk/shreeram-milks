import type { Order, OrderStatus } from "../types/orders";

export type OrderKind = "direct" | "subscription" | "trial";

/** What a customer sees on an order: its status, or "overdue" when it is still open after its delivery window ended. */
export type ShownStatus = OrderStatus | "overdue";

/** One day on My Orders: its delivery date, the orders delivered (or to be delivered) that day, and whether it is history. */
export type OrderDay = { date: string; orders: Order[]; earlier: boolean };

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

/** Within one day: the earlier window first; orders without a window last. */
const bySlot = (a: Order, b: Order) => (a.slot?.startTime ?? "99:99").localeCompare(b.slot?.startTime ?? "99:99");

/**
 * Groups the list by delivery day in calendar order. From today on (and any earlier day with an order still open, such as an
 * overdue one) the oldest day comes first, so it reads Yesterday, Today, Tomorrow. The finished days before that follow as
 * "earlier", newest first. `today` is the India calendar date.
 */
export function groupByDay(orders: Order[], today: string): OrderDay[] {
  const byDate = new Map<string, Order[]>();
  for (const order of orders) byDate.set(order.deliveryDate, [...(byDate.get(order.deliveryDate) ?? []), order]);
  const days = [...byDate].map(([date, list]) => ({ date, orders: list.sort(bySlot), earlier: date < today && !list.some(isOpen) }));
  const current = days.filter((day) => !day.earlier).sort((a, b) => a.date.localeCompare(b.date));
  const earlier = days.filter((day) => day.earlier).sort((a, b) => b.date.localeCompare(a.date));
  return [...current, ...earlier];
}
