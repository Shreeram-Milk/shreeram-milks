import { useTranslation } from "react-i18next";

import { AppIcon } from "../atoms/AppIcon";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";
import { LanguageIcon } from "../../icons/appIcons";
import { useAppStore } from "../../store/useAppStore";
import { useTheme } from "../../theme";

/**
 * A small button on onboarding and sign-in that switches straight to the other language, named in its own script ("ગુજરાતી"
 * while the app is in English), so a customer who picked the wrong one can always find the way back. No confirm step: nothing
 * has been entered yet that a change could lose.
 */
export function LanguageChip() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const other = language === "gu" ? { value: "en" as const, label: "English" } : { value: "gu" as const, label: "ગુજરાતી" };
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t("language.switchTo", { language: other.label })}
      hitSlop={theme.spacing.xs}
      onPress={() => setLanguage(other.value)}
      style={{ minHeight: theme.layout.touchTargetMin - 8, flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, paddingHorizontal: theme.spacing.md - 4, borderRadius: theme.radii.pill, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface }}
    >
      <AppIcon icon={LanguageIcon} accessibilityLabel="" size="sm" tone="secondary" />
      <ThemedText variant="bodySmall" weight="bold">{other.label}</ThemedText>
    </PressableScale>
  );
}
