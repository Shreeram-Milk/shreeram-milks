import type { PropsWithChildren } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { motion } from "../../theme/motion";

interface PressableScaleProps extends Omit<PressableProps, "style"> {
  /** How far it shrinks while held: cards barely, buttons a little more. */
  pressScale?: number;
  style?: StyleProp<ViewStyle>;
  /** Style for the outer animated wrapper (width, flex, margins). */
  containerStyle?: StyleProp<ViewStyle>;
}

const spring = { ...motion.spring.press, reduceMotion: ReduceMotion.System };

/** The one press feel for the whole app: a quick springy shrink on the UI thread, back on release. */
export function PressableScale({ children, containerStyle, pressScale = motion.pressScale.card, style, onPressIn, onPressOut, ...props }: PropsWithChildren<PressableScaleProps>) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        {...props}
        onPressIn={(event) => {
          scale.set(withSpring(pressScale, spring));
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(withSpring(1, spring));
          onPressOut?.(event);
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
