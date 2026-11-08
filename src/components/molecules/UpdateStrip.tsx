import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";

import { useAppConfig } from "../../hooks/useContent";
import { isVersionBelow } from "../../lib/contentLocalization";
import { CloseIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";
import { Button } from "../atoms/Button";
import { IconButton } from "../atoms/IconButton";
import { ThemedText } from "../atoms/ThemedText";

// Closed for the rest of this visit; it comes back the next time the app opens, until the customer updates.
let dismissed = false;

/**
 * A small "Update available" strip on Home when the Play Store has a newer app than this one. The app keeps working:
 * only an emergency minimum version (set separately by the admin) stops an old app.
 */
export function UpdateStrip() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: config } = useAppConfig();
  const [hidden, setHidden] = useState(dismissed);
  const packageName = Constants.expoConfig?.android?.package;
  const version = Constants.expoConfig?.version ?? "0.0.0";
  if (hidden || !config || Platform.OS !== "android" || !packageName || !isVersionBelow(version, config.latestAppVersion)) return null;
  return (
    <View accessibilityRole="summary" style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.sm, paddingLeft: theme.spacing.md, paddingRight: theme.spacing.xs, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorHighlightTint, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorHighlight }}>
      <View style={{ flex: 1 }}>
        <ThemedText variant="bodySmall" weight="bold">{t("availability.updateAvailable")}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("availability.updateAvailableDetail")}</ThemedText>
      </View>
      <Button compact onPress={() => { Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`).catch(() => undefined); }}>{t("availability.updateAction")}</Button>
      <IconButton icon={CloseIcon} label={t("availability.updateLater")} tone="secondary" onPress={() => { dismissed = true; setHidden(true); }} />
    </View>
  );
}
