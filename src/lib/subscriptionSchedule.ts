import { addDaysTo } from "./deliveryText";
import type { ScheduleType } from "../types/subscriptions";

/** 1 = Monday ... 7 = Sunday, for a calendar date. */
export function isoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/** Is `date` a delivery day of this plan? A preview of the server's rule; the server decides the real days. */
export function isDeliveryDay(date: string, start: string, type: ScheduleType, weekdays: readonly number[]): boolean {
  if (date < start) return false;
  if (type === "daily") return true;
  if (type === "alternate_days") return daysBetween(start, date) % 2 === 0;
  return weekdays.includes(isoWeekday(date));
}

/**
 * The first delivery day on or after `date` (at most `limit`), so a shortest plan that lands on a day with no delivery rounds up to
 * the next real delivery. The server measures a plan by its last delivery day, so the phone must too.
 */
export function firstDeliveryOnOrAfter(date: string, start: string, type: ScheduleType, weekdays: readonly number[], limit: string): string {
  for (let day = date < start ? start : date; day <= limit; day = addDaysTo(day, 1)) if (isDeliveryDay(day, start, type, weekdays)) return day;
  return limit;
}

/** How many delivery days the plan has from its start up to and including `end`, and the last of them. */
export function deliveriesUpTo(start: string, end: string, type: ScheduleType, weekdays: readonly number[]): { count: number; lastDate: string | null } {
  let count = 0;
  let lastDate: string | null = null;
  if (end < start) return { count, lastDate };
  const days = Math.min(daysBetween(start, end), 4 * 366);
  for (let offset = 0; offset <= days; offset += 1) {
    const date = addDaysTo(start, offset);
    if (isDeliveryDay(date, start, type, weekdays)) { count += 1; lastDate = date; }
  }
  return { count, lastDate };
}

/** The last delivery day of the plan's `count`-th delivery (no skips or pauses), or null when the schedule has no such day. */
export function lastDeliveryDate(start: string, count: number, type: ScheduleType, weekdays: readonly number[]): string | null {
  if (count < 1) return null;
  if (type === "daily") return addDaysTo(start, count - 1);
  if (type === "alternate_days") return addDaysTo(start, 2 * (count - 1));
  if (weekdays.length === 0) return null;
  let found = 0;
  for (let offset = 0; offset < 4 * 366; offset += 1) {
    const date = addDaysTo(start, offset);
    if (weekdays.includes(isoWeekday(date))) found += 1;
    if (found === count) return date;
  }
  return null;
}
