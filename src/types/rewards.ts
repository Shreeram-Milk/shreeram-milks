import type { Offer } from "./offers";

/** new: not scratched yet; scratched: code showing; used: spent on an order; expired: past its date. */
export type RewardStatus = "new" | "scratched" | "used" | "expired";

/** A free scratch card won with a delivered order. It always holds a real offer; the code arrives once it is scratched. */
export interface RewardCard {
  id: string;
  status: RewardStatus;
  orderNumber: string;
  createdAt: string;
  expiresAt: string;
  offer: Pick<Offer, "id" | "title" | "titleGu" | "description" | "descriptionGu" | "kind" | "percent" | "flatPaise" | "maxDiscountPaise" | "minOrderPaise" | "endsOn" | "code" | "imageUrl" | "showText" | "points">;
}
