import type { PropsWithChildren } from "react";
import { Pressable, View } from "react-native";

import { ForwardIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";
import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { IconBadge } from "../atoms/IconBadge";
import { ThemedText } from "../atoms/ThemedText";

interface ListRowProps {
  /** A short tag on the right, such as "Soon". */
  badge?: string;
  disabled?: boolean;
  icon?: IconSvgElement;
  isLast?: boolean;
  onPress?: () => void;
  /** `radio` makes the row a single choice among several; `chevron` makes it a link. */
  trailing?: "chevron" | "radio" | "none";
  selected?: boolean;
  subtitle?: string;
  title: string;
}

/** One tappable row inside a `ListCard`: an optional icon, a title with a line under it, and a chevron or radio mark. */
export function ListRow({ badge, disabled = false, icon, isLast = false, onPress, selected = false, subtitle, title, trailing = "chevron" }: ListRowProps) {
  const theme = useTheme();
  const isRadio = trailing === "radio";
  return (
    <Pressable
      accessibilityRole={isRadio ? "radio" : "button"}
      accessibilityState={{ disabled, selected: isRadio ? selected : undefined }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: theme.sizes.avatarLg + theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: isLast ? theme.borderWidths.none : theme.borderWidths.hairline,
        borderBottomColor: theme.colors.colorBorder,
        backgroundColor: selected ? theme.colors.colorSurfaceSelected : theme.colors.colorSurface,
        opacity: disabled ? theme.opacity.subdued : pressed ? theme.opacity.subdued : theme.opacity.full,
      })}
    >
      {icon ? <IconBadge icon={icon} tone={disabled ? "neutral" : "primary"} /> : null}
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <ThemedText variant="body" weight="semibold">{title}</ThemedText>
        {subtitle ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{subtitle}</ThemedText> : null}
      </View>
      {badge ? (
        <View style={{ borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, backgroundColor: theme.colors.colorSurfaceMuted }}>
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{badge}</ThemedText>
        </View>
      ) : null}
      {trailing === "chevron" && !disabled ? <AppIcon icon={ForwardIcon} accessibilityLabel="" size="sm" tone="secondary" /> : null}
      {isRadio ? (
        <View style={{ width: theme.spacing.lg, height: theme.spacing.lg, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center", borderWidth: theme.borderWidths.hairline * 2, borderColor: selected ? theme.colors.colorAccent : theme.colors.colorBorder }}>
          {selected ? <View style={{ width: theme.spacing.sm, height: theme.spacing.sm, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorPrimary }} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/** The rounded white card that holds a group of `ListRow`s. */
export function ListCard({ children }: PropsWithChildren) {
  const theme = useTheme();
  return <View style={{ overflow: "hidden", borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface, ...theme.elevation.card }}>{children}</View>;
}
