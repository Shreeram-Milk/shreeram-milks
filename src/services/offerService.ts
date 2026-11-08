import type { Offer } from "../types/offers";
import { ApiRequestError, apiGet, hasApi } from "./apiClient";

const record = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const whole = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0);
const orNull = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null);

/** Checks one offer from the server. A malformed one is dropped, so a bad record can never crash the Offers page. */
export function parseOffer(raw: unknown): Offer | null {
  const item = record(raw);
  const id = text(item?.id);
  const title = text(item?.title).trim();
  const kind = item?.kind === "percent" || item?.kind === "flat" || item?.kind === "free_gift" ? item.kind : null;
  if (!item || !id || !title || !kind) return null;
  return {
    id, title, titleGu: text(item.titleGu), description: text(item.description), descriptionGu: text(item.descriptionGu), kind,
    percent: orNull(item.percent), flatPaise: orNull(item.flatPaise), maxDiscountPaise: orNull(item.maxDiscountPaise), minOrderPaise: whole(item.minOrderPaise),
    code: text(item.code) || null, endsOn: text(item.endsOn) || null,
    appliesOneTime: item.appliesOneTime === true, appliesTrial: item.appliesTrial === true, appliesSubscription: item.appliesSubscription === true, minPlanDays: orNull(item.minPlanDays),
    ...offerLook(item),
  };
}

/** The picture, the text switch and the bullet points, shared by offers and scratch cards. */
export function offerLook(item: Record<string, unknown>): Pick<Offer, "imageUrl" | "showText" | "points"> {
  const imageUrl = typeof item.imageUrl === "string" && item.imageUrl.startsWith("https://") ? item.imageUrl : null;
  const points = (Array.isArray(item.points) ? item.points : [])
    .map((point) => record(point))
    .filter((point): point is Record<string, unknown> => point !== null && text(point.en).trim() !== "")
    .slice(0, 8)
    .map((point) => ({ en: text(point.en).trim(), gu: text(point.gu).trim() }));
  return { imageUrl, showText: imageUrl ? item.showText !== false : true, points };
}

/** One live offer's page (from a banner, a notification or the Offers list). Null when it has ended. */
export async function getOffer(id: string): Promise<Offer | null> {
  if (!hasApi()) return null;
  try {
    const body = await apiGet<{ offer?: unknown }>(`/public/offers/${encodeURIComponent(id)}`);
    return parseOffer(body.offer);
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "OFFER_NOT_FOUND") return null;
    throw error;
  }
}

/** The live offers. Offers need the real backend; without one there are none to show. */
export async function getOffers(): Promise<Offer[]> {
  if (!hasApi()) return [];
  const body = await apiGet<{ offers?: unknown }>("/public/offers");
  return Array.isArray(body.offers) ? body.offers.map(parseOffer).filter((offer): offer is Offer => offer !== null) : [];
}
