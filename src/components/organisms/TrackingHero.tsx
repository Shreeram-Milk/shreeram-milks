import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { PulseRing } from "../atoms/PulseRing";
import { ThemedText } from "../atoms/ThemedText";
import { useTheme } from "../../theme";
import { motion } from "../../theme/motion";
import { opacity } from "../../theme/opacity";
import type { OrderStatus } from "../../types/orders";

interface TrackingHeroProps {
  status: OrderStatus;
  icon: IconSvgElement;
  headline: string;
  /** When it arrives: the day and window, or "Courier delivery". */
  when: string;
  /** A line under the time for orders that stopped (missed or cancelled). */
  note?: string;
  /** How far along the order is, from 0 to 1. Leave out for orders that stopped: no bar is shown. */
  progress?: number;
}

/** The dark card on top of the tracking screen: what is happening to the order right now, in one glance. */
export function TrackingHero({ headline, icon, note, progress, status, when }: TrackingHeroProps) {
  const theme = useTheme();
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(motion.duration.slow, withTiming(progress ?? 0, { duration: motion.duration.slow * 2, easing: Easing.bezier(...motion.easing.decelerate), reduceMotion: ReduceMotion.System }));
  }, [fill, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const live = status === "placed" || status === "out_for_delivery";
  const badge = status === "delivered" ? theme.colors.colorSuccess : status === "missed" || status === "cancelled" ? theme.colors.colorDanger : theme.colors.colorSelected;
  const barHeight = theme.spacing.xs;

  return (
    <View style={{ gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurfaceHero, ...theme.elevation.card }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <View style={{ width: theme.sizes.avatarLg, height: theme.sizes.avatarLg }}>
          <PulseRing active={live} color={badge} radius={theme.radii.pill} />
          <View style={{ flex: 1, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: badge }}>
            <AppIcon icon={icon} size="lg" tone="onPrimary" accessibilityLabel="" />
          </View>
        </View>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <ThemedText variant="h2" accessibilityRole="header" style={{ color: theme.colors.colorTextInverse }}>{headline}</ThemedText>
          <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextInverse, opacity: opacity.subdued }}>{when}</ThemedText>
        </View>
      </View>
      {progress !== undefined ? (
        <View accessibilityRole="progressbar" accessibilityLabel={headline} accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }} style={{ height: barHeight, borderRadius: theme.radii.pill, overflow: "hidden", backgroundColor: theme.colors.colorTextSecondary }}>
          <Animated.View style={[{ height: barHeight, borderRadius: theme.radii.pill, backgroundColor: badge }, fillStyle]} />
        </View>
      ) : null}
      {note ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextInverse, opacity: opacity.subdued }}>{note}</ThemedText> : null}
    </View>
  );
}
