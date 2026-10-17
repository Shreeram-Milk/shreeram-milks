import type { PropsWithChildren } from "react";

import { useTheme } from "../../theme";
import { PressableScale } from "./PressableScale";
import { ThemedText } from "./ThemedText";

interface ChipProps { onPress?: () => void; selected?: boolean; }

/** A filter pill. The chosen one is mint; the others are white with a thin line. */
export function Chip({ children, onPress, selected = false }: PropsWithChildren<ChipProps>) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      pressScale={theme.motion.pressScale.control}
      style={{
        minHeight: 38,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.md - 2,
        borderRadius: theme.radii.pill,
        borderWidth: theme.borderWidths.hairline,
        borderColor: selected ? theme.colors.colorAccentBorder : theme.colors.colorBorder,
        backgroundColor: selected ? theme.colors.colorAccentTint : theme.colors.colorSurface,
      }}
    >
      <ThemedText variant="label" weight={selected ? "bold" : "medium"} style={{ color: selected ? theme.colors.colorAccent : theme.colors.colorTextPrimary }}>{children}</ThemedText>
    </PressableScale>
  );
}
