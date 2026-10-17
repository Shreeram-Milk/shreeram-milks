import type { TFunction } from "i18next";

import type { AppLanguage } from "../types/models";
import { formatShortDay } from "./deliveryText";

/** "just now", "5 min ago", "3 hrs ago", "2 days ago", then a plain date once it is a week old. */
export function timeAgoLabel(iso: string, now: number, language: AppLanguage, t: TFunction): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const minutes = Math.max(0, Math.floor((now - then) / 60_000));
  if (minutes < 1) return t("inbox.justNow");
  if (minutes < 60) return t("inbox.minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("inbox.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("inbox.daysAgo", { count: days });
  return formatShortDay(iso.slice(0, 10), language, t);
}
