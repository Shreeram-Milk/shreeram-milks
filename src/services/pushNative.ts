import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null | undefined;

/**
 * The notifications module is part of the phone app itself. A build made before it was added does not have it, and loading it
 * there fails. This loads it once and returns null when it is not there, so everything built on it simply does nothing instead
 * of crashing the app.
 */
export function loadNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require("expo-notifications") as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}

/** The two kinds of message, as Android "channels", so a customer can mute offers and still get delivery news. Must match the backend. */
export const PUSH_CHANNELS = { deliveries: "deliveries", offers: "offers" } as const;

/** Creates (or renames) the two channels in the customer's language. The early single "default" channel is removed. Never throws. */
export async function setUpPushChannels(names: { deliveries: string; offers: string }): Promise<void> {
  const Notifications = loadNotifications();
  if (!Notifications || Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(PUSH_CHANNELS.deliveries, { name: names.deliveries, importance: Notifications.AndroidImportance.HIGH });
    await Notifications.setNotificationChannelAsync(PUSH_CHANNELS.offers, { name: names.offers, importance: Notifications.AndroidImportance.DEFAULT });
    await Notifications.deleteNotificationChannelAsync("default");
  } catch {
    // Channels are a comfort, not a requirement: messages still arrive in the phone's fallback channel.
  }
}

/** Whether notifications are allowed: "granted", "ask" (the app may still ask), or "off" (refused for good, or not possible here). */
export async function pushPermission(): Promise<"granted" | "ask" | "off"> {
  const Notifications = loadNotifications();
  if (!Notifications || Platform.OS !== "android") return "off";
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return "granted";
    return current.canAskAgain ? "ask" : "off";
  } catch {
    return "off";
  }
}

/** This phone's Firebase notification address, only when notifications are already allowed. Never asks and never throws. */
export async function currentPushToken(): Promise<string | null> {
  const Notifications = loadNotifications();
  if (!Notifications || (await pushPermission()) !== "granted") return null;
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return typeof token.data === "string" && token.data.length >= 20 ? token.data : null;
  } catch {
    return null;
  }
}

/** Shows the phone's own permission pop-up (Android 13 and later) and returns the address when allowed, else null. Never throws. */
export async function askForPushToken(): Promise<string | null> {
  const Notifications = loadNotifications();
  if (!Notifications || Platform.OS !== "android") return null;
  try {
    const granted = (await Notifications.requestPermissionsAsync()).granted;
    return granted ? await currentPushToken() : null;
  } catch {
    return null;
  }
}
