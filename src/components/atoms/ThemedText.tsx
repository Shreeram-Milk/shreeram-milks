import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { fontFamilyForLocale, gujaratiText, type FontWeightName, useTheme } from '../../theme';

export type TextVariant = 'display' | 'h1' | 'h2' | 'body' | 'bodySmall' | 'label' | 'caption' | 'overline' | 'badgeLabel';

interface ThemedTextProps extends TextProps {
  weight?: FontWeightName;
  variant?: TextVariant;
}

const fontWeightByVariant: Record<TextVariant, FontWeightName> = {
  display: 'extrabold',
  h1: 'bold',
  h2: 'bold',
  body: 'regular',
  bodySmall: 'regular',
  label: 'semibold',
  caption: 'medium',
  overline: 'bold',
  badgeLabel: 'bold',
};

/** Gujarati letters are taller than Latin ones: give them more line height and a 12px floor, whatever size the caller set. */
function gujaratiMetrics(style: TextStyle) {
  const fontSize = Math.max(style.fontSize ?? gujaratiText.minFontSize, gujaratiText.minFontSize);
  const lineHeight = Math.max(style.lineHeight ?? 0, Math.round(fontSize * gujaratiText.lineHeightRatio));
  return { fontSize, lineHeight, letterSpacing: 0, textTransform: 'none' as const };
}

// Any Gujarati letter in a plain string (a Gujarati product name in the English app, "ગુજરાતી" on the language screen).
const GUJARATI_SCRIPT = /[઀-૿]/;

export function ThemedText({ children, style, variant = 'body', weight, ...props }: PropsWithChildren<ThemedTextProps>) {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const locale = i18n.language === 'gu' || (typeof children === 'string' && GUJARATI_SCRIPT.test(children)) ? 'gu' : 'en';
  const type = theme.typography[variant];
  const weightName = weight ?? fontWeightByVariant[variant];
  const base: TextStyle = { color: theme.colors.colorTextPrimary, fontSize: type.fontSize, lineHeight: type.lineHeight, fontFamily: fontFamilyForLocale(locale, weightName) };
  const merged = StyleSheet.flatten([base, style]);
  // Weight comes from the font file itself; a fontWeight on top makes Android fake a bolder face.
  const finalStyle: TextStyle = locale === 'gu' ? { ...merged, ...gujaratiMetrics(merged), fontWeight: undefined } : { ...merged, fontWeight: undefined };

  return <Text {...props} style={finalStyle}>{children}</Text>;
}
