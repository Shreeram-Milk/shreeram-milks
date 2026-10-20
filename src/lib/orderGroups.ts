import type { Order } from "../types/orders";

export type OrderKind = "direct" | "subscription" | "trial";

/** One day on My Orders: its delivery date and the orders delivered (or to be delivered) that day. */
export type OrderDay = { date: string; orders: Order[] };

/** A trial or subscription delivery is told apart by how its first item was bought; everything else is a direct purchase. */
export function kindOf(order: Order): OrderKind {
  if (!order.subscriptionId) return "direct";
  return order.items[0]?.purchaseMethod === "trial" ? "trial" : "subscription";
}

/**
 * Groups the list by delivery day, keeping the order it arrives in (what is still to come first, nearest delivery on top, then
 * the past, newest first). A day sits where its first order is.
 */
export function groupByDay(orders: Order[]): OrderDay[] {
  const days: OrderDay[] = [];
  const byDate = new Map<string, OrderDay>();
  for (const order of orders) {
    const existing = byDate.get(order.deliveryDate);
    if (existing) existing.orders.push(order);
    else {
      const day: OrderDay = { date: order.deliveryDate, orders: [order] };
      byDate.set(order.deliveryDate, day);
      days.push(day);
    }
  }
  return days;
}
