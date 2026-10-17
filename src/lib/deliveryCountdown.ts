/** India is UTC+5:30 all year (no daylight saving). */
const INDIA_OFFSET_MINUTES = 330;

export type Countdown = { unit: "now" } | { unit: "minutes" | "hours" | "days"; count: number };

/** The moment (ms since 1970) a delivery window opens: its date plus the window's start time, read as India time. */
export function windowOpensAt(date: string, startTime: string): number {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  const [hours = 0, minutes = 0] = startTime.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hours, minutes) - INDIA_OFFSET_MINUTES * 60_000;
}

/**
 * How long until a delivery window opens, in the biggest sensible unit (minutes under an hour, hours under a day, otherwise days).
 * Once the window has opened it says "now" for the rest of that day, and null afterwards (the delivery is no longer "coming").
 */
export function countdownTo(date: string, startTime: string, now: number, todayIndia: string): Countdown | null {
  const remaining = windowOpensAt(date, startTime) - now;
  if (remaining <= 0) return date === todayIndia ? { unit: "now" } : null;
  const minutes = Math.ceil(remaining / 60_000);
  if (minutes < 60) return { unit: "minutes", count: minutes };
  const hours = Math.round(remaining / 3_600_000);
  if (hours < 24) return { unit: "hours", count: Math.max(1, hours) };
  return { unit: "days", count: Math.floor(remaining / 86_400_000) };
}
