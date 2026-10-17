import { primitives } from './primitives';

const shadowColor = primitives.neutral900;

/** Shadows stay soft; cards also carry a hairline border (see Card) so they separate on phones that draw shadows faintly. */
export const elevation = {
  none: { shadowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  sm: { shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  card: { shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
  lg: { shadowColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 },
} as const;
