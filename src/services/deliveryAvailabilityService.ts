import areas from "../mock-data/service-areas.json";
import type { PinAvailability, ProductDelivery, ServedOption, ServedSlot } from "../types/delivery";
import { apiGet, hasApi } from "./apiClient";

export const PIN_CODE = /^[1-9][0-9]{5}$/;
/** A real product's id is a UUID; the bundled sample products have short ids. */
const PRODUCT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (value: unknown): string => (typeof value === "string" ? value : "");

export function parseSlot(raw: unknown): ServedSlot | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const slotId = text(item.slotId);
  const earliestDate = text(item.earliestDate);
  if (!slotId || !/^\d{4}-\d{2}-\d{2}$/.test(earliestDate)) return null;
  const orderBy = text(item.orderBy);
  return { slotId, name: text(item.name), startTime: text(item.startTime), endTime: text(item.endTime), earliestDate, orderBy: orderBy && !Number.isNaN(Date.parse(orderBy)) ? orderBy : null };
}

/** Checks one delivery option from the server and keeps only what the app shows; a malformed one is dropped, never a crash. */
export function parseOption(raw: unknown): ServedOption | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const optionId = text(item.optionId);
  if (!optionId || (item.deliveryMethod !== "local_delivery" && item.deliveryMethod !== "shipping")) return null;
  const slots = Array.isArray(item.slots) ? item.slots.map(parseSlot).filter((slot): slot is ServedSlot => slot !== null) : [];
  return { optionId, deliveryMethod: item.deliveryMethod, locality: text(item.locality), slots };
}

/** Sample answer for a phone with no backend address: the bundled sample areas, with one sample morning slot. */
function sampleAvailability(pin: string): PinAvailability {
  const area = (areas as { pincode: string; locality: string; isServiceable: boolean }[]).find((item) => item.pincode === pin && item.isServiceable);
  if (!area) return { pin, options: [] };
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  return { pin, options: [{ optionId: "sample", deliveryMethod: "local_delivery", locality: area.locality, slots: [{ slotId: "sample-morning", name: "Morning", startTime: "06:00", endTime: "09:00", earliestDate: tomorrow, orderBy: null }] }] };
}

/**
 * Which of our delivery options serve this PIN code. The server decides (the app only shows the answer), and the answer
 * depends on the time of day, so it is asked again rather than remembered for long.
 */
export async function getPinAvailability(pin: string): Promise<PinAvailability> {
  if (!PIN_CODE.test(pin)) return { pin, options: [] };
  if (!hasApi()) return sampleAvailability(pin);
  const body = await apiGet<{ options?: unknown }>(`/public/delivery/check-pin?pin=${encodeURIComponent(pin)}`);
  const options = Array.isArray(body.options) ? body.options.map(parseOption).filter((option): option is ServedOption => option !== null) : [];
  return { pin, options };
}

/**
 * Whether one product can be delivered to a PIN code, and from when.
 * A bundled sample product (its id is not a real product id) is shown as deliverable.
 */
export async function getProductDelivery(pin: string, productId: string | null): Promise<ProductDelivery> {
  if (!PIN_CODE.test(pin)) return { served: false };
  if (!productId || !PRODUCT_ID.test(productId) || !hasApi()) {
    const sample = sampleAvailability(pin).options[0];
    return sample ? { served: true, deliveryMethod: sample.deliveryMethod, locality: sample.locality, slots: sample.slots } : { served: false };
  }
  const body = await apiGet<{ served?: unknown; deliveryMethod?: unknown; locality?: unknown; slots?: unknown }>(`/public/delivery/check?pin=${encodeURIComponent(pin)}&productId=${encodeURIComponent(productId)}`);
  if (body.served !== true || (body.deliveryMethod !== "local_delivery" && body.deliveryMethod !== "shipping")) return { served: false };
  const slots = Array.isArray(body.slots) ? body.slots.map(parseSlot).filter((slot): slot is ServedSlot => slot !== null) : [];
  return { served: true, deliveryMethod: body.deliveryMethod, locality: text(body.locality), slots };
}
