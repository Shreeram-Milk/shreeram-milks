import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';

import { useTheme } from '../../theme';

type IconSize = 'sm' | 'md' | 'lg';
type IconTone = 'primary' | 'secondary' | 'onPrimary' | 'disabled' | 'success' | 'warning' | 'danger' | 'brand' | 'accent' | 'highlight';

interface AppIconProps {
  icon: IconSvgElement;
  size?: IconSize;
  tone?: IconTone;
  accessibilityLabel: string;
  /** Slightly heavier stroke, used for the active tab so it reads as "filled". */
  strong?: boolean;
  /** A theme colour for icons on special surfaces (the dark bottom bar); otherwise tone decides. */
  color?: string;
}

export type { IconSvgElement, IconTone };

export function AppIcon({ accessibilityLabel, color, icon, size = 'md', strong = false, tone = 'primary' }: AppIconProps) {
  const theme = useTheme();
  const iconSize = size === 'sm' ? theme.sizes.iconSm : size === 'lg' ? theme.sizes.iconLg : theme.sizes.iconMd;
  const colorByTone: Record<IconTone, string> = {
    primary: theme.icons.iconPrimary,
    secondary: theme.icons.iconSecondary,
    onPrimary: theme.icons.iconOnPrimary,
    disabled: theme.icons.iconDisabled,
    success: theme.colors.colorSuccess,
    warning: theme.colors.colorWarning,
    danger: theme.colors.colorDanger,
    brand: theme.colors.colorPrimary,
    accent: theme.colors.colorAccent,
    highlight: theme.colors.colorHighlightText,
  };

  return <HugeiconsIcon accessibilityLabel={accessibilityLabel} icon={icon} size={iconSize} color={color ?? colorByTone[tone]} strokeWidth={strong ? theme.sizes.iconStrokeWidth + 0.5 : theme.sizes.iconStrokeWidth} />;
}
