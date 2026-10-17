import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { CloseIcon, SearchIcon } from "../../icons/appIcons";
import { useAppStore } from "../../store/useAppStore";
import { fontFamilyForLocale, useTheme } from "../../theme";
import { AppIcon } from "../atoms/AppIcon";
import { fieldChrome } from "../atoms/AppInput";

interface SearchFieldProps {
  clearLabel: string;
  label: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  value: string;
}

/** A rounded search box with a magnifier and a clear button that appears once something is typed. */
export function SearchField({ clearLabel, label, onChangeText, placeholder, value }: SearchFieldProps) {
  const theme = useTheme();
  const language = useAppStore((state) => state.language);
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        minHeight: theme.sizes.inputHeight,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        ...fieldChrome(theme, { focused }),
      }}
    >
      <AppIcon icon={SearchIcon} accessibilityLabel="" size="sm" tone="secondary" />
      <TextInput
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.colorTextDisabled}
        returnKeyType="search"
        selectionColor={theme.colors.colorPrimary}
        style={{ flex: 1, color: theme.colors.colorTextPrimary, fontFamily: fontFamilyForLocale(language), fontSize: theme.typography.body.fontSize, paddingVertical: theme.spacing.sm }}
        value={value}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel={clearLabel} hitSlop={theme.spacing.sm} onPress={() => onChangeText("")}>
          <AppIcon icon={CloseIcon} accessibilityLabel="" size="sm" tone="secondary" />
        </Pressable>
      ) : null}
    </View>
  );
}
