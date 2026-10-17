import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PressableScale } from "../src/components/atoms/PressableScale";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { ConfirmSheet } from "../src/components/organisms/ConfirmSheet";
import { useLanguageSwitch } from "../src/hooks/useLanguageSwitch";
import { LanguageIcon } from "../src/icons/appIcons";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { AppLanguage } from "../src/types/models";

// Each language is named in its own script, so either reader can find theirs.
const OPTIONS: { value: AppLanguage; label: string; hint: string }[] = [
  { value: "en", label: "English", hint: "English" },
  { value: "gu", label: "ગુજરાતી", hint: "Gujarati" },
];

export default function LanguageScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const switchLanguage = useLanguageSwitch();
  const [pending, setPending] = useState<AppLanguage | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.layout.screenHorizontalPadding, gap: theme.spacing.md }}>
        <ScreenHeader backLabel={t("commonActions.back")} title={t("language.title")} />
        <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("language.description")}</ThemedText>
        <View accessibilityRole="radiogroup" style={{ gap: theme.spacing.md - 4 }}>
          {OPTIONS.map((option) => {
            const selected = option.value === language;
            return (
              <PressableScale
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                onPress={() => { if (!selected) setPending(option.value); }}
                style={{ minHeight: 64, paddingHorizontal: theme.spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: theme.radii.lg, borderWidth: selected ? 1.5 : theme.borderWidths.hairline, borderColor: selected ? theme.colors.colorAccent : theme.colors.colorBorder, backgroundColor: selected ? theme.colors.colorAccentTint : theme.colors.colorSurface }}
              >
                <View style={{ gap: 2 }}>
                  <ThemedText variant="body" weight="bold">{option.label}</ThemedText>
                  <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{option.hint}</ThemedText>
                </View>
                <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, borderWidth: theme.borderWidths.medium, borderColor: selected ? theme.colors.colorAccent : theme.colors.colorBorder }}>
                  {selected ? <View style={{ width: 12, height: 12, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorAccent }} /> : null}
                </View>
              </PressableScale>
            );
          })}
        </View>
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
    </SafeAreaView>
  );
}
