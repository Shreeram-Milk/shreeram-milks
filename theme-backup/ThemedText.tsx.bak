import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, type TextProps } from 'react-native';

import { fontFamilyForLocale, type FontWeightName, useTheme } from '../../theme';

type TextVariant = 'h1' | 'h2' | 'body' | 'bodySmall' | 'caption' | 'overline' | 'badgeLabel';

interface ThemedTextProps extends TextProps {
  weight?: FontWeightName;
  variant?: TextVariant;
}

const fontWeightByVariant: Record<TextVariant, FontWeightName> = {
  h1: 'extrabold',
  h2: 'bold',
  body: 'regular',
  bodySmall: 'regular',
  caption: 'medium',
  overline: 'semibold',
  badgeLabel: 'semibold',
};

export function ThemedText({ children, style, variant = 'body', weight, ...props }: PropsWithChildren<ThemedTextProps>) {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const locale = i18n.language === 'gu' ? 'gu' : 'en';
  const type = theme.typography[variant];
  const weightName = weight ?? fontWeightByVariant[variant];

  return <Text {...props} style={[{ color: theme.colors.colorTextPrimary, fontSize: type.fontSize, lineHeight: type.lineHeight, fontFamily: fontFamilyForLocale(locale, weightName), fontWeight: locale === 'gu' ? theme.fontWeights[weightName] : undefined }, style]}>{children}</Text>;
}
