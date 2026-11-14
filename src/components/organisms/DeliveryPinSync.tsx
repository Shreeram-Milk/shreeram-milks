import { useSavedDeliveryPin } from "../../hooks/useSavedDeliveryPin";

/** Keeps the delivery PIN code equal to the default address's, from the app's root, which is never paused like a tab is. Draws nothing. */
export function DeliveryPinSync() {
  useSavedDeliveryPin();
  return null;
}
