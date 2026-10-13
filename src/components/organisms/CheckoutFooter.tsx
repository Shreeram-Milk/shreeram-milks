import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { useTheme } from "../../theme";
interface CheckoutFooterProps {
  amount: number;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}
export function CheckoutFooter({
  amount,
  disabled,
  label,
  onPress,
}: CheckoutFooterProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[
        {
          paddingHorizontal: theme.layout.screenHorizontalPadding,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          backgroundColor: theme.colors.colorSurface,
        },
        theme.elevation.card,
      ]}
    >
      <View style={{ flex: 0.9 }}>
        <ThemedText variant="h2">₹{amount}</ThemedText>
        <ThemedText
          variant="caption"
          style={{ color: theme.colors.colorTextSecondary }}
        >
          {t("checkout.footer.inclusive")}
        </ThemedText>
      </View>
      <Button
        style={{ flex: 1.1, paddingHorizontal: theme.spacing.sm }}
        disabled={disabled}
        onPress={onPress}
      >
        {label}
      </Button>
    </View>
  );
}
