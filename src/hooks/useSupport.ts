import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchMyTicket, fetchMyTickets, replyToTicket, sendReport } from "../services/supportTicketService";
import { queryKeys } from "../services/queryKeys";
import { useSessionStore } from "../store/useSessionStore";

const useCustomerId = () => useSessionStore((state) => state.customer?.id ?? "");

/** Sends a report to support. The screen shows the pending, success and error states from the returned mutation. */
export function useSubmitIssueReport() {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return useMutation({ mutationFn: sendReport, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.myTickets(customerId) }) });
}

/** The signed-in customer's own reports. Kept fresh for a short time, because staff replies arrive at any moment. */
export function useMyTickets() {
  const customerId = useCustomerId();
  return useQuery({ queryKey: queryKeys.myTickets(customerId), queryFn: fetchMyTickets, enabled: customerId !== "", staleTime: 15_000 });
}

export function useMyTicket(id: string) {
  const customerId = useCustomerId();
  return useQuery({ queryKey: queryKeys.myTicket(customerId, id), queryFn: () => fetchMyTicket(id), enabled: customerId !== "" && id !== "", staleTime: 10_000 });
}

export function useReplyToTicket(id: string) {
  const client = useQueryClient();
  const customerId = useCustomerId();
  return useMutation({
    mutationFn: (body: string) => replyToTicket(id, body),
    onSuccess: (thread) => {
      client.setQueryData(queryKeys.myTicket(customerId, id), thread);
      void client.invalidateQueries({ queryKey: queryKeys.myTickets(customerId) });
    },
  });
}
