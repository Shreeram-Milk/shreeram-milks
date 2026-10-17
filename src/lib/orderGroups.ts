import type { Order } from "../types/orders";

export type OrderKind = "direct" | "subscription" | "trial";

/** One row of My Orders: a direct purchase on its own, or all the deliveries of one subscription or trial together. */
export type OrderEntry =
  | { type: "single"; key: string; order: Order }
  | { type: "plan"; key: string; kind: "subscription" | "trial"; orders: Order[] };

export const isComing = (order: Order): boolean => order.status === "placed" || order.status === "out_for_delivery";

/** A trial or subscription delivery is told apart by how its first item was bought; everything else is a direct purchase. */
export function kindOf(order: Order): OrderKind {
  if (!order.subscriptionId) return "direct";
  return order.items[0]?.purchaseMethod === "trial" ? "trial" : "subscription";
}

/**
 * Groups the list by plan, keeping the order it arrives in (what is still to come first, nearest delivery on top). A plan sits
 * where its first delivery is, so the plan with the nearest delivery is the first plan on the screen.
 */
export function groupOrders(orders: Order[]): OrderEntry[] {
  const entries: OrderEntry[] = [];
  const plans = new Map<string, Extract<OrderEntry, { type: "plan" }>>();
  for (const order of orders) {
    const kind = kindOf(order);
    if (kind === "direct" || !order.subscriptionId) {
      entries.push({ type: "single", key: order.id, order });
      continue;
    }
    const existing = plans.get(order.subscriptionId);
    if (existing) existing.orders.push(order);
    else {
      const entry: Extract<OrderEntry, { type: "plan" }> = { type: "plan", key: `plan-${order.subscriptionId}`, kind, orders: [order] };
      plans.set(order.subscriptionId, entry);
      entries.push(entry);
    }
  }
  return entries;
}
