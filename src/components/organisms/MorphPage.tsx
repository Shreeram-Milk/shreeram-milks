import { Image } from "expo-image";
import { useNavigation } from "expo-router";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, { Easing, ReduceMotion, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { remoteImage } from "../../lib/remoteImage";
import { takeMorphOrigin } from "../../lib/morph";
import { useTheme } from "../../theme";

const OPEN_MS = 380;
const CLOSE_MS = 320;
const EASE = Easing.bezier(0.2, 0, 0, 1);

type Props = PropsWithChildren<{
  /** Must match the key the card used (for example `product:<id>`). */
  morphKey: string;
  /** Where the page's main picture sits: its distance from the top, and its height (it is always full width). */
  heroTop: number;
  heroHeight: number;
}>;

/**
 * A page whose main picture flies out of the card that was tapped, the way shopping and food apps do it ("shared element"): only
 * that one picture moves, from the card to the top of the page, while a plain page settles in behind it and the rest of the page
 * rises in as the picture lands. Back reverses it: the page content clears, then the picture flies back into the card.
 *
 * Only a single small picture changes size, so the phone never re-lays-out the page while it moves, and the bottom bar is never
 * covered by a moving page. Opened any other way (a banner, a notification, a card half under the bottom bar) the page slides up.
 * The screen must be shown as a transparent modal with no stack animation, so the list stays visible underneath.
 */
export function MorphPage({ morphKey, heroTop, heroHeight, children }: Props) {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [origin] = useState(() => takeMorphOrigin(morphKey));
  const progress = useSharedValue(0);
  const navigation = useNavigation();
  const closing = useRef(false);

  // One frame for the page to draw itself first, so the movement never stutters while the page is still being built.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      progress.set(withTiming(1, { duration: origin ? OPEN_MS : 260, easing: EASE, reduceMotion: ReduceMotion.System }));
    });
    return () => cancelAnimationFrame(frame);
  }, [origin, progress]);

  // Back (button, gesture or the phone's back key) first plays the way back, then really leaves.
  useEffect(() => {
    return navigation.addListener("beforeRemove", (event) => {
      if (closing.current) return;
      event.preventDefault();
      closing.current = true;
      const leave = () => navigation.dispatch(event.data.action);
      progress.set(withTiming(0, { duration: origin ? CLOSE_MS : 220, easing: EASE, reduceMotion: ReduceMotion.System }, (finished) => {
        if (finished) runOnJS(leave)();
      }));
    });
  }, [navigation, origin, progress]);

  // Opened without a card: the whole page slides up (and back down on Back).
  const slide = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(progress.value, [0, 1], [screenHeight, 0]) }] }));
  // The plain page colour settles in behind the flying picture, so the list behind fades back calmly.
  const backdrop = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, 0.55], [0, 1], "clamp") }));
  // The rest of the page rises in only as the picture lands (and leaves first on the way back).
  const content = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.6, 1], [0, 1], "clamp"),
    transform: [{ translateY: interpolate(progress.value, [0.6, 1], [18, 0], "clamp") }],
  }));
  // The one moving picture: a small leaf view, cheap to resize every frame. It hides once the page's own picture is in place.
  const flyer = useAnimatedStyle(() => {
    if (!origin) return {};
    const p = progress.value;
    return {
      left: interpolate(p, [0, 1], [origin.x, 0]),
      top: interpolate(p, [0, 1], [origin.y, heroTop]),
      width: interpolate(p, [0, 1], [origin.width, screenWidth]),
      height: interpolate(p, [0, 1], [origin.height, heroHeight]),
      borderRadius: interpolate(p, [0, 1], [origin.radius, 0]),
      opacity: p >= 0.999 ? 0 : 1,
    };
  });

  if (!origin) return <Animated.View style={[StyleSheet.absoluteFill, slide]}>{children}</Animated.View>;
  return (
    <>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.colorBackground }, backdrop]} />
      <Animated.View style={[StyleSheet.absoluteFill, content]}>{children}</Animated.View>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", overflow: "hidden", backgroundColor: theme.colors.colorSurfaceMuted }, flyer]}>
        {origin.imageUrl ? <Image source={remoteImage(origin.imageUrl)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
      </Animated.View>
    </>
  );
}
