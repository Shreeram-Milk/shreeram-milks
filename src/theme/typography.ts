export const fontWeights = { regular: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' } as const;

/** The only text sizes in the app. Gujarati text gets extra line height in ThemedText because its letters are taller. */
export const typeScale = {
  display: { fontSize: 28, lineHeight: 34, weight: fontWeights.extrabold },
  h1: { fontSize: 22, lineHeight: 28, weight: fontWeights.bold },
  h2: { fontSize: 18, lineHeight: 24, weight: fontWeights.bold },
  body: { fontSize: 16, lineHeight: 22, weight: fontWeights.regular },
  bodySmall: { fontSize: 14, lineHeight: 20, weight: fontWeights.regular },
  label: { fontSize: 13, lineHeight: 18, weight: fontWeights.semibold },
  caption: { fontSize: 12, lineHeight: 16, weight: fontWeights.medium },
  overline: { fontSize: 11, lineHeight: 14, weight: fontWeights.bold },
  badgeLabel: { fontSize: 11, lineHeight: 14, weight: fontWeights.bold },
} as const;

/** Gujarati script needs taller lines and never goes below 12px. */
export const gujaratiText = { lineHeightRatio: 1.5, minFontSize: 12 } as const;
