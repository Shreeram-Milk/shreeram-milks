import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Easing, View } from "react-native";

import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { HelpIcon, ProductsIcon } from "../../icons/appIcons";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { useTheme } from "../../theme";

interface StateMessageProps {
  actionLabel?: string;
  description?: string;
  icon?: IconSvgElement;
  onAction?: () => void;
  title: string;
  type: "empty" | "error" | "loading";
}

export function StateMessage({
  actionLabel,
  description,
  icon,
  onAction,
  title,
  type,
}: StateMessageProps) {
  const theme = useTheme();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: theme.motion.duration.fast,
      easing: Easing.bezier(...theme.motion.easing.decelerate),
      useNativeDriver: true,
    }).start();
  }, [
    progress,
    theme.motion.duration.fast,
    theme.motion.easing.decelerate,
    title,
    type,
  ]);

  return (
    <Animated.View
      style={{
        alignItems: "center",
        paddingVertical: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [theme.motion.entranceOffset, 0],
            }),
          },
        ],
      }}
    >
      {type === "loading" ? (
        <ActivityIndicator color={theme.colors.colorPrimary} />
      ) : (
        <View
          style={{
            width: theme.sizes.avatarMd,
            height: theme.sizes.avatarMd,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: theme.radii.pill,
            backgroundColor:
              type === "error"
                ? theme.colors.colorDangerTint
                : theme.colors.colorPrimaryTint,
          }}
        >
          <AppIcon icon={icon ?? (type === "error" ? HelpIcon : ProductsIcon)} accessibilityLabel="" tone="primary" />
        </View>
      )}
      <ThemedText
        variant="bodySmall"
        weight="medium"
        style={{
          color: theme.colors.colorTextSecondary,
          textAlign: "center",
        }}
      >
        {title}
      </ThemedText>
      {description ? (
        <ThemedText
          variant="caption"
          style={{
            color: theme.colors.colorTextDisabled,
            textAlign: "center",
          }}
        >
          {description}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="secondary" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Animated.View>
  );
}
