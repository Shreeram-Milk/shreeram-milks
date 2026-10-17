import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";

import { useAppStore } from "../../store/useAppStore";
import { motion } from "../../theme/motion";
import { useTheme } from "../../theme";
import { ThemedText } from "../atoms/ThemedText";

const fadeIn = FadeIn.duration(motion.duration.normal).easing(Easing.bezier(...motion.easing.decelerate)).reduceMotion(ReduceMotion.Never);
const fadeOut = FadeOut.duration(motion.duration.normal).easing(Easing.bezier(...motion.easing.accelerate)).reduceMotion(ReduceMotion.Never);

/** The white cover shown while the language changes, so the customer never sees screens re-drawing half in one language. */
export function LanguageSwitchOverlay() {
  const theme = useTheme();
  const { t } = useTranslation();
  const target = useAppStore((state) => state.languageSwitchTarget);
  if (!target) return null;
  return (
    <Animated.View
      entering={fadeIn}
      exiting={fadeOut}
      accessibilityViewIsModal
      accessibilityLiveRegion="polite"
      style={[StyleSheet.absoluteFill, { zIndex: theme.zIndex.toast, alignItems: "center", justifyContent: "center", gap: theme.spacing.md, backgroundColor: theme.colors.colorBackground }]}
    >
      <ActivityIndicator color={theme.colors.colorPrimary} />
      {/* Written in the language being switched to, so it already reads right. */}
      <ThemedText variant="body" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("language.switching", { lng: target })}</ThemedText>
    </Animated.View>
  );
}
