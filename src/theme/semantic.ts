import { primitives } from './primitives';

/**
 * Orange is the brand and means "do this": main buttons, ADD, the active tab. Mint is the second colour for fresh, good news
 * (next delivery, active, chosen). Marigold is a small accent for offers, savings, "new" and paused. Everything else is white
 * and warm neutrals, so the few coloured things stand out.
 */
export const semantic = {
  // The bottom bar is dark so it reads as the app's frame, apart from the white pages above it.
  colorNavigation: primitives.neutral900,
  colorNavigationText: primitives.neutral300,
  colorNavigationActive: primitives.white,
  // The solid primary is deliberately darker than the fresh interaction orange so white labels remain comfortably readable.
  colorPrimary: primitives.orange900,
  colorPrimaryPressed: primitives.orange800,
  colorPrimaryTint: primitives.orange50,
  colorAccent: primitives.mint800,
  colorAccentTint: primitives.mint50,
  colorAccentBorder: primitives.mint200,
  colorHighlight: primitives.marigold400,
  colorHighlightTint: primitives.marigold50,
  colorHighlightText: primitives.marigold800,
  colorOnHighlight: primitives.cocoa900,
  colorSelected: primitives.mint800,
  colorSelectedTint: primitives.mint50,
  colorDanger: primitives.red600,
  colorDangerPressed: primitives.red700,
  colorDangerTint: primitives.red100,
  colorSuccess: primitives.mint800,
  colorSuccessTint: primitives.mint50,
  colorWarning: primitives.marigold800,
  colorWarningTint: primitives.marigold50,
  colorInfo: primitives.mint800,
  colorInfoTint: primitives.mint50,
  colorTextPrimary: primitives.neutral900,
  colorTextSecondary: primitives.neutral600,
  colorTextDisabled: primitives.neutral400,
  colorTextInverse: primitives.white,
  colorBorder: primitives.neutral200,
  colorBorderFocus: primitives.orange900,
  colorBorderError: primitives.red600,
  colorSurface: primitives.white,
  colorSurfaceSecondary: primitives.white,
  colorSurfaceMuted: primitives.neutral100,
  colorSurfaceSelected: primitives.mint50,
  colorSurfaceInformational: primitives.mint50,
  // The tracking banner: dark like the bottom bar, so its white text is easy to read.
  colorSurfaceHero: primitives.neutral900,
  colorSurfaceDisabled: primitives.neutral150,
  colorBackground: primitives.white,
  colorOverlay: primitives.black,
  colorTransparent: primitives.transparent,
} as const;

export type SemanticTheme = typeof semantic;

export const iconColors = {
  iconPrimary: semantic.colorTextPrimary,
  iconSecondary: semantic.colorTextSecondary,
  iconOnPrimary: semantic.colorTextInverse,
  iconDisabled: semantic.colorTextDisabled,
} as const;
