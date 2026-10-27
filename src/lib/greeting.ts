export type GreetingPart = "morning" | "afternoon" | "evening" | "night";

const IST_OFFSET_MS = 330 * 60 * 1000;

/** Which greeting fits the hour on the wall clock in India, whatever timezone the phone is set to. */
export function greetingPart(instant: Date): GreetingPart {
  const hour = new Date(instant.getTime() + IST_OFFSET_MS).getUTCHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}
