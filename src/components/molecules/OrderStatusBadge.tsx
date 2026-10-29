import type { PropsWithChildren } from "react";

import { Badge } from "../atoms/Badge";
import type { ShownStatus } from "../../lib/orderGroups";

const variantByStatus: Record<ShownStatus, "info" | "success" | "warning" | "danger" | "default"> = {
  placed: "info",
  out_for_delivery: "warning",
  overdue: "warning",
  delivered: "success",
  missed: "danger",
  cancelled: "default",
};

export function OrderStatusBadge({ children, status }: PropsWithChildren<{ status: ShownStatus }>) {
  return <Badge variant={variantByStatus[status]}>{children}</Badge>;
}
