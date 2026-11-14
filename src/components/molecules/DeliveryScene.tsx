import { useEffect, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Mask, Path, RadialGradient, Rect, Stop } from "react-native-svg";

import { scenePalettes, sceneCrate, type SceneSky } from "../../theme/illustration";
import { useTheme } from "../../theme";
import { AppIcon } from "../atoms/AppIcon";
import { CheckIcon } from "../../icons/appIcons";

export type SceneState = "scheduled" | "out" | "delivered";

const WIDTH = 60;
const HEIGHT = 72;
const VIEW_BOX = `0 0 ${WIDTH} ${HEIGHT}`;
/** One smooth "ease out" for everything: quick at first, then settling gently into place. */
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);
const STARS: [number, number, number][] = [[9, 12, 0.9], [19, 7, 0.7], [27, 17, 0.6], [51, 9, 0.8], [13, 27, 0.6], [50, 30, 0.7]];

/** One layer of the scene that eases in from an offset (or a faded state) once, when the card appears. */
function Layer({ children, delay = 0, duration = 1200, fromOpacity = 1, fromX = 0, fromY = 0 }: { children: ReactNode; delay?: number; duration?: number; fromOpacity?: number; fromX?: number; fromY?: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: SETTLE, reduceMotion: ReduceMotion.System }), ReduceMotion.System);
  }, [delay, duration, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: fromOpacity + (1 - fromOpacity) * progress.value,
    transform: [{ translateX: fromX * (1 - progress.value) }, { translateY: fromY * (1 - progress.value) }],
  }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

const layerSvg = (children: ReactNode) => <Svg width="100%" height="100%" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">{children}</Svg>;

/**
 * A small landscape that tells where today's delivery stands: the sky follows the time of day, the sun rises (or sets, in the
 * evening) from behind the hills once, the rider rides toward the house when the order is on the way, and a tick appears when
 * it is delivered. It plays once and then rests; with "reduce motion" on, the still picture shows. Purely decorative: the card
 * around it says everything in words.
 */
