import type { PropsWithChildren } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, FadeInDown, ReduceMotion } from "react-native-reanimated";

import { motion } from "../../theme/motion";

interface RiseInProps {
  /** Position in a group of cards: each one starts a little after the one above it. Items past the first screenful just appear. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fades and lifts its content into place once, when it first mounts. Lists keep their items mounted, so a refresh or scrolling
 * back never replays it. Does nothing when the phone asks for reduced motion.
 */
export function RiseIn({ children, index = 0, style }: PropsWithChildren<RiseInProps>) {
  if (index >= motion.stagger.maxItems) return <View style={style}>{children}</View>;
  const entering = FadeInDown.delay(index * motion.stagger.stepMs)
    .duration(motion.duration.enter)
    .easing(Easing.bezier(...motion.easing.decelerate))
    .withInitialValues({ opacity: 0, transform: [{ translateY: motion.entranceOffset }] })
    .reduceMotion(ReduceMotion.System);
  return <Animated.View entering={entering} style={style}>{children}</Animated.View>;
}
