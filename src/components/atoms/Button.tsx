import type { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { AppIcon, type IconSvgElement } from "./AppIcon";
import { PressableScale } from "./PressableScale";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../../theme";

/** primary: the one orange action on a screen. tonal: a softer orange action. secondary: white with a border. danger: destructive. */
type ButtonVariant = "primary" | "tonal" | "secondary" | "danger";
interface ButtonProps extends Omit<PressableProps, "style"> {
  /** compact: a smaller button for use inside cards, next to other buttons. */
  compact?: boolean;
  icon?: IconSvgElement;
  /** Something already in colour (a brand logo) shown before the label instead of an icon. */
  leading?: ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
}

export function Button({ children, compact = false, disabled = false, icon, leading, loading = false, style, variant = "primary", ...props }: PropsWithChildren<ButtonProps>) {
  const theme = useTheme();
  const colors = theme.colors;
  const isDisabled = disabled || loading;
  const palette =
    variant === "secondary"
      ? { background: colors.colorSurface, border: colors.colorBorder, text: colors.colorTextPrimary }
      : variant === "tonal"
        ? { background: colors.colorPrimaryTint, border: colors.colorPrimary, text: colors.colorPrimary }
        : variant === "danger"
          ? { background: colors.colorDanger, border: colors.colorDanger, text: colors.colorTextInverse }
          : { background: colors.colorPrimary, border: colors.colorPrimary, text: colors.colorTextInverse };
  const onFill = variant === "primary" || variant === "danger";

  return (
    <PressableScale
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      pressScale={theme.motion.pressScale.control}
      containerStyle={[{ alignSelf: "stretch" }, style]}
      style={{
        minHeight: compact ? theme.layout.touchTargetMin - 4 : theme.sizes.buttonHeight + theme.spacing.xs,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
        paddingHorizontal: compact ? theme.spacing.md - 4 : theme.spacing.lg,
        borderRadius: theme.radii.md,
        backgroundColor: palette.background,
        borderColor: palette.border,
        // Only the white secondary button needs an outline; the filled and soft-orange ones stand on their colour.
        borderWidth: variant === "secondary" ? theme.borderWidths.hairline : theme.borderWidths.none,
        opacity: isDisabled && !loading ? theme.opacity.disabled : theme.opacity.full,
      }}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : leading ? (
        <View>{leading}</View>
      ) : icon ? (
        <View>
          <AppIcon icon={icon} accessibilityLabel="" tone={onFill ? "onPrimary" : variant === "tonal" ? "brand" : "primary"} size="sm" />
        </View>
      ) : null}
      <ThemedText numberOfLines={1} variant={compact ? "label" : "body"} weight="bold" style={{ color: palette.text, flexShrink: 1 }}>
        {children}
      </ThemedText>
    </PressableScale>
  );
}
