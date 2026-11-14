import { primitives } from './primitives';

/**
 * Brand refresh: near-black ink carries every action (white text on it is easy to read). Saffron, the logo's orange, is the
 * signature for graphics, icons and highlights; a deeper saffron is used when orange is text. Pages are milk-white so white
 * cards lift without heavy shadows.
 *
 * Before the refresh: orange was the brand and meant "do this": main buttons, ADD, the active tab. Mint is the second colour for fresh, good news
 * (next delivery, active, chosen). Marigold is a small accent for offers, savings, "new" and paused. Everything else is white
 * and warm neutrals, so the few coloured things stand out.
 */
export const semantic = {
  // The bottom bar is dark so it reads as the app's frame.
  colorNavigation: primitives.neutral900,
  colorNavigationText: primitives.neutral300,
  colorNavigationActive: primitives.white,
  // The solid primary is deliberately darker than the fresh interaction orange so white labels remain comfortably readable.
  colorPrimary: primitives.ink900,
  colorPrimaryPressed: primitives.black,
  colorPrimaryTint: primitives.orange50,
  // The brand's own colour, for graphics only (never behind text), its text-safe deeper shade, and its soft tint.
  colorBrand: primitives.saffron500,
  colorBrandText: primitives.saffron700,
  colorBrandTint: primitives.orange50,
  // The floating bottom bar: white, with a soft saffron pill behind the chosen tab.
  // Something chosen (a filter, a date): a soft saffron fill and a saffron outline. The text keeps its own colour, never white on black.
  colorSelection: primitives.orange50,
  colorSelectionBorder: primitives.saffron700,
  // Selected text in a text box: a light saffron wash, never a dark fill. The cursor and selection handles are the deeper saffron.
  colorTextSelection: primitives.saffronSelection,
  colorCursor: primitives.saffron700,
  colorTabBar: primitives.white,
  colorTabIndicator: primitives.orange50,
  colorTabIconActive: primitives.saffron700,
  colorTabText: primitives.neutral600,
  colorTabTextActive: primitives.ink900,
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
  colorTextPrimary: primitives.ink900,
  colorTextSecondary: primitives.neutral600,
  colorTextDisabled: primitives.neutral400,
  colorTextInverse: primitives.white,
  colorBorder: primitives.neutral200,
  colorBorderFocus: primitives.ink900,
  colorBorderError: primitives.red600,
  colorSurface: primitives.white,
  colorSurfaceSecondary: primitives.white,
  colorSurfaceMuted: primitives.neutral100,
  colorSurfaceSelected: primitives.mint50,
  colorSurfaceInformational: primitives.mint50,
  // The tracking banner: dark like the bottom bar, so its white text is easy to read.
  colorSurfaceHero: primitives.neutral900,
  colorSurfaceDisabled: primitives.neutral150,
  colorBackground: primitives.milk50,
  // The warm square behind product photos.
  colorSurfaceTile: primitives.tile100,
  colorOrderHistoryBackground: primitives.orange25,
  colorSkeleton: primitives.neutral100,
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
