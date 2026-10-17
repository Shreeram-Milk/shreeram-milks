import type { PressableProps } from "react-native";

import { AppIcon, type IconSvgElement } from "./AppIcon";
import { PressableScale } from "./PressableScale";
import { useTheme } from "../../theme";

interface IconButtonProps extends Omit<PressableProps, "style"> {
  icon: IconSvgElement;
  label: string;
  tone?: "primary" | "secondary";
  /** A soft grey circle behind the icon, for buttons that sit on top of content (back over a photo, bell on Home). */
  filled?: boolean;
}

export function IconButton({ filled = false, icon, label, tone = "primary", ...props }: IconButtonProps) {
  const theme = useTheme();
  return (
    <PressableScale
      {...props}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={theme.spacing.sm}
      pressScale={theme.motion.pressScale.compactControl}
      style={{
        width: theme.layout.touchTargetMin,
        height: theme.layout.touchTargetMin,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radii.pill,
        backgroundColor: filled ? theme.colors.colorSurfaceMuted : theme.colors.colorTransparent,
      }}
    >
      <AppIcon icon={icon} accessibilityLabel="" tone={tone} />
    </PressableScale>
  );
}
