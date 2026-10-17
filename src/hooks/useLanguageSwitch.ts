import { router } from "expo-router";
import { useCallback } from "react";

import { useAppStore } from "../store/useAppStore";
import { motion } from "../theme/motion";
import type { AppLanguage } from "../types/models";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Changes the app language as a calm "soft restart": a cover fades in, the language changes behind it, the app goes back to
 * Home, and the cover fades away. The cart and the sign-in are kept; nothing is fetched again except what Home normally loads.
 */
export function useLanguageSwitch() {
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setTarget = useAppStore((state) => state.setLanguageSwitchTarget);

  return useCallback(
    async (language: AppLanguage) => {
      setTarget(language);
      await wait(motion.duration.normal);
      setLanguage(language);
      router.dismissTo("/home");
      // Give Home a moment to draw in the new language before the cover lifts.
      await wait(motion.duration.slow);
      setTarget(null);
    },
    [setLanguage, setTarget],
  );
}
