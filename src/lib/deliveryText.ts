import type { TFunction } from "i18next";

import type { AppLanguage } from "../types/models";

/** "17:30" -> "5:30 PM". */
export function formatClock(time: string): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

export const formatWindow = (startTime: string, endTime: string): string => `${formatClock(startTime)} – ${formatClock(endTime)}`;

/** "2026-10-14" -> "Wed, 14 Oct" (or the Gujarati equivalent). The date is already an India calendar date, so no timezone is applied. */
export function formatDeliveryDate(date: string, language: AppLanguage): string {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(language === "gu" ? "gu-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** The India calendar date ("2026-10-14") of a moment, whatever timezone the phone is set to. */
const indiaDate = (instant: Date): string => new Date(instant.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
/** Today's India calendar date. */
export const indiaToday = (): string => indiaDate(new Date());
/** "2026-10-14" plus some days, as a calendar date. */
export function addDaysTo(date: string, days: number): string {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
}

/** One short word for the day: "Today", "Tomorrow", "Yesterday", or "Fri, 16 Oct" for other days. */
export function formatShortDay(date: string, language: AppLanguage, t: TFunction): string {
  const now = Date.now();
  // The words are written lower-case for use inside sentences; on their own they start with a capital.
  const standalone = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
  if (date === indiaDate(new Date(now))) return standalone(t("delivery.today"));
  if (date === indiaDate(new Date(now + DAY_MS))) return standalone(t("delivery.tomorrow"));
  if (date === indiaDate(new Date(now - DAY_MS))) return standalone(t("delivery.yesterday"));
  return formatDeliveryDate(date, language);
}

/** "Order before 9:00 PM today". `orderBy` is the moment the server says the order must be in by; null when there is no cut-off. */
export function formatOrderBy(orderBy: string | null, language: AppLanguage, t: TFunction): string | null {
  if (!orderBy) return null;
  const instant = new Date(orderBy);
  if (Number.isNaN(instant.getTime())) return null;
  const local = new Date(instant.getTime() + IST_OFFSET_MS).toISOString();
  const time = formatClock(local.slice(11, 16));
  const date = local.slice(0, 10);
  const now = Date.now();
  if (date === indiaDate(new Date(now))) return t("delivery.orderBefore", { time, day: t("delivery.today") });
  if (date === indiaDate(new Date(now + DAY_MS))) return t("delivery.orderBefore", { time, day: t("delivery.tomorrow") });
  return t("delivery.orderBefore", { time, day: formatDeliveryDate(date, language) });
}

/** When something was placed, in India time: "16 Oct, 9:42 pm" (Gujarati month names in Gujarati). */
export function formatPlacedAt(iso: string, language: "en" | "gu"): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "";
  return value.toLocaleString(language === "gu" ? "gu-IN" : "en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
