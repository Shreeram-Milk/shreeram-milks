import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CopyIcon } from "../../icons/appIcons";
import { useToast } from "../../providers/ToastProvider";
import { copyText } from "../../services/deviceExtras";
import { useTheme } from "../../theme";
import { AppIcon } from "../atoms/AppIcon";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";

type Props = {
  code: string;
  /** Starts hidden behind "Tap to reveal" (the offer page); a scratched card shows it straight away. */
  hidden?: boolean;
  compact?: boolean;
};

/** An offer code in a dashed box, with a Copy button. On a phone that cannot copy yet, the code can be long-pressed and selected. */
export function CodeBox({ code, hidden = false, compact = false }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [shown, setShown] = useState(!hidden);
  const copy = async () => {
    const copied = await copyText(code);
    showToast(copied ? t("rewards.copied", { code }) : t("rewards.copyByHand"), copied ? "success" : "info");
  };
  if (!shown) {
    return (
      <PressableScale accessibilityRole="button" accessibilityLabel={t("rewards.tapToReveal")} onPress={() => setShown(true)} style={{ minHeight: 56, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: theme.radii.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: theme.colors.colorPrimary, backgroundColor: theme.colors.colorPrimaryTint }}>
        <ThemedText variant="body" weight="extrabold" style={{ color: theme.colors.colorPrimary, letterSpacing: 4 }}>{"• ".repeat(Math.min(8, code.length)).trim()}</ThemedText>
        <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorPrimary }}>{t("rewards.tapToReveal")}</ThemedText>
      </PressableScale>
    );
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, minHeight: compact ? 44 : 56, paddingLeft: theme.spacing.md, paddingRight: theme.spacing.xs, borderRadius: theme.radii.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: theme.colors.colorPrimary, backgroundColor: theme.colors.colorPrimaryTint }}>
      <ThemedText selectable variant={compact ? "bodySmall" : "h2"} weight="extrabold" numberOfLines={1} style={{ flex: 1, color: theme.colors.colorPrimary, letterSpacing: 1.5 }}>{code}</ThemedText>
      <PressableScale accessibilityRole="button" accessibilityLabel={t("rewards.copy")} onPress={() => void copy()} hitSlop={theme.spacing.xs} style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 36, paddingHorizontal: theme.spacing.sm + 2, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorPrimary }}>
        <AppIcon icon={CopyIcon} accessibilityLabel="" size="sm" tone="onPrimary" />
        <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.colorTextInverse }}>{t("rewards.copy")}</ThemedText>
      </PressableScale>
    </View>
  );
}
