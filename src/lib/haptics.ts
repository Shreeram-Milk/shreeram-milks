import { Platform, Vibration } from "react-native";

// The phone's own vibration (no extra native module, no rebuild). Kept very short so it reads as a "tick", not an alert.
const TAP_MS = 8;
const SUCCESS_PATTERN = [0, 12, 70, 18];

/** A light tick for adding to cart, toggles and confirmations. iOS ignores custom lengths, so it stays silent there. */
export function tapFeedback() {
  if (Platform.OS === "android") Vibration.vibrate(TAP_MS);
}

/** A double tick for a finished order or payment. */
export function successFeedback() {
  if (Platform.OS === "android") Vibration.vibrate(SUCCESS_PATTERN);
}
