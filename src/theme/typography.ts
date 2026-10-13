export const fontWeights = { regular: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' } as const;

export const typeScale = {
  h1: { fontSize: 26, lineHeight: 32, weight: fontWeights.bold },
  h2: { fontSize: 20, lineHeight: 26, weight: fontWeights.semibold },
  body: { fontSize: 16, lineHeight: 22, weight: fontWeights.regular },
  bodySmall: { fontSize: 14, lineHeight: 20, weight: fontWeights.regular },
  caption: { fontSize: 12, lineHeight: 16, weight: fontWeights.medium },
  overline: { fontSize: 11, lineHeight: 14, weight: fontWeights.semibold },
  badgeLabel: { fontSize: 10, lineHeight: 14, weight: fontWeights.semibold },
} as const;
