import { View } from "react-native";
import Animated, { Easing, FadeIn, ReduceMotion } from "react-native-reanimated";

import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { HelpIcon, ProductsIcon } from "../../icons/appIcons";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { ListSkeleton } from "../molecules/LoadingSkeletons";
import { motion } from "../../theme/motion";
import { useTheme } from "../../theme";

interface StateMessageProps {
  actionLabel?: string;
  description?: string;
  icon?: IconSvgElement;
  onAction?: () => void;
  title: string;
  type: "empty" | "error" | "loading";
}

const appear = FadeIn.duration(motion.duration.normal).easing(Easing.bezier(...motion.easing.decelerate)).reduceMotion(ReduceMotion.System);

/**
 * What a screen shows instead of content. Loading is grey placeholder rows (the title is read out to screen readers), never a
 * spinner; empty and error are a friendly icon, one sentence and at most one button.
 */
export function StateMessage({ actionLabel, description, icon, onAction, title, type }: StateMessageProps) {
  const theme = useTheme();

  if (type === "loading") {
    return (
      <View accessible accessibilityLabel={title} accessibilityLiveRegion="polite" style={{ paddingVertical: theme.spacing.md }}>
        <ListSkeleton count={3} rowHeight={76} />
      </View>
    );
  }

  const isError = type === "error";
  return (
    <Animated.View entering={appear} style={{ alignItems: "center", paddingVertical: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm + 2 }}>
      <View style={{ width: 72, height: 72, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: isError ? theme.colors.colorDangerTint : theme.colors.colorSurfaceMuted }}>
        <AppIcon icon={icon ?? (isError ? HelpIcon : ProductsIcon)} accessibilityLabel="" size="lg" tone={isError ? "danger" : "secondary"} />
      </View>
      <ThemedText variant="body" weight="bold" style={{ textAlign: "center" }}>{title}</ThemedText>
      {description ? <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{description}</ThemedText> : null}
      {actionLabel && onAction ? (
        <Button variant={isError ? "secondary" : "tonal"} style={{ alignSelf: "center", marginTop: theme.spacing.xs }} onPress={onAction}>{actionLabel}</Button>
      ) : null}
    </Animated.View>
  );
}
