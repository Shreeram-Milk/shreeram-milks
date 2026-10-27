import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { greetingPart, type GreetingPart } from "../lib/greeting";

/** The part of the day in India ("morning"…"night"), kept right while Home stays open and when the app returns from the background. */
export function useGreetingPart(): GreetingPart {
  const [part, setPart] = useState(() => greetingPart(new Date()));
  useEffect(() => {
    const refresh = () => setPart(greetingPart(new Date()));
    const timer = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return part;
}