export function DeliveryScene({ sky, state }: { sky: SceneSky; state: SceneState }) {
  const theme = useTheme();
  const palette = scenePalettes[sky];
  const { x, y, r } = palette.orb;
  const badge = useSharedValue(0);
  useEffect(() => {
    badge.value = state === "delivered" ? withDelay(1100, withSpring(1, { damping: 12, stiffness: 220, reduceMotion: ReduceMotion.System }), ReduceMotion.System) : 0;
  }, [badge, state]);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badge.value }] }));

  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ width: WIDTH, height: HEIGHT }}>
      <View style={{ width: WIDTH, height: HEIGHT, overflow: "hidden", borderTopLeftRadius: WIDTH / 2, borderTopRightRadius: WIDTH / 2, borderBottomLeftRadius: theme.radii.md, borderBottomRightRadius: theme.radii.md, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
        {layerSvg(
          <>
            <Defs>
              <LinearGradient id="sceneSky" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.sky[0]} />
                <Stop offset="0.6" stopColor={palette.sky[1]} />
                <Stop offset="1" stopColor={palette.sky[2]} />
              </LinearGradient>
            </Defs>
            <Rect width={WIDTH} height={HEIGHT} fill="url(#sceneSky)" />
          </>,
        )}
        {palette.moon ? <Layer delay={200} duration={1400} fromOpacity={0}>{layerSvg(STARS.map(([cx, cy, size]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={size} fill={palette.moon} />))}</Layer> : null}
        <Layer delay={100} duration={1900} fromY={sky === "evening" ? -14 : sky === "morning" ? 26 : 10} fromOpacity={sky === "morning" || sky === "evening" ? 1 : 0.3}>
          {layerSvg(
            <>
              <Defs>
                <RadialGradient id="sceneGlow">
                  <Stop offset="0" stopColor={palette.glow} stopOpacity={palette.moon ? 0.35 : 0.85} />
                  <Stop offset="1" stopColor={palette.glow} stopOpacity={0} />
                </RadialGradient>
                {palette.sun ? (
                  <RadialGradient id="sceneSun" cx="0.42" cy="0.4">
                    <Stop offset="0" stopColor={palette.sun[0]} />
                    <Stop offset="0.55" stopColor={palette.sun[1]} />
                    <Stop offset="1" stopColor={palette.sun[2]} />
                  </RadialGradient>
                ) : null}
                {palette.moon ? (
                  <Mask id="sceneMoon">
                    <Rect width={WIDTH} height={HEIGHT} fill="#FFFFFF" />
                    <Circle cx={x + r * 0.55} cy={y - r * 0.35} r={r * 0.85} fill="#000000" />
                  </Mask>
                ) : null}
              </Defs>
              <Circle cx={x} cy={y} r={palette.moon ? 16 : r * 2.9} fill="url(#sceneGlow)" />
              {palette.moon ? <Circle cx={x} cy={y} r={r} fill={palette.moon} mask="url(#sceneMoon)" /> : <Circle cx={x} cy={y} r={r} fill="url(#sceneSun)" />}
            </>,
          )}
        </Layer>
        <Layer duration={1200} fromY={4}>{layerSvg(<Path d="M0 52C10 46 20 45 30 48S50 45 60 47V72H0Z" fill={palette.farHill} />)}</Layer>
        <Layer delay={60} duration={1200} fromY={8}>
          {layerSvg(
            <>
              <Path d="M0 60C12 54 26 55 38 58S55 57 60 56V72H0Z" fill={palette.nearHill} />
              <G transform="translate(44 47)">
                <Rect y={3} width={11} height={8} rx={0.6} fill={palette.wall} />
                <Path d="M-1.5 3.6 5.5 -2.2 12.5 3.6Z" fill={palette.roof} />
                <Rect x={1.8} y={5} width={2.8} height={2.6} rx={0.4} fill={palette.pane} />
                <Rect x={6.6} y={6} width={2.6} height={5} rx={0.4} fill={palette.roof} />
              </G>
            </>,
          )}
        </Layer>
        {state === "out" ? (
          <Layer delay={400} duration={2100} fromX={-34}>
            {layerSvg(
              <G transform="translate(20 57)">
                <Circle cx={2.5} cy={0} r={2} fill={palette.ink} />
                <Circle cx={11} cy={0} r={2} fill={palette.ink} />
                <Path d="M2.5 -2.2h6.5l2-4.3" fill="none" stroke={palette.ink} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
                <Rect x={-0.6} y={-6.6} width={4.6} height={3.6} rx={0.8} fill={sceneCrate} />
                <Path d="M7.4 -7 6.2 -3" stroke={palette.ink} strokeWidth={2.2} strokeLinecap="round" />
                <Circle cx={7.6} cy={-8.9} r={1.6} fill={palette.ink} />
              </G>,
            )}
          </Layer>
        ) : null}
        {sky === "morning" ? <Layer duration={1700} fromOpacity={1}><DimDawn /></Layer> : null}
      </View>
      {state === "delivered" ? (
        <Animated.View style={[{ position: "absolute", right: -6, bottom: -6, width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, borderWidth: 2.5, borderColor: theme.colors.colorSurface, backgroundColor: theme.colors.colorSuccess }, badgeStyle]}>
          <AppIcon icon={CheckIcon} accessibilityLabel="" size="sm" color={theme.colors.colorTextInverse} strong />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** At dawn the sky starts a little darker and brightens as the sun comes up. */
function DimDawn() {
  const theme = useTheme();
  const fade = useSharedValue(0.4);
  useEffect(() => { fade.value = withTiming(0, { duration: 1700, easing: SETTLE, reduceMotion: ReduceMotion.System }); }, [fade]);
  const style = useAnimatedStyle(() => ({ opacity: fade.value }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.colorSurfaceHero }, style]} />;
}
