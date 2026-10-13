import { createContext, type PropsWithChildren } from 'react';

import { borderWidths } from './borders';
import { elevation } from './elevation';
import { fontWeights, typeScale } from './typography';
import { iconColors, semantic } from './semantic';
import { layout } from './layout';
import { motion } from './motion';
import { opacity } from './opacity';
import { radii } from './radii';
import { componentSizes } from './sizes';
import { spacing } from './spacing';
import { zIndex } from './zIndex';

export const theme = {
  colors: semantic,
  icons: iconColors,
  spacing,
  radii,
  borderWidths,
  sizes: componentSizes,
  typography: typeScale,
  fontWeights,
  opacity,
  motion,
  elevation,
  zIndex,
  layout,
} as const;

export type Theme = typeof theme;

export const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
