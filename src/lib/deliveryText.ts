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
