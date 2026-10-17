import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../services/queryKeys";
import { changeMySubscription, getMyDeliveries, getMySubscription, getMySubscriptions, quoteSubscription, startSubscription, type SubscriptionAction } from "../services/subscriptionService";
import { useSessionStore } from "../store/useSessionStore";
import type { OnlinePayment } from "../types/orders";
import type { Subscription, SubscriptionDraft } from "../types/subscriptions";
import { payAndConfirm } from "./useOrders";

const useCustomerId = () => useSessionStore((state) => state.customer?.id ?? "");

/** The customer's subscriptions and trials, live ones first. Staff can change them too, so they are not cached for long. */
export function useMySubscriptions() {
  const customerId = useCustomerId();
  return useQuery({ queryKey: queryKeys.subscriptions(customerId), queryFn: getMySubscriptions, enabled: customerId !== "", staleTime: 15_000 });
}

export function useMySubscription(id?: string) {
  const customerId = useCustomerId();
  return useQuery({ queryKey: [...queryKeys.subscriptions(customerId), id], queryFn: () => getMySubscription(id ?? ""), enabled: customerId !== "" && Boolean(id), staleTime: 10_000 });
}

/** The server's price and dates for a draft. Dates depend on the clock, so an old answer is never reused. */
export function useSubscriptionQuote(draft: SubscriptionDraft | null) {
  return useQuery({
    queryKey: ["subscription-quote", JSON.stringify(draft)],
    queryFn: () => quoteSubscription(draft as SubscriptionDraft),
    enabled: draft !== null,
    staleTime: 0,
    gcTime: 60_000,
    placeholderData: (previous) => previous,
    retry: false,
  });
}

/** Everything that a subscription change can affect on other screens. */
function useRefresh() {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return () => Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.subscriptions(customerId) }),
    client.invalidateQueries({ queryKey: queryKeys.deliveries(customerId) }),
    client.invalidateQueries({ queryKey: queryKeys.orders(customerId) }),
    client.invalidateQueries({ queryKey: queryKeys.credit(customerId) }),
  ]);
}

export type SubscribeResult = { subscription: Subscription | null; payment: OnlinePayment | null };

/** Starts a subscription or trial: at once on credit, or after paying the whole amount in PhonePe. */
export function useStartSubscription() {
  const refresh = useRefresh();
  const customerId = useCustomerId();
  return useMutation({
    mutationFn: async (request: Parameters<typeof startSubscription>[0]): Promise<SubscribeResult> => {
      const started = await startSubscription(request);
      if (!started.start) return { subscription: started.subscription, payment: null };
      return { subscription: null, payment: await payAndConfirm(started.start, customerId) };
    },
    onSettled: refresh,
  });
}

export function useChangeSubscription(id: string) {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (action: SubscriptionAction) => changeMySubscription(id, action), onSuccess: refresh });
}

/** Deliveries between two dates (at most 62 days), for the calendar and Home. */
export function useMyDeliveries(from: string, to: string) {
  const customerId = useCustomerId();
  return useQuery({ queryKey: [...queryKeys.deliveries(customerId), from, to], queryFn: () => getMyDeliveries(from, to), enabled: customerId !== "", staleTime: 30_000, refetchOnWindowFocus: true });
}
