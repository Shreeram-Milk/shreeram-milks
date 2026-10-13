import { primitives } from './primitives';

export const semantic = {
  colorNavigation: primitives.warm900,
  // The solid primary is deliberately darker than the fresh interaction
  // orange so white labels remain comfortably readable.
  colorPrimary: primitives.orange900,
  colorPrimaryPressed: primitives.orange700,
  colorPrimaryTint: primitives.orange100,
  colorSelected: primitives.orange600,
  colorSelectedTint: primitives.orange100,
  colorDanger: primitives.red600,
  colorDangerPressed: primitives.red600, // TODO: add a confirmed pressed red ramp step.
  colorDangerTint: primitives.red100,
  colorSuccess: primitives.green800,
  colorSuccessTint: primitives.green100,
  colorWarning: primitives.amber600,
  colorWarningTint: primitives.amber100,
  colorInfo: primitives.blue600,
  colorInfoTint: primitives.blue100,
  colorTextPrimary: primitives.neutral900,
  colorTextSecondary: primitives.neutral600,
  colorTextDisabled: primitives.neutral400,
  colorTextInverse: primitives.white,
  colorBorder: primitives.neutral200,
  colorBorderFocus: primitives.orange900,
  colorBorderError: primitives.red600,
  colorSurface: primitives.white,
  colorSurfaceSecondary: primitives.neutral50,
  colorSurfaceMuted: primitives.neutral100,
  colorSurfaceSelected: primitives.orange100,
  colorSurfaceInformational: primitives.blue100,
  colorSurfaceHero: primitives.warm900,
  colorSurfaceDisabled: primitives.neutral150,
  colorBackground: primitives.neutral50,
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
