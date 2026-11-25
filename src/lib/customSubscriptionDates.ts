/** Calendar choices use ISO dates, so sorting is independent of the phone timezone. */
export function toggleDate(dates: readonly string[], date: string): string[] {
  return dates.includes(date) ? dates.filter(item => item !== date) : [...dates, date].sort();
}

export function dateRange(first: string, last: string): string[] {
  const dates: string[] = [];
  for (let time = Date.parse(first + "T00:00:00Z"); time <= Date.parse(last + "T00:00:00Z") && dates.length < 365; time += 86_400_000) dates.push(new Date(time).toISOString().slice(0, 10));
  return dates;
}
