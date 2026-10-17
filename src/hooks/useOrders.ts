import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cancelMyOrder, confirmPayment, getMyCredit, getMyOrder, getMyOrders, payRequest, placeOrders, quoteOrder, startOrderPayment, type CheckoutRequest } from "../services/orderService";
import { openPhonePeCheckout } from "../services/phonePeCheckout";
import { queryKeys } from "../services/queryKeys";
import { useSessionStore } from "../store/useSessionStore";
import type { OnlinePayment, PaymentStart } from "../types/orders";

const useCustomerId = () => useSessionStore((state) => state.customer?.id ?? "");

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
/** After PhonePe's screen says "success", the bank may need a few seconds: the server is asked again over about 20 seconds. */
const CONFIRM_WAITS_MS = [0, 1500, 2500, 4000, 5000, 7000];

/**
 * Opens PhonePe for a started payment, then asks the server (which asks PhonePe) how it ended. What PhonePe's screen said only
 * decides how long to keep asking: the answer shown to the customer is always the server's.
 */
export async function payAndConfirm(start: PaymentStart, customerRef: string): Promise<OnlinePayment> {
  if (!start.checkout) return start.payment;
  const outcome = await openPhonePeCheckout(start.checkout, customerRef);
  const waits = outcome === "SUCCESS" ? CONFIRM_WAITS_MS : [0];
  let latest = start.payment;
  for (const ms of waits) {
    if (ms > 0) await wait(ms);
    latest = await confirmPayment(start.payment.merchantOrderId);
    if (latest.status !== "pending") return latest;
  }
  return latest;
}

/** The signed-in customer's orders, newest first. Never cached for long: staff change an order's status in the admin. */
export function useMyOrders() {
  const customerId = useCustomerId();
  return useQuery({ queryKey: queryKeys.orders(customerId), queryFn: getMyOrders, enabled: customerId !== "", staleTime: 15_000 });
}

export function useMyOrder(orderId?: string) {
  const customerId = useCustomerId();
  return useQuery({ queryKey: [...queryKeys.orders(customerId), orderId], queryFn: () => getMyOrder(orderId ?? ""), enabled: customerId !== "" && Boolean(orderId), staleTime: 10_000 });
}

/** The server's price and plan for a cart: what it becomes, the windows to choose from, and anything that stops it being placed. */
export function useQuote(request: CheckoutRequest | null) {
  return useQuery({
    queryKey: queryKeys.quote(JSON.stringify(request)),
    queryFn: () => quoteOrder(request as CheckoutRequest),
    enabled: request !== null,
    // The delivery dates and order-by times depend on the clock, so an old answer is not reused.
    staleTime: 0,
    gcTime: 60_000,
    // While a new window is being priced, the last answer stays on screen instead of the total flashing to nothing.
    placeholderData: (previous) => previous,
    retry: false,
  });
}

export function usePlaceOrder() {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return useMutation({
    mutationFn: placeOrders,
    onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.orders(customerId) }), client.invalidateQueries({ queryKey: queryKeys.credit(customerId) })]),
  });
}

/** Pays online for a checkout: starts the payment, opens PhonePe, and returns the confirmed result (with the orders once written). */
export function usePayForOrder() {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return useMutation({
    mutationFn: async (request: Parameters<typeof startOrderPayment>[0]) => payAndConfirm(await startOrderPayment(request), customerId),
    onSettled: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.orders(customerId) }), client.invalidateQueries({ queryKey: queryKeys.credit(customerId) })]),
  });
}

/** Asks again about a payment still pending (the customer taps "Check again"). */
export function useCheckPayment() {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return useMutation({
    mutationFn: confirmPayment,
    onSettled: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.orders(customerId) }), client.invalidateQueries({ queryKey: queryKeys.credit(customerId) })]),
  });
}

export function useCancelOrder(orderId: string) {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return useMutation({
    mutationFn: (reason: string) => cancelMyOrder(orderId, reason),
    onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.orders(customerId) }), client.invalidateQueries({ queryKey: queryKeys.credit(customerId) })]),
  });
}

/** A credit customer's limit, what they owe and open "pay now" requests. */
export function useMyCredit() {
  const customerId = useCustomerId();
  return useQuery({ queryKey: queryKeys.credit(customerId), queryFn: getMyCredit, enabled: customerId !== "", staleTime: 15_000 });
}

export function usePayRequest() {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return useMutation({
    mutationFn: async ({ requestId, idempotencyKey }: { requestId: string; idempotencyKey: string }) => payAndConfirm(await payRequest(requestId, idempotencyKey), customerId),
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.credit(customerId) }),
  });
}
