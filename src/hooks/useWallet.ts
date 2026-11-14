import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../services/queryKeys";
import { getMyWallet, getWalletEntries, getWalletRefunds, requestWalletRefund, startTopUp } from "../services/walletService";
import { useSessionStore } from "../store/useSessionStore";
import { payAndConfirm } from "./useOrders";

const PAGE_SIZE = 20;
const useCustomerId = () => useSessionStore((state) => state.customer?.id ?? "");

/** The signed-in customer's wallet. Short-lived: orders, refunds and staff change it from elsewhere. */
export function useMyWallet() {
  const customerId = useCustomerId();
  return useQuery({ queryKey: queryKeys.wallet(customerId), queryFn: getMyWallet, enabled: customerId !== "", staleTime: 10_000 });
}

/** Wallet activity, newest first, one page at a time. */
export function useWalletEntries() {
  const customerId = useCustomerId();
  return useInfiniteQuery({
    queryKey: queryKeys.walletEntries(customerId),
    queryFn: ({ pageParam }) => getWalletEntries(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (pages.length * PAGE_SIZE < last.total ? pages.length + 1 : undefined),
    enabled: customerId !== "",
    staleTime: 10_000,
  });
}

/** Every refund asked for, with where each one is: waiting, sent by ShreeRam, or in the bank. */
export function useWalletRefunds() {
  const customerId = useCustomerId();
  return useQuery({ queryKey: queryKeys.walletRefunds(customerId), queryFn: getWalletRefunds, enabled: customerId !== "", staleTime: 10_000 });
}

/** Adds money with PhonePe. The answer shown is always the server's (which asks PhonePe), never PhonePe's screen. */
export function useTopUp() {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return useMutation({
    mutationFn: async ({ amountPaise, idempotencyKey }: { amountPaise: number; idempotencyKey: string }) => payAndConfirm(await startTopUp(amountPaise, idempotencyKey), customerId),
    onSettled: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.wallet(customerId) }), client.invalidateQueries({ queryKey: queryKeys.walletEntries(customerId) })]),
  });
}

/** Asks for the whole balance back. */
export function useRequestWalletRefund() {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return useMutation({
    mutationFn: (idempotencyKey: string) => requestWalletRefund(idempotencyKey),
    onSettled: () => Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.wallet(customerId) }),
      client.invalidateQueries({ queryKey: queryKeys.walletEntries(customerId) }),
      client.invalidateQueries({ queryKey: queryKeys.walletRefunds(customerId) }),
    ]),
  });
}
