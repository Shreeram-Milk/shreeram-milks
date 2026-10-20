import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { useCheckPayment } from "../../hooks/useOrders";
import type { OnlinePayment } from "../../types/orders";

const EVERY_MS = 8000;
/** About 10 minutes: after that the customer is left with the "Check again" button and My Orders. */
const MAX_TRIES = 75;

/**
 * Invisible. While a payment is still waiting for PhonePe, asks the server how it stands every few seconds and reports each
 * answer, so a payment PhonePe confirms a minute late still ends in the order without the customer doing anything.
 * Never sends a second check while one is still waiting (slow network), and skips checks while the app is in the background.
 */
export function PaymentPoller({ merchantOrderId, onResult }: { merchantOrderId: string; onResult: (payment: OnlinePayment) => void }) {
  const { mutate, isPending } = useCheckPayment();
  // Read when the timer fires: the effect's own copies would be the ones from the first render and never change.
  const latest = useRef({ isPending, onResult });
  useEffect(() => { latest.current = { isPending, onResult }; });

  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      if (AppState.currentState !== "active" || latest.current.isPending) return;
      tries += 1;
      if (tries > MAX_TRIES) { clearInterval(timer); return; }
      mutate(merchantOrderId, { onSuccess: (payment) => latest.current.onResult(payment) });
    }, EVERY_MS);
    return () => clearInterval(timer);
  }, [merchantOrderId, mutate]);
  return null;
}
