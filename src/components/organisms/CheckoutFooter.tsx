import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { formatRupees } from "../../lib/catalogCart";
import { useTheme } from "../../theme";

interface CheckoutFooterProps {
  /** Amount in paise, shown as a preview; the server decides the real total. */
  amountPaise: number;
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
}

/** The floating white bar at the bottom of each checkout step: what the customer pays and the next action. */
export function CheckoutFooter({ amountPaise, disabled, label, loading, onPress }: CheckoutFooterProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        marginHorizontal: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: theme.radii.lg + theme.spacing.sm,
        borderWidth: theme.borderWidths.hairline,
        borderColor: theme.colors.colorBorder,
        backgroundColor: theme.colors.colorSurface,
      }}
    >
      <View style={{ flex: 1 }}>
        <ThemedText variant="h2" weight="bold" numberOfLines={1}>{formatRupees(amountPaise)}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("checkout.footer.inclusive")}</ThemedText>
      </View>
      <Button style={{ flex: 1.6 }} disabled={disabled} loading={loading} onPress={onPress}>
        {label}
      </Button>
    </View>
  );
}
