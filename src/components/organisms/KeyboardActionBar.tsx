import type { PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';

/**
 * How far a form keeps a focused field above the action bar, for `KeyboardAwareScrollView`'s `bottomOffset`: one button plus
 * the bar's small padding, so the field is never hidden behind the bar or the keyboard.
 */
export const ACTION_BAR_SPACE = 84;

/**
 * The main action of a screen with fields (Save, Continue, Send). It sits at the bottom of the screen and rides up on top of the
 * keyboard while one is open, with only a small gap above it.
 *
 * Put it in normal flow at the bottom of a screen whose safe area includes the bottom edge (the default SafeAreaView). The keyboard's
 * height already counts the phone's bottom bar, so that part of the safe area is given back while the keyboard is open: otherwise a
 * band of empty space would sit between the button and the keyboard.
 */
export function KeyboardActionBar({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
      <View style={[{ gap: theme.spacing.sm, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.sm, backgroundColor: theme.colors.colorBackground }, style]}>{children}</View>
    </KeyboardStickyView>
  );
}
