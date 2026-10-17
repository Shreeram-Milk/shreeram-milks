import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { IconButton } from "../atoms/IconButton";
import { ThemedText } from "../atoms/ThemedText";
import { BackIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";

interface CheckoutProgressProps {
  step: 1 | 2;
  title: string;
}

/** Back button, step title and a slim two-part progress line shared by every checkout step. */
export function CheckoutProgress({ step, title }: CheckoutProgressProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const labels = [t("checkout.progress.address"), t("checkout.progress.review")];
  return (
    <View style={{ gap: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <View style={{ borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurface }}>
          <IconButton icon={BackIcon} label={t("commonActions.back")} onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("checkout.stepOf", { step, total: labels.length })}</ThemedText>
          <ThemedText variant="h2">{title}</ThemedText>
        </View>
      </View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: labels.length, now: step }} style={{ flexDirection: "row", gap: theme.spacing.xs }}>
        {labels.map((label, index) => {
          const reached = index + 1 <= step;
          const current = index + 1 === step;
          return (
            <View key={label} style={{ flex: 1, gap: theme.spacing.xs }}>
              <View style={{ height: 3, borderRadius: theme.radii.pill, backgroundColor: reached ? theme.colors.colorTextSecondary : theme.colors.colorBorder }} />
              <ThemedText variant="caption" weight="medium" style={{ color: current ? theme.colors.colorTextPrimary : theme.colors.colorTextSecondary }}>
                {label}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}
