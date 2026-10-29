import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AppIcon } from "../atoms/AppIcon";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";
import { ConfirmSheet } from "../organisms/ConfirmSheet";
import { useLanguageSwitch } from "../../hooks/useLanguageSwitch";
import { LanguageIcon } from "../../icons/appIcons";
import { useAppStore } from "../../store/useAppStore";
import { useTheme } from "../../theme";
import type { AppLanguage } from "../../types/models";

// Each language is named in its own script, so either reader can find theirs.
const OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "gu", label: "ગુજરાતી" },
];

/** The app language as two large buttons on Profile, so it is one tap away. A change is confirmed first, in the new language. */
export function LanguageToggle() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const switchLanguage = useLanguageSwitch();
  const [pending, setPending] = useState<AppLanguage | null>(null);

  return (
    <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md - 4, borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface, ...theme.elevation.card }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <AppIcon icon={LanguageIcon} accessibilityLabel="" tone="secondary" size="sm" />
        <ThemedText variant="bodySmall" weight="bold">{t("profile.language")}</ThemedText>
      </View>
      <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: theme.spacing.xs, padding: 3, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }}>
        {OPTIONS.map((option) => {
          const selected = option.value === language;
          return (
            <PressableScale
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => { if (!selected) setPending(option.value); }}
              containerStyle={{ flex: 1 }}
              style={{ minHeight: theme.layout.touchTargetMin, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md - 2, backgroundColor: selected ? theme.colors.colorSurface : "transparent", ...(selected ? theme.elevation.card : null) }}
            >
              <ThemedText variant="body" weight={selected ? "bold" : "medium"} style={{ color: selected ? theme.colors.colorPrimary : theme.colors.colorTextSecondary }}>{option.label}</ThemedText>
            </PressableScale>
          );
        })}
      </View>
      {/* The question is asked in the new language; "keep" stays in the current one, so both readers understand their choice. */}
      <ConfirmSheet
        visible={pending !== null}
        icon={LanguageIcon}
        title={pending ? t("language.confirmTitle", { lng: pending }) : ""}
        description={pending ? t("language.confirmDetail", { lng: pending }) : ""}
        confirmLabel={pending ? t("language.confirm", { lng: pending }) : ""}
        cancelLabel={t("language.keep")}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const next = pending;
          setPending(null);
          void switchLanguage(next);
        }}
      />
    </View>
  );
}
