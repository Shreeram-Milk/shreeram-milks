import type { PropsWithChildren, ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { ThemedText } from "../atoms/ThemedText";
import { useTheme } from "../../theme";

interface CheckoutSectionProps {
  title: string;
  /** Small text or link at the right of the title, such as a count or "Change". */
  aside?: ReactNode;
  /** Wraps the content in a white card. Off for grids of tiles that carry their own surface. */
  card?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** A titled block of a checkout step, so every step reads with the same rhythm. */
export function CheckoutSection({ aside, card = true, children, style, title }: PropsWithChildren<CheckoutSectionProps>) {
  const theme = useTheme();
  return (
    <View style={[{ gap: theme.spacing.sm + 2 }, style]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}>
        <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary, letterSpacing: 0.3 }}>{title}</ThemedText>
        {aside}
      </View>
      {card ? <View style={{ borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface, overflow: "hidden", ...theme.elevation.sm }}>{children}</View> : children}
    </View>
  );
}
