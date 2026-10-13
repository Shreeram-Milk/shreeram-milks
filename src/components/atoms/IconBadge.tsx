import { View } from "react-native";

import { useTheme } from "../../theme";
import { AppIcon, type IconSvgElement } from "./AppIcon";

interface IconBadgeProps {
  icon: IconSvgElement;
  size?: "md" | "lg";
  tone?: "primary" | "success" | "neutral";
}

/** An icon on a soft round background. Decorative: the text beside it carries the meaning. */
export function IconBadge({ icon, size = "md", tone = "primary" }: IconBadgeProps) {
  const theme = useTheme();
  const box = size === "lg" ? theme.sizes.avatarLg : theme.sizes.avatarMd;
  const background = tone === "success" ? theme.colors.colorSuccessTint : tone === "neutral" ? theme.colors.colorSurfaceMuted : theme.colors.colorPrimaryTint;
  return (
    <View style={{ width: box, height: box, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: background }}>
      <AppIcon icon={icon} accessibilityLabel="" size={size === "lg" ? "lg" : "md"} tone={tone === "success" ? "success" : tone === "neutral" ? "secondary" : "primary"} />
    </View>
  );
}
