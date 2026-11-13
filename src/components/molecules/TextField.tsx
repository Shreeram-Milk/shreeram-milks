import { forwardRef, useEffect, useState } from "react";
import { Pressable, TextInput, useWindowDimensions, View, type TextInputProps } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { CheckIcon, CloseIcon } from "../../icons/appIcons";
import { fontFamilyForLocale, gujaratiText, useTheme } from "../../theme";
import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { AppInput, FIELD_BORDER, FIELD_HEIGHT } from "../atoms/AppInput";
import { ThemedText } from "../atoms/ThemedText";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  /** Optional small leading icon. */
  icon?: IconSvgElement;
  /** Shown under the field in red; also turns the field red. */
  error?: string;
  /** Shown under the field when there is no error. */
  helper?: string;
  /** Shows a green tick on the right: the value is accepted. */
  valid?: boolean;
}

/** The label moves to the outline while the field has focus or a value. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({ label, icon, error, helper, valid = false, value, defaultValue, editable = true, multiline = false, onFocus, onBlur, onChangeText, placeholder, ...props }, ref) {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const locale = i18n.language === "gu" ? "gu" : "en";
  const [focused, setFocused] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const floated = focused || Boolean(value ?? uncontrolledValue);
  const progress = useSharedValue(floated ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(floated ? 1 : 0, { duration: theme.motion.duration.fast, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.System });
  }, [floated, progress, theme.motion.duration.fast]);

  const hasError = Boolean(error);
  const fill = editable ? theme.colors.colorSurface : theme.colors.colorSurfaceMuted;
  const labelColor = hasError ? theme.colors.colorDanger : focused ? theme.colors.colorTextPrimary : theme.colors.colorTextSecondary;
  const borderColor = hasError ? theme.colors.colorBorderError : focused ? theme.colors.colorTextPrimary : FIELD_BORDER;
  const clear = focused && Boolean(value) && editable && !multiline && Boolean(onChangeText);
  const labelSize = theme.typography.body.fontSize;
  const lineHeight = locale === "gu" ? Math.round(labelSize * gujaratiText.lineHeightRatio) : theme.typography.body.lineHeight;
  const scaledLineHeight = lineHeight * (props.allowFontScaling === false ? 1 : Math.min(fontScale, props.maxFontSizeMultiplier || fontScale));
  const fieldHeight = Math.max(FIELD_HEIGHT, scaledLineHeight + theme.spacing.md * 2);
  const labelTop = multiline ? theme.spacing.md : (fieldHeight - scaledLineHeight) / 2;
  const labelShift = labelTop + scaledLineHeight / 2;
  const labelMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: -labelShift * progress.value }, { scale: 1 - 0.22 * progress.value }],
  }));

  return (
    <View style={{ gap: theme.spacing.xs + 2, paddingTop: Math.ceil(scaledLineHeight / 2) }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md - theme.borderWidths.hairline, borderRadius: theme.radii.md, borderWidth: theme.borderWidths.hairline, borderColor, backgroundColor: fill }}>
        {icon ? <AppIcon icon={icon} accessibilityLabel="" size="sm" tone="secondary" /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppInput
            ref={ref}
            bare
            accessibilityLabel={label}
            value={value}
            defaultValue={defaultValue}
            editable={editable}
            multiline={multiline}
            onChangeText={(next) => {
              if (value === undefined) setUncontrolledValue(next);
              onChangeText?.(next);
            }}
            onFocus={(event) => { setFocused(true); onFocus?.(event); }}
            onBlur={(event) => { setFocused(false); onBlur?.(event); }}
            placeholder={placeholder}
            placeholderTextColor={floated ? theme.colors.colorTextDisabled : theme.colors.colorTransparent}
            style={{ minHeight: multiline ? Math.max(104, fieldHeight) : fieldHeight, paddingHorizontal: 0, paddingVertical: theme.spacing.md, lineHeight, textAlignVertical: multiline ? "top" : "center", color: editable ? theme.colors.colorTextPrimary : theme.colors.colorTextSecondary }}
            {...props}
          />
          <Animated.Text
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            numberOfLines={1}
            allowFontScaling={props.allowFontScaling}
            maxFontSizeMultiplier={props.maxFontSizeMultiplier}
            style={[{ position: "absolute", left: -theme.spacing.xs, top: labelTop, maxWidth: "100%", paddingHorizontal: theme.spacing.xs, fontSize: labelSize, lineHeight, color: labelColor, fontFamily: fontFamilyForLocale(locale, "medium"), backgroundColor: fill, transformOrigin: "left center" }, labelMotion]}
          >
            {label}
          </Animated.Text>
        </View>
        {clear ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t("commonActions.clearField", { field: label })} hitSlop={theme.spacing.sm} onPress={() => onChangeText?.("")} style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
            <AppIcon icon={CloseIcon} accessibilityLabel="" size="sm" tone="secondary" />
          </Pressable>
        ) : valid && Boolean(value ?? uncontrolledValue) && !hasError ? <AppIcon icon={CheckIcon} accessibilityLabel="" size="sm" tone="success" /> : null}
      </View>
      {hasError ? <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger, marginLeft: theme.spacing.sm }}>{error}</ThemedText> : helper ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, marginLeft: theme.spacing.sm }}>{helper}</ThemedText> : null}
    </View>
  );
});
