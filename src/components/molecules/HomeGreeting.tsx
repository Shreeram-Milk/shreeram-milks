import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useGreetingPart } from "../../hooks/useGreeting";
import { useSessionStore } from "../../store/useSessionStore";
import { useTheme } from "../../theme";
import { ThemedText } from "../atoms/ThemedText";

/**
 * "Good morning, Priya" in the headline face, following the time of day in India. In the English app a small Gujarati
 * greeting sits above it, a quiet local touch; the Gujarati app shows the Gujarati greeting alone.
 */
export function HomeGreeting() {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const part = useGreetingPart();
  const firstName = useSessionStore((state) => state.customer?.name ?? "").trim().split(/\s+/)[0] ?? "";
  const greeting = t(`home.greetings.${part}`);
  const gujarati = !i18n.language.startsWith("gu") ? i18n.getFixedT("gu")(`home.greetings.${part}`) : "";
  return (
    <View style={{ gap: 2, paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.sm }}>
      {gujarati ? <ThemedText variant="label" style={{ color: theme.colors.colorBrandText }}>{gujarati}</ThemedText> : null}
      <ThemedText accessibilityRole="header" variant="display" weight="semibold" numberOfLines={2}>
        {firstName ? t("home.greetingName", { greeting, name: firstName }) : greeting}
      </ThemedText>
    </View>
  );
}
