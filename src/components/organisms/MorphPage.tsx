import { useNavigation } from "expo-router";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, { Easing, ReduceMotion, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { takeMorphOrigin } from "../../lib/morph";

const OPEN_MS = 420;
const CLOSE_MS = 340;
const EASE = Easing.bezier(0.2, 0, 0, 1);

type Props = PropsWithChildren<{
  /** Must match the key the card used (for example `product:<id>`). */
  morphKey: string;
  /** How far down the page its main picture starts (the status bar height when the page keeps it clear). */
  anchorTop?: number;
}>;

/**
 * A page that grows out of the card that opened it: the card's picture scales up into the page's picture while the page opens
 * around it, and shrinks back into the card on Back. No fade. Opened any other way (a banner, a notification) it simply slides up.
 * The screen must be shown as a transparent modal with no stack animation, so the list stays visible underneath while it grows.
 */
export function MorphPage({ morphKey, anchorTop = 0, children }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [origin] = useState(() => takeMorphOrigin(morphKey));
  const progress = useSharedValue(0);
  const navigation = useNavigation();
  const closing = useRef(false);

  useEffect(() => {
    progress.value = withTiming(1, { duration: origin ? OPEN_MS : 260, easing: EASE, reduceMotion: ReduceMotion.System });
  }, [origin, progress]);

  // Back (button, gesture or the phone's back key) first shrinks the page into its card, then really leaves.
  useEffect(() => {
    if (!origin) return;
    return navigation.addListener("beforeRemove", (event) => {
      if (closing.current) return;
      event.preventDefault();
      closing.current = true;
      const leave = () => navigation.dispatch(event.data.action);
      progress.value = withTiming(0, { duration: CLOSE_MS, easing: EASE, reduceMotion: ReduceMotion.System }, (finished) => {
        if (finished) runOnJS(leave)();
      });
    });
  }, [navigation, origin, progress]);

  const frame = useAnimatedStyle(() => {
    if (!origin) return { transform: [{ translateY: interpolate(progress.value, [0, 1], [screenHeight * 0.06, 0]) }] };
    const p = progress.value;
    return {
      left: interpolate(p, [0, 1], [origin.x, 0]),
      top: interpolate(p, [0, 1], [origin.y, 0]),
      width: interpolate(p, [0, 1], [origin.width, screenWidth]),
      height: interpolate(p, [0, 1], [origin.height, screenHeight]),
      borderRadius: interpolate(p, [0, 1], [origin.radius, 0]),
    };
  });

  // The page keeps its full size and is drawn smaller: its picture lands exactly on the card's picture at the start.
  const page = useAnimatedStyle(() => {
    if (!origin) return {};
    const p = progress.value;
    const scale = interpolate(p, [0, 1], [origin.width / screenWidth, 1]);
    return { top: -anchorTop * scale * (1 - p), transform: [{ scale }] };
  });

  if (!origin) return <Animated.View style={[StyleSheet.absoluteFill, frame]}>{children}</Animated.View>;
  return (
    <Animated.View style={[{ position: "absolute", overflow: "hidden" }, frame]}>
      <Animated.View style={[{ position: "absolute", left: 0, width: screenWidth, height: screenHeight, transformOrigin: "0% 0%" }, page]}>{children}</Animated.View>
    </Animated.View>
  );
}
