import type { PropsWithChildren } from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { useTheme } from "../../theme";

export type CardTone = "plain" | "highlight" | "accent" | "muted";

interface CardProps extends ViewProps {
  /** plain: white card. highlight: the one fresh mint card on a screen. accent: soft marigold for offers or pauses. muted: grey fill, no shadow. */
  tone?: CardTone;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The card surface used everywhere: white with a hairline border and a soft shadow, so it separates from the white page. */
export function Card({ children, padded = true, style, tone = "plain", ...props }: PropsWithChildren<CardProps>) {
  const theme = useTheme();
  const colors = theme.colors;
  const toneStyle: ViewStyle =
    tone === "highlight"
      ? { backgroundColor: colors.colorAccentTint, borderColor: colors.colorAccentBorder }
      : tone === "accent"
        ? { backgroundColor: colors.colorHighlightTint, borderColor: colors.colorHighlightTint }
        : tone === "muted"
          ? { backgroundColor: colors.colorSurfaceMuted, borderColor: colors.colorSurfaceMuted }
          : { backgroundColor: colors.colorSurface, borderColor: colors.colorBorder, ...theme.elevation.card };

  return (
    <View
      {...props}
      style={[{ borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, padding: padded ? theme.spacing.md : theme.spacing.none }, toneStyle, style]}
    >
      {children}
    </View>
  );
}
