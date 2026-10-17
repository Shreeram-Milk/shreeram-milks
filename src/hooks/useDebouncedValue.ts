import { useEffect, useState } from "react";

/** The value, but only once it has stopped changing for `delayMs`: typing or tapping fast sends one request, not one per change. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}
