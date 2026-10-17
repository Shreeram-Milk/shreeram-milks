import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { countdownTo } from "../lib/deliveryCountdown";
import { indiaToday } from "../lib/deliveryText";

/**
 * "in 14 hours", "in 40 minutes", "in 2 days" or "arriving now" for a delivery window that opens on `date` at `startTime`.
 * Null when there is nothing to count down to. It re-reads the clock every 30 seconds so the label stays right on screen.
 */
export function useCountdownLabel(date: string | null | undefined, startTime: string | null | undefined): string | null {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  if (!date || !startTime) return null;
  const countdown = countdownTo(date, startTime, now, indiaToday());
  if (!countdown) return null;
  return countdown.unit === "now" ? t("subs.arrivingNow") : t(`subs.in_${countdown.unit}`, { count: countdown.count });
}
