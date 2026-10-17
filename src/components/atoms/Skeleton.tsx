import { useEffect } from "react";
import type { DimensionValue, StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { useTheme } from "../../theme";

interface SkeletonProps {
  height: DimensionValue;
  width?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

const PULSE_MS = 600;
// Most screens fill in faster than this from saved data, so the grey shapes never flash during a quick page change.
const SHOW_AFTER_MS = 300;
const FADE_IN_MS = 200;

/**
 * A grey placeholder in the shape of content that is still loading. It stays invisible for a short moment and only appears
 * (then gently pulses) when loading really takes a while. With reduced motion it just appears, without pulsing.
 */
export function Skeleton({ height, radius, style, width = "100%" }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      SHOW_AFTER_MS,
      withSequence(
        withTiming(1, { duration: FADE_IN_MS, reduceMotion: ReduceMotion.Never }),
        withRepeat(withTiming(0.5, { duration: PULSE_MS, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.System }), -1, true, undefined, ReduceMotion.System),
      ),
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width, height, borderRadius: radius ?? theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }, animatedStyle, style]} />;
}
