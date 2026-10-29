import type { DayLine } from "../types/subscriptions";

/** One delivery named in the cancel sheet: its day and window. */
export type CancelDay = { date: string; slotName: string };

/**
 * What cancelling a subscription or trial does to the days the customer can see, by the server's rule: every delivery that can
 * still be changed stops; one already past its cancel time (being prepared or on its way) still comes. Skipped, paused and
 * finished days are not mentioned. A preview only: the server decides.
 * The app sees only the next few weeks, so `complete` says whether the list reaches the plan's last delivery (`endDate`); when
 * it does not (a long plan, or one on an open pause with no end date), more deliveries stop after the ones listed.
 */
export function cancelEffect(days: { date: string; lines: DayLine[] }[], today: string, endDate: string | null): { stops: CancelDay[]; stillComes: CancelDay[]; complete: boolean } {
  const stops: CancelDay[] = [];
  const stillComes: CancelDay[] = [];
  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    if (day.date < today) continue;
    for (const line of [...day.lines].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
      const open = line.state === "upcoming" || line.state === "placed";
      if (open && line.canChange) stops.push({ date: day.date, slotName: line.slotName });
      else if ((line.state === "placed" || line.state === "out_for_delivery") && !line.canChange) stillComes.push({ date: day.date, slotName: line.slotName });
    }
  }
  return { stops, stillComes, complete: endDate !== null && days.some((day) => day.date >= endDate) };
}
