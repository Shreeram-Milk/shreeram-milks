import { View } from "react-native";

import { AppIcon, type IconSvgElement, type IconTone } from "../atoms/AppIcon";
import { Divider } from "../atoms/Divider";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";
import { ForwardIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";

export type MenuRowTone = "default" | "brand" | "accent" | "highlight" | "danger";

interface AccountMenuRowProps {
  icon: IconSvgElement;
  isLast?: boolean;
  onPress?: () => void;
  subtitle: string;
  title: string;
  /** The colour of the small icon tile: grey by default, or a brand colour for the rows that matter most. */
  tone?: MenuRowTone;
  trailing?: string;
}

/** A settings-style row: a tinted icon tile, a title and a grey line, and an arrow (or a short value) on the right. */
export function AccountMenuRow({ icon, isLast = false, onPress, subtitle, title, tone = "default", trailing }: AccountMenuRowProps) {
  const theme = useTheme();
  const isDanger = tone === "danger";
  const tile: Record<MenuRowTone, { bg: string; icon: IconTone }> = {
    default: { bg: theme.colors.colorSurfaceMuted, icon: "primary" },
    brand: { bg: theme.colors.colorPrimaryTint, icon: "brand" },
    accent: { bg: theme.colors.colorAccentTint, icon: "accent" },
    highlight: { bg: theme.colors.colorHighlightTint, icon: "highlight" },
    danger: { bg: theme.colors.colorDangerTint, icon: "danger" },
  };

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={{ minHeight: theme.layout.touchTargetMin + theme.spacing.md, paddingHorizontal: theme.spacing.md - 4, paddingVertical: theme.spacing.md - 4, flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4 }}
      >
        <View style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md - 2, backgroundColor: tile[tone].bg }}>
          <AppIcon icon={icon} accessibilityLabel="" tone={tile[tone].icon} size="sm" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText variant="bodySmall" weight="bold" numberOfLines={2} style={{ color: isDanger ? theme.colors.colorDanger : undefined }}>{title}</ThemedText>
          <ThemedText variant="caption" weight="regular" numberOfLines={2} style={{ color: theme.colors.colorTextSecondary }}>{subtitle}</ThemedText>
        </View>
        {trailing ? (
          <ThemedText variant="label" style={{ color: isDanger ? theme.colors.colorDanger : theme.colors.colorTextSecondary }}>{trailing}</ThemedText>
        ) : (
          <AppIcon icon={ForwardIcon} accessibilityLabel="" size="sm" tone={isDanger ? "danger" : "secondary"} />
        )}
      </PressableScale>
      {!isLast ? <Divider /> : null}
    </>
  );
}
