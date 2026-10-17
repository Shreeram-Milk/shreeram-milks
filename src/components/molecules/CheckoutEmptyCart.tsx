import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { useTheme } from "../../theme";

/** Shown on any checkout step when the cart has been emptied, with a way back to shopping. */
export function CheckoutEmptyCart() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.lg, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface, ...theme.elevation.sm }}>
      <ThemedText variant="body" weight="semibold">{t("checkout.empty.title")}</ThemedText>
      <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t("checkout.empty.detail")}</ThemedText>
      <Button onPress={() => router.replace("/cart")}>{t("checkout.empty.action")}</Button>
    </View>
  );
}
