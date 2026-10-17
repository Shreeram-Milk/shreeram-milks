import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, { Easing, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { motion } from "../../theme/motion";
import { useTheme } from "../../theme";

// Same picture and width as the native splash (app.json), so the hand-over has no jump.
const SPLASH_LOGO_WIDTH = 200;
const HOLD_MS = 120;

/**
 * Picks up exactly where the phone's own splash screen ends: the logo gently shrinks and fades while the first screen shows
 * through. Runs once per app start, entirely on the phone; with reduced motion it simply fades.
 */
export function StartupHandoff() {
  const theme = useTheme();
  const [done, setDone] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      HOLD_MS,
      withTiming(1, { duration: motion.duration.slow, easing: Easing.bezier(...motion.easing.accelerate), reduceMotion: ReduceMotion.System }, (finished) => {
        if (finished) runOnJS(setDone)(true);
      }),
    );
  }, [progress]);

  const coverStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - progress.value * 0.1 }] }));
  if (done) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: theme.zIndex.toast, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.colorBackground }, coverStyle]}>
      <Animated.View style={logoStyle}>
        <Image source={require("../../../assets/splash-icon.png")} contentFit="contain" style={{ width: SPLASH_LOGO_WIDTH, height: SPLASH_LOGO_WIDTH }} />
      </Animated.View>
    </Animated.View>
  );
}
