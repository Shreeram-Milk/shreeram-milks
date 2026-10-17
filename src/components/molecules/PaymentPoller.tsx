import { useEffect } from "react";

import { useCheckPayment } from "../../hooks/useOrders";
import type { OnlinePayment } from "../../types/orders";

const EVERY_MS = 8000;
/** About 10 minutes: after that the customer is left with the "Check again" button and My Orders. */
const MAX_TRIES = 75;

/**
 * Invisible. While a payment is still waiting for PhonePe, asks the server how it stands every few seconds and reports each
 * answer, so a payment PhonePe confirms a minute late still ends in the order without the customer doing anything.
 */
export function PaymentPoller({ merchantOrderId, onResult }: { merchantOrderId: string; onResult: (payment: OnlinePayment) => void }) {
  const { mutate, isPending } = useCheckPayment();
  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (tries > MAX_TRIES) { clearInterval(timer); return; }
      if (!isPending) mutate(merchantOrderId, { onSuccess: onResult });
    }, EVERY_MS);
    return () => clearInterval(timer);
    // The latest `onResult` and `isPending` are read when the timer fires; restarting it on every render would never let it fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantOrderId]);
  return null;
}
