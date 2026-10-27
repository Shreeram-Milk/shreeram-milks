import { useQueryClient } from "@tanstack/react-query";
import { router, useRootNavigationState, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
// Types only: nothing of the module is loaded here, so an older build without it still starts.
import type { NotificationResponse } from "expo-notifications";

import { safeAppLink } from "../../lib/appLinks";
import { registerPushToken } from "../../services/notificationService";
import { queryKeys } from "../../services/queryKeys";
import { currentPushToken, loadNotifications, setUpPushChannels } from "../../services/pushNative";
import { useAppStore } from "../../store/useAppStore";
import { useSessionStore } from "../../store/useSessionStore";

// Taps already acted on, by message id, for the life of the app: a tap opens its screen exactly once, however often this re-runs.
const handledTaps = new Set<string>();

/**
 * Connects this phone to notifications for the signed-in customer, and renders nothing.
 *   - It sets up the two kinds of message (deliveries, offers) and, when notifications are already allowed, tells the server this
 *     phone's address and language. It never shows the phone's permission pop-up itself: the friendly ask on Home does that.
 *   - A message that arrives while the app is open shows as a banner and refreshes the bell.
 *   - Tapping a message opens the screen it points to (only a screen on the allowed list), once, after the app is ready.
 * Without the notifications module in the installed build (an older build) every step quietly does nothing.
 */
export function PushSetup() {
  const customerId = useSessionStore((state) => state.customer?.id ?? "");
  const language = useAppStore((state) => state.language);
  const { t } = useTranslation();
  const client = useQueryClient();
  const navigationReady = Boolean(useRootNavigationState()?.key);
  // The screen a tapped message wants, kept until the app is ready to open it; the counter wakes the effect that opens it.
  const pendingLink = useRef<string | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const deliveriesName = t("inbox.channelDeliveries");
  const offersName = t("inbox.channelOffers");

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    void (async () => {
      await setUpPushChannels({ deliveries: deliveriesName, offers: offersName });
      const token = await currentPushToken();
      if (!token || cancelled) return;
      try {
        await registerPushToken(token, language);
      } catch {
        // No connection right now: it is tried again the next time the app opens.
      }
    })();
    return () => { cancelled = true; };
  }, [customerId, deliveriesName, language, offersName]);

  useEffect(() => {
    const Notifications = loadNotifications();
    if (!Notifications || !customerId) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
    const refresh = () => {
      void client.invalidateQueries({ queryKey: queryKeys.notifications(customerId) });
      void client.invalidateQueries({ queryKey: queryKeys.unreadNotifications(customerId) });
    };
    const handleTap = (response: NotificationResponse) => {
      const id = response.notification.request.identifier;
      if (handledTaps.has(id)) return;
      handledTaps.add(id);
      refresh();
      const data = response.notification.request.content.data;
      pendingLink.current = safeAppLink(data?.link) ?? "/notifications";
      setTapCount((count) => count + 1);
    };
    // Firebase can issue this phone a new notification address while the app is open: the server is told at once, so no message is missed.
    const renewed = Notifications.addPushTokenListener((token) => {
      if (typeof token.data === "string" && token.data.length >= 20) void registerPushToken(token.data, language).catch(() => undefined);
    });
    const received = Notifications.addNotificationReceivedListener(refresh);
    const tapped = Notifications.addNotificationResponseReceivedListener(handleTap);
    // The app was closed and a message was tapped to open it; it is cleared so a later start does not open it again.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      handleTap(response);
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    });
    return () => { renewed.remove(); received.remove(); tapped.remove(); };
  }, [client, customerId, language]);

  // Opens the tapped message's screen only once the app's screens exist, so a tap that started the app is not lost.
  useEffect(() => {
    const link = pendingLink.current;
    if (!link || !navigationReady || !customerId) return;
    pendingLink.current = null;
    router.push(link as Href);
  }, [customerId, navigationReady, tapCount]);

  return null;
}
