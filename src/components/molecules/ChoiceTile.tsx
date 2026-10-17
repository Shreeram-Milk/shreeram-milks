import { Pressable, View } from "react-native";

import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { RadioDot } from "../atoms/RadioDot";
import { ThemedText } from "../atoms/ThemedText";
import { CheckIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";

interface ChoiceTileProps {
  title: string;
  detail?: string;
  icon?: IconSvgElement;
  selected: boolean;
  onPress: () => void;
  /** `radio` picks one of several; `checkbox` switches a single option on or off. */
  kind?: "radio" | "checkbox";
  disabled?: boolean;
  /** A short tag such as "Coming soon", shown instead of the selector. */
  tag?: string;
}

/** A half-width option card for two-column choice grids. Matches the selection style used across the app. */
export function ChoiceTile({ detail, disabled = false, icon, kind = "radio", onPress, selected, tag, title }: ChoiceTileProps) {
  const theme = useTheme();
  const checkboxMark = (
    <View style={{ width: theme.spacing.md + theme.spacing.xs, height: theme.spacing.md + theme.spacing.xs, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.sm + 2, borderWidth: selected ? theme.borderWidths.none : theme.borderWidths.medium, borderColor: theme.colors.colorTextDisabled, backgroundColor: selected ? theme.colors.colorTextPrimary : theme.colors.colorTransparent }}>
      {selected ? <AppIcon icon={CheckIcon} size="sm" tone="onPrimary" accessibilityLabel="" /> : null}
    </View>
  );
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={detail ? `${title}, ${detail}` : title}
      accessibilityState={kind === "radio" ? { selected, disabled } : { checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: "45%",
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radii.lg,
        borderWidth: theme.borderWidths.hairline,
        borderColor: selected ? theme.colors.colorTransparent : theme.colors.colorBorder,
        backgroundColor: selected ? theme.colors.colorSurfaceMuted : theme.colors.colorSurface,
        opacity: disabled ? theme.opacity.disabled : pressed ? theme.opacity.subdued : theme.opacity.full,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.sm }}>
        {icon ? <AppIcon icon={icon} size="sm" tone="secondary" accessibilityLabel="" /> : <View />}
        {tag ? (
          <View style={{ paddingHorizontal: theme.spacing.sm, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorSurfaceMuted }}>
            <ThemedText variant="badgeLabel" style={{ color: theme.colors.colorTextSecondary }}>{tag}</ThemedText>
          </View>
        ) : kind === "radio" ? <RadioDot selected={selected} /> : checkboxMark}
      </View>
      <View style={{ gap: theme.spacing.xs }}>
        <ThemedText variant="bodySmall" weight="medium">{title}</ThemedText>
        {detail ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{detail}</ThemedText> : null}
      </View>
    </Pressable>
  );
}
