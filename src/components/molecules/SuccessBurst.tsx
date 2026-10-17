import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming, type SharedValue } from "react-native-reanimated";

import { CheckIcon } from "../../icons/appIcons";
import { successFeedback } from "../../lib/haptics";
import { motion } from "../../theme/motion";
import { useTheme } from "../../theme";
import { AppIcon } from "../atoms/AppIcon";

const SIZE = 120;
const BADGE = 84;
const DOTS = 10;
const BURST_RADIUS = 66;
const BURST_MS = 650;

function BurstDot({ angle, color, progress }: { angle: number; color: string; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value === 0 ? 0 : 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * BURST_RADIUS * progress.value },
      { translateY: Math.sin(angle) * BURST_RADIUS * progress.value },
      { scale: 1 - progress.value * 0.4 },
    ],
  }));
  return <Animated.View style={[{ position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: color }, style]} />;
}

/**
 * The "order placed" moment: the tick springs in, one soft ring spreads out, and a few small dots in the brand colours burst
 * once, with a short double buzz. Everything runs on the phone; with reduced motion it simply appears.
 */
export function SuccessBurst() {
  const theme = useTheme();
  const badge = useSharedValue(0.4);
  const ring = useSharedValue(0);
  const burst = useSharedValue(0);

  useEffect(() => {
    successFeedback();
    badge.value = withSpring(1, { ...motion.spring.pop, reduceMotion: ReduceMotion.System });
    ring.value = withTiming(1, { duration: motion.duration.slow * 2, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.System });
    burst.value = withDelay(motion.duration.fast, withTiming(1, { duration: BURST_MS, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
  }, [badge, burst, ring]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badge.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: 0.9 - ring.value * 0.6, transform: [{ scale: 0.6 + ring.value * 0.55 }] }));
  const colors = [theme.colors.colorHighlight, theme.colors.colorPrimary, theme.colors.colorAccent];

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: theme.colors.colorSuccessTint }, ringStyle]} />
      {Array.from({ length: DOTS }, (_, index) => (
        <BurstDot key={index} angle={(index / DOTS) * Math.PI * 2} color={colors[index % colors.length] ?? theme.colors.colorHighlight} progress={burst} />
      ))}
      <Animated.View style={[{ width: BADGE, height: BADGE, borderRadius: BADGE / 2, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.colorSuccess, ...theme.elevation.lg }, badgeStyle]}>
        <AppIcon icon={CheckIcon} size="lg" tone="onPrimary" accessibilityLabel="" strong />
      </Animated.View>
    </View>
  );
}
