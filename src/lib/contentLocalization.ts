import type { AppLanguage } from "../types/models";

/** Picks the text for the chosen language, falling back to English when the Gujarati text has not been written yet. */
export function localized(english: string, gujarati: string, language: AppLanguage): string {
  return language === "gu" && gujarati.trim() ? gujarati : english;
}

/** A policy's effective date (YYYY-MM-DD) written out for the customer, such as "10 October 2026". Falls back to the raw text if it cannot be read. */
export function formatPolicyDate(isoDate: string, language: AppLanguage): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(language === "gu" ? "gu-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** True when `version` is older than `minimum` (both x.y.z), so the app can ask the customer to update. Compares numerically. */
export function isVersionBelow(version: string, minimum: string): boolean {
  const current = version.split(".").map(Number);
  const required = minimum.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const a = current[index] ?? 0;
    const b = required[index] ?? 0;
    if (a !== b) return a < b;
  }
  return false;
}
