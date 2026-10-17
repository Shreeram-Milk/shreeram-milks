import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";

import { motion } from "../../theme/motion";

interface PulseRingProps {
  color: string;
  radius: number;
  /** Stops the ripple (for a finished step) without removing the ring's space. */
  active?: boolean;
}

const RIPPLE_MS = motion.duration.slow * 4;
const RIPPLE_SCALE = 1.9;

/** A soft ripple that keeps spreading out of whatever it sits behind. Put it first inside a positioned parent. */
export function PulseRing({ active = true, color, radius }: PulseRingProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) { cancelAnimation(progress); progress.value = 0; return; }
    progress.value = 0;
    progress.value = withDelay(motion.duration.slow, withRepeat(withTiming(1, { duration: RIPPLE_MS, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.System }), -1, false, undefined, ReduceMotion.System));
    return () => cancelAnimation(progress);
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: active ? 0.45 * (1 - progress.value) : 0,
    transform: [{ scale: 1 + (RIPPLE_SCALE - 1) * progress.value }],
  }));

  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: color }, style]} />;
}
