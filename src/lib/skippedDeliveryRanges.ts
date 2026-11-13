import type { DayLine, Subscription } from "../types/subscriptions";

type SkippedRange = { from: string; to: string; count: number; line: DayLine };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Group consecutive skipped dates for the same slot, quantity, and reason. */
export function skippedDeliveryRanges(days: Subscription["days"]): SkippedRange[] {
  const ranges: SkippedRange[] = [];
  const lastByLine = new Map<string, SkippedRange>();

  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const line of day.lines) {
      if (line.state !== "skipped") continue;
      const last = lastByLine.get(line.lineId);
      if (last && last.line.skipReason === line.skipReason && last.line.quantity === line.quantity && Date.parse(day.date) - Date.parse(last.to) === DAY_MS) {
        last.to = day.date;
        last.count += 1;
      } else {
        const range = { from: day.date, to: day.date, count: 1, line };
        lastByLine.set(line.lineId, range);
        ranges.push(range);
      }
    }
  }
  return ranges;
}
