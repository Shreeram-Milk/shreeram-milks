/** One live offer, as the Offers page shows it. The server decides what an order actually gets. */
export interface Offer {
  id: string;
  title: string;
  titleGu: string;
  description: string;
  descriptionGu: string;
  kind: "percent" | "flat" | "free_gift";
  percent: number | null;
  flatPaise: number | null;
  maxDiscountPaise: number | null;
  minOrderPaise: number;
  /** The code the customer types; null when the offer applies by itself. */
  code: string | null;
  /** The last day, "2026-10-31", or null. */
  endsOn: string | null;
  appliesOneTime: boolean;
  appliesTrial: boolean;
  appliesSubscription: boolean;
  minPlanDays: number | null;
}
