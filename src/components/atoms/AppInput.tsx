import { forwardRef, useState } from 'react';
import { TextInput, type TextInputProps, type ViewStyle } from 'react-native';

import { fontFamilyForLocale, useTheme, type Theme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

/** Corner radius and height every field shares, so text fields, the phone field, search and the code boxes match. */
export const FIELD_RADIUS = 14;
export const FIELD_HEIGHT = 54;

/** A visible but soft outline for a resting field: darker than the page's cream lines so a white field reads clearly. */
export const FIELD_BORDER = '#D8D3C6';

/**
 * The look of one field in each state: always white with a rounded outline. Resting: a soft grey-beige outline. Focused: the
 * orange outline. Error: a red outline. Only the outline colour changes, never the size or the layers, so tapping a field
 * cannot disturb the text input (changing shadows or elevation on focus can make Android drop the keyboard). One place, so
 * every field in the app changes together.
 */
export function fieldChrome(theme: Theme, state: { focused?: boolean; error?: boolean }): ViewStyle {
  const { focused = false, error = false } = state;
  return {
    borderRadius: FIELD_RADIUS,
    borderWidth: 1.5,
    borderColor: error ? theme.colors.colorBorderError : focused ? theme.colors.colorBorderFocus : FIELD_BORDER,
    backgroundColor: theme.colors.colorSurface,
  };
}

interface AppInputProps extends TextInputProps {
  hasError?: boolean;
  /** No fill or outline of its own: for a field that sits inside a wrapper which draws them (for example the phone field). */
  bare?: boolean;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput({ bare = false, hasError = false, onBlur, onFocus, style, ...props }, ref) {
  const theme = useTheme();
  const language = useAppStore((state) => state.language);
  const [isFocused, setIsFocused] = useState(false);
  const text = { color: theme.colors.colorTextPrimary, fontFamily: fontFamilyForLocale(language), fontSize: theme.typography.body.fontSize, lineHeight: theme.typography.body.lineHeight };

  return (
    <TextInput
      ref={ref}
      {...props}
      onBlur={(event) => { setIsFocused(false); onBlur?.(event); }}
      onFocus={(event) => { setIsFocused(true); onFocus?.(event); }}
      placeholderTextColor={props.placeholderTextColor ?? theme.colors.colorTextDisabled}
      selectionColor={theme.colors.colorPrimary}
      style={[bare ? { minHeight: FIELD_HEIGHT, paddingHorizontal: theme.spacing.sm } : { minHeight: FIELD_HEIGHT, paddingHorizontal: theme.spacing.md, ...fieldChrome(theme, { focused: isFocused, error: hasError }) }, text, style]}
    />
  );
});
