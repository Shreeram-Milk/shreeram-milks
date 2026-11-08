import { Platform } from "react-native";

type ClipboardModule = typeof import("expo-clipboard");
type HapticsModule = typeof import("expo-haptics");

let clipboard: ClipboardModule | null | undefined;
let haptics: HapticsModule | null | undefined;

/**
 * Copying and small vibrations come from parts of the phone app itself. A build made before they were added does not have them,
 * and loading them there fails, so each is loaded once and is null when missing: the screens then fall back instead of crashing.
 */
function loadClipboard(): ClipboardModule | null {
  if (clipboard !== undefined) return clipboard;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    clipboard = require("expo-clipboard") as ClipboardModule;
  } catch {
    clipboard = null;
  }
  return clipboard;
}

function loadHaptics(): HapticsModule | null {
  if (haptics !== undefined) return haptics;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    haptics = require("expo-haptics") as HapticsModule;
  } catch {
    haptics = null;
  }
  return haptics;
}

/** Copies text. True when it was copied; false when this phone's app cannot copy yet (the code stays selectable on screen instead). */
export async function copyText(value: string): Promise<boolean> {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.writeText(value).then(() => true, () => false);
  }
  const module = loadClipboard();
  if (!module) return false;
  try {
    await module.setStringAsync(value);
    return true;
  } catch {
    return false;
  }
}

/** A light tick while scratching, and a happy buzz when a reward is revealed. Never throws; does nothing on the web. */
export function feel(kind: "tick" | "success"): void {
  if (Platform.OS === "web") return;
  const module = loadHaptics();
  try {
    // An older build has no vibration permission, so it simply stays still.
    if (!module) return;
    if (kind === "tick") void module.impactAsync(module.ImpactFeedbackStyle.Light).catch(() => undefined);
    else void module.notificationAsync(module.NotificationFeedbackType.Success).catch(() => undefined);
  } catch {
    // A missed vibration is never worth an error.
  }
}
