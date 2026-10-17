import type { PropsWithChildren } from "react";

import { Badge } from "../atoms/Badge";
import type { OrderStatus } from "../../types/orders";

const variantByStatus: Record<OrderStatus, "info" | "success" | "warning" | "danger" | "default"> = {
  placed: "info",
  out_for_delivery: "warning",
  delivered: "success",
  missed: "danger",
  cancelled: "default",
};

export function OrderStatusBadge({ children, status }: PropsWithChildren<{ status: OrderStatus }>) {
  return <Badge variant={variantByStatus[status]}>{children}</Badge>;
}
