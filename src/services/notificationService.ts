import { safeAppLink } from "../lib/appLinks";
import type { AppLanguage } from "../types/models";
import type { AppNotification, NotificationPage } from "../types/notifications";
import { ApiRequestError, apiGet, apiSend, hasApi } from "./apiClient";

const record = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const whole = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const requireApi = (): void => {
  if (!hasApi()) throw new ApiRequestError("NETWORK_ERROR", 0);
};

/** Checks one message from the server. A malformed one is dropped rather than shown half-filled. */
export function parseNotification(raw: unknown): AppNotification | null {
  const item = record(raw);
  const id = text(item?.id);
  if (!item || !id || !text(item.title)) return null;
  return {
    id,
    event: text(item.event),
    title: text(item.title),
    titleGu: text(item.titleGujarati),
    body: text(item.body),
    bodyGu: text(item.bodyGujarati),
    link: safeAppLink(item.link),
    createdAt: text(item.createdAt),
    readAt: text(item.readAt) || null,
  };
}

export async function getMyNotifications(): Promise<NotificationPage> {
  requireApi();
  const body = record(await apiGet<unknown>("/customer/notifications?pageSize=50", { auth: true }));
  const notifications = list(body?.notifications).map(parseNotification).filter((item): item is AppNotification => item !== null);
  return { notifications, total: whole(body?.total), unread: whole(body?.unread) };
}

export async function getUnreadCount(): Promise<number> {
  requireApi();
  return whole(record(await apiGet<unknown>("/customer/notifications/unread-count", { auth: true }))?.unread);
}

export async function markNotificationRead(id: string): Promise<void> {
  requireApi();
  await apiSend<void>("POST", `/customer/notifications/${encodeURIComponent(id)}/read`, undefined, { auth: true });
}

export async function markAllNotificationsRead(): Promise<void> {
  requireApi();
  await apiSend<unknown>("POST", "/customer/notifications/read-all", undefined, { auth: true });
}

/** The notification address this phone last gave the server, kept so it can be taken back when the customer signs out. */
let registeredToken: string | null = null;

/** Tells the server where to send this customer's notifications, and which language they read. */
export async function registerPushToken(token: string, language: AppLanguage): Promise<void> {
  requireApi();
  await apiSend<void>("POST", "/customer/push-tokens", { token, platform: "android", language }, { auth: true });
  registeredToken = token;
}

/** Best effort when signing out: this phone stops getting that customer's notifications. Never blocks signing out. */
export async function forgetPushToken(): Promise<void> {
  const token = registeredToken;
  registeredToken = null;
  if (!token || !hasApi()) return;
  try {
    await apiSend<void>("POST", "/customer/push-tokens/remove", { token }, { auth: true });
  } catch {
    // Signing out must work offline; the server drops a dead address the first time it fails to deliver.
  }
}
