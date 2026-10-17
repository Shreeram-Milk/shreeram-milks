import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMyNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";
import { queryKeys } from "../services/queryKeys";
import { useSessionStore } from "../store/useSessionStore";

const useCustomerId = () => useSessionStore((state) => state.customer?.id ?? "");

/** The customer's messages, newest first. They also refresh when the app comes back to the front. */
export function useMyNotifications() {
  const customerId = useCustomerId();
  return useQuery({ queryKey: queryKeys.notifications(customerId), queryFn: getMyNotifications, enabled: customerId !== "", staleTime: 10_000, refetchOnWindowFocus: true });
}

/** How many messages are unread, for the badge on the bell. A small question asked rarely: when Home opens and when the app returns to the front. */
export function useUnreadCount() {
  const customerId = useCustomerId();
  return useQuery({ queryKey: queryKeys.unreadNotifications(customerId), queryFn: getUnreadCount, enabled: customerId !== "", staleTime: 30_000, refetchOnWindowFocus: true });
}

/** Marks one message, or all of them, as read, then refreshes the list and the badge. */
export function useMarkNotificationsRead() {
  const client = useQueryClient();
  const customerId = useCustomerId();
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.notifications(customerId) }), client.invalidateQueries({ queryKey: queryKeys.unreadNotifications(customerId) })]);
  const one = useMutation({ mutationFn: markNotificationRead, onSettled: refresh });
  const all = useMutation({ mutationFn: markAllNotificationsRead, onSettled: refresh });
  return { one, all };
}
