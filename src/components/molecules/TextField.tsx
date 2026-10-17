import { forwardRef, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, TextInput, View, type TextInputProps } from "react-native";

import { AlertCircleIcon, CheckIcon, CloseIcon, LockIcon } from "../../icons/appIcons";
import { useTranslation } from "react-i18next";

import { fontFamilyForLocale, useTheme } from "../../theme";
import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { AppInput, FIELD_RADIUS, fieldChrome } from "../atoms/AppInput";
import { ThemedText } from "../atoms/ThemedText";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  /** A small icon in a rounded tile on the left. */
  icon?: IconSvgElement;
  /** Shown under the field in red; also turns the field red. */
  error?: string;
  /** Shown under the field when there is no error. */
  helper?: string;
  /** Shows a green tick on the right: the value is accepted. */
  valid?: boolean;
}

const HEIGHT = 62;
const LABEL_SHIFT = -11;
const LABEL_SCALE = 0.78;

/**
 * A modern form field. The label sits inside the field and glides up and shrinks when the field is focused or filled, so it is
 * always readable. Resting it is soft grey; focused it turns white with an orange outline and glow; an error turns it red. A clear
 * button shows while typing, a lock when the value cannot be edited, a tick when it is valid. Helper and error text sit below.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({ label, icon, error, helper, valid = false, value, editable = true, multiline = false, onFocus, onBlur, onChangeText, placeholder, ...props }, ref) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  // The floating label is a plain animated Text, so it takes the app's font for the current language explicitly.
  const labelFont = fontFamilyForLocale(i18n.language === "gu" ? "gu" : "en", "semibold");
  const [focused, setFocused] = useState(false);
  const floated = focused || Boolean(value) || !editable;
  const progress = useRef(new Animated.Value(floated ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: floated ? 1 : 0, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [floated, progress]);

  const locked = !editable;
  const hasError = Boolean(error);
  const labelColor = hasError ? theme.colors.colorDanger : focused ? theme.colors.colorPrimary : theme.colors.colorTextSecondary;
  const clear = focused && Boolean(value) && editable && !multiline;
  const tileBackground = hasError ? theme.colors.colorDangerTint : focused ? theme.colors.colorPrimaryTint : theme.colors.colorSurfaceMuted;

  return (
    <View style={{ gap: theme.spacing.xs + 2 }}>
      <View style={[{ minHeight: multiline ? 110 : HEIGHT, flexDirection: "row", alignItems: multiline ? "flex-start" : "center", gap: theme.spacing.sm, paddingHorizontal: theme.spacing.sm, paddingVertical: multiline ? theme.spacing.sm : 0 }, fieldChrome(theme, { focused: focused && !locked, error: hasError }), locked ? { backgroundColor: theme.colors.colorSurfaceMuted } : null]}>
        {icon ? (
          <View style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: FIELD_RADIUS - 4, backgroundColor: tileBackground }}>
            <AppIcon icon={icon} accessibilityLabel="" size="sm" tone={hasError ? "danger" : focused ? "primary" : "secondary"} />
          </View>
        ) : null}
        <View style={{ flex: 1, justifyContent: "center", minHeight: multiline ? 90 : HEIGHT - 6 }}>
          <Animated.Text
            pointerEvents="none"
            numberOfLines={1}
            style={{ pointerEvents: "none", position: "absolute", left: 0, top: multiline ? 8 : (HEIGHT - 6) / 2 - 11, fontSize: theme.typography.body.fontSize, color: labelColor, fontFamily: labelFont, transformOrigin: "left center", transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, LABEL_SHIFT - (multiline ? 0 : 3)] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, LABEL_SCALE] }) }] }}
          >
            {label}
          </Animated.Text>
          <AppInput
            ref={ref}
            bare
            accessibilityLabel={label}
            value={value}
            editable={editable}
            multiline={multiline}
            onChangeText={onChangeText}
            onFocus={(event) => { setFocused(true); onFocus?.(event); }}
            onBlur={(event) => { setFocused(false); onBlur?.(event); }}
            // The hint is always mounted (changing it on focus can disturb the input); it is invisible until the label has moved away.
            placeholder={placeholder}
            placeholderTextColor={floated ? theme.colors.colorTextDisabled : theme.colors.colorTransparent}
            style={{ minHeight: 0, paddingHorizontal: 0, paddingTop: multiline ? 24 : 20, paddingBottom: multiline ? 6 : 4, height: multiline ? undefined : HEIGHT - 6, textAlignVertical: multiline ? "top" : "center", color: locked ? theme.colors.colorTextSecondary : theme.colors.colorTextPrimary }}
            {...props}
          />
        </View>
        {clear ? (
          <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={theme.spacing.sm} onPress={() => onChangeText?.("")} style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: theme.colors.colorSurfaceMuted }}>
            <AppIcon icon={CloseIcon} accessibilityLabel="" size="sm" tone="secondary" />
          </Pressable>
        ) : locked ? <AppIcon icon={LockIcon} accessibilityLabel="" size="sm" tone="disabled" /> : hasError ? <AppIcon icon={AlertCircleIcon} accessibilityLabel="" size="sm" tone="danger" /> : valid && Boolean(value) ? <AppIcon icon={CheckIcon} accessibilityLabel="" size="sm" tone="success" /> : null}
      </View>
      {hasError ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger, marginLeft: theme.spacing.sm }}>{error}</ThemedText> : helper ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, marginLeft: theme.spacing.sm }}>{helper}</ThemedText> : null}
    </View>
  );
});
