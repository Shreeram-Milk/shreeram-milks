import * as Updates from "expo-updates";
import { useEffect, useRef } from "react";

/** How long after opening a just-downloaded update may still replace the running code without surprising anyone. */
const FIRST_MOMENTS_MS = 6_000;
/** A fresh install runs the code inside the APK, which may be weeks old: it waits longer for the newest update. */
const FRESH_INSTALL_MS = 25_000;

/**
 * The app checks for a newer update every time it opens and normally uses it from the next launch, so nothing changes under
 * someone mid-order. But a brand-new install (or a phone that was offline for a while) would then show old screens for one whole
 * visit. So when the newest update finishes downloading in the first moments after opening, the app switches to it right away,
 * while the customer has barely started. Later than that, it waits for the next launch as before.
 */
export function ApplyFreshUpdate() {
  const { isUpdatePending } = Updates.useUpdates();
  const openedAt = useRef(0);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled || !isUpdatePending) return;
    const window = Updates.isEmbeddedLaunch ? FRESH_INSTALL_MS : FIRST_MOMENTS_MS;
    if (Date.now() - openedAt.current <= window) void Updates.reloadAsync().catch(() => undefined);
  }, [isUpdatePending]);

  return null;
}
