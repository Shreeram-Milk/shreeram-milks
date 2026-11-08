import type { RewardCard, RewardStatus } from "../types/rewards";
import { ApiRequestError, apiGet, apiSend, hasApi } from "./apiClient";
import { offerLook } from "./offerService";

const record = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const orNull = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null);
const STATUSES: readonly RewardStatus[] = ["new", "scratched", "used", "expired"];

/** Checks one scratch card from the server. A malformed one is dropped rather than shown half-filled. */
export function parseRewardCard(raw: unknown): RewardCard | null {
  const item = record(raw);
  const offer = record(item?.offer);
  const id = text(item?.id);
  const kind = offer?.kind === "percent" || offer?.kind === "flat" || offer?.kind === "free_gift" ? offer.kind : null;
  if (!item || !offer || !id || !kind || !text(offer.title)) return null;
  const status = STATUSES.includes(item.status as RewardStatus) ? (item.status as RewardStatus) : "new";
  return {
    id, status, orderNumber: text(item.orderNumber), createdAt: text(item.createdAt), expiresAt: text(item.expiresAt),
    offer: {
      id: text(offer.id), title: text(offer.title), titleGu: text(offer.titleGu), description: text(offer.description), descriptionGu: text(offer.descriptionGu), kind,
      percent: orNull(offer.percent), flatPaise: orNull(offer.flatPaise), maxDiscountPaise: orNull(offer.maxDiscountPaise), minOrderPaise: orNull(offer.minOrderPaise) ?? 0,
      endsOn: text(offer.endsOn) || null,
      // The code is sent only once the card is scratched.
      code: text(offer.code) || null,
      ...offerLook(offer),
    },
  };
}

const requireApi = (): void => {
  if (!hasApi()) throw new ApiRequestError("NETWORK_ERROR", 0);
};

/** The signed-in customer's scratch cards, newest first. */
export async function getMyRewards(): Promise<RewardCard[]> {
  if (!hasApi()) return [];
  const body = record(await apiGet<unknown>("/customer/rewards", { auth: true }));
  return (Array.isArray(body?.cards) ? body.cards : []).map(parseRewardCard).filter((card): card is RewardCard => card !== null);
}

/** Scratches a card: the server records it and sends back the code. */
export async function scratchReward(id: string): Promise<RewardCard> {
  requireApi();
  const body = record(await apiSend<unknown>("POST", `/customer/rewards/${encodeURIComponent(id)}/scratch`, undefined, { auth: true }));
  const card = parseRewardCard(body?.card);
  if (!card) throw new ApiRequestError("UNKNOWN_ERROR", 0);
  return card;
}
