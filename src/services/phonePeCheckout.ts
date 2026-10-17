import { NativeModules, Platform } from "react-native";
import PhonePePaymentSDK from "react-native-phonepe-pg";

import type { CheckoutHandle } from "../types/orders";
import { ApiRequestError } from "./apiClient";

/** What PhonePe's screen said when it closed. Only a hint for the screen: the server always asks PhonePe for the real result. */
export type CheckoutOutcome = "SUCCESS" | "FAILURE" | "INTERRUPTED";

let initialisedFor: string | null = null;

/**
 * Opens PhonePe's payment screen for one payment and waits for it to close. The only place in the app that talks to the
 * PhonePe SDK. In development with no PhonePe settings on the server ("TEST"), there is no screen to open.
 * Throws PHONEPE_UNAVAILABLE in an app build without the SDK (Expo Go).
 */
export async function openPhonePeCheckout(checkout: CheckoutHandle, customerRef: string): Promise<CheckoutOutcome> {
  if (checkout.environment === "TEST") return "SUCCESS";
  if (!NativeModules.PhonePePaymentSDK) throw new ApiRequestError("PHONEPE_UNAVAILABLE", 0);
  const setup = `${checkout.environment}:${checkout.merchantId}`;
  if (initialisedFor !== setup) {
    // flowId: letters and digits only. It ties PhonePe's logs to this customer without saying who they are.
    const flowId = customerRef.replace(/[^A-Za-z0-9]/g, "").slice(0, 32) || "shreeram";
    await PhonePePaymentSDK.init(checkout.environment, checkout.merchantId, flowId, false);
    initialisedFor = setup;
  }
  const request = JSON.stringify({ orderId: checkout.providerOrderId, merchantId: checkout.merchantId, token: checkout.token, paymentMode: { type: "PAY_PAGE" } });
  const result: unknown = await PhonePePaymentSDK.startTransaction(request, Platform.OS === "ios" ? "shreerammilks" : null);
  const status = typeof result === "object" && result !== null ? String((result as { status?: unknown }).status ?? "").toUpperCase() : "";
  return status === "SUCCESS" || status === "FAILURE" ? status : "INTERRUPTED";
}
