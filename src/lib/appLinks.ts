/**
 * The only screens a notification may open. A message (from the server or from a tampered push) can never send the app anywhere
 * else: anything not on this list is ignored.
 */
const ALLOWED_LINKS = ["/order-tracking?orderId=", "/subscription-manage?id=", "/orders", "/subscriptions", "/notifications", "/offers"] as const;

/** The link when it is one of the allowed screens, otherwise null. */
export function safeAppLink(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 200 || /\s/.test(value)) return null;
  return ALLOWED_LINKS.some((prefix) => value.startsWith(prefix)) ? value : null;
}
