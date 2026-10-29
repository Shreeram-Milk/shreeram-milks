import { useNavigationContainerRef, useSegments } from "expo-router";
import { useEffect } from "react";

import { useSessionStore } from "../../store/useSessionStore";

/** Screens a signed-out phone may show. Every other screen needs a signed-in customer. */
const PUBLIC_SCREENS = new Set(["", "index", "choose-language", "onboarding", "sign-in", "verify", "language", "policies", "policy-details"]);

/**
 * Keeps a signed-out phone out of the signed-in app. Whenever the session is not signed in and the screen on top is not a public
 * one (after signing out, a refused token, a deleted account, the hardware Back button, or a notification tap), the whole
 * screen history is replaced by the welcome screen alone, so Back leaves the app instead of returning to old screens.
 * The server refuses personal data without a valid token anyway; this keeps the screens themselves out of reach.
 */
export function SignedOutGuard() {
  const navigation = useNavigationContainerRef();
  const segments = useSegments();
  const status = useSessionStore((state) => state.status);
  const screen: string = segments[0] ?? "";

  useEffect(() => {
    if (status !== "signedOut" || PUBLIC_SCREENS.has(screen) || !navigation.isReady()) return;
    navigation.reset({ index: 0, routes: [{ name: "onboarding" }] });
  }, [navigation, screen, status]);

  return null;
}
