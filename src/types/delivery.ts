/** One delivery window a PIN code can get, with the first date the customer can receive it (a calendar date in India). */
export interface ServedSlot {
  slotId: string;
  name: string;
  /** "HH:MM", 24-hour, India time. */
  startTime: string;
  endTime: string;
  /** "YYYY-MM-DD". */
  earliestDate: string;
  /** The last moment (an ISO time) an order can be placed for this delivery, or null when the slot has no cut-off. */
  orderBy: string | null;
}

/** One way we can deliver to a PIN code: to the door in local slots, or by courier. */
export interface ServedOption {
  /** Identifies one way of delivering (method, area and cut-off rule); only used as a list key. */
  optionId: string;
  deliveryMethod: "local_delivery" | "shipping";
  locality: string;
  slots: ServedSlot[];
}

/** Whether one product can be delivered to a PIN code. The server decides; the app only shows the answer. */
export type ProductDelivery =
  | { served: true; deliveryMethod: "local_delivery" | "shipping"; locality: string; slots: ServedSlot[] }
  | { served: false };

export interface PinAvailability {
  pin: string;
  options: ServedOption[];
}
