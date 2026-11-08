import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../services/queryKeys";
import { getMyRewards, scratchReward } from "../services/rewardService";
import { useSessionStore } from "../store/useSessionStore";
import type { RewardCard } from "../types/rewards";

const useCustomerId = () => useSessionStore((state) => state.customer?.id ?? "");

/** The customer's scratch cards. Refreshed when the app comes back to the front, so a card won meanwhile shows up. */
export function useMyRewards() {
  const customerId = useCustomerId();
  return useQuery({ queryKey: queryKeys.rewards(customerId), queryFn: getMyRewards, enabled: customerId !== "", staleTime: 30_000, refetchOnWindowFocus: true });
}

/** Scratches a card. The list is updated with the revealed card straight away, then refreshed from the server. */
export function useScratchReward() {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return useMutation({
    mutationFn: scratchReward,
    onSuccess: (card) => {
      client.setQueryData<RewardCard[]>(queryKeys.rewards(customerId), (cards) => cards?.map((item) => (item.id === card.id ? card : item)));
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.rewards(customerId) }),
  });
}
