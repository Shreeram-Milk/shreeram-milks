import { useId, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { PanResponder, StyleSheet, View } from "react-native";
import Animated, { Easing, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Mask, Path, Rect, Stop, Text as SvgText } from "react-native-svg";

import { feel } from "../../services/deviceExtras";
import { useTheme } from "../../theme";

const BRUSH = 46;
const GRID_COLUMNS = 12;
const GRID_ROWS = 8;
/** How much of the card must be scratched before the rest clears by itself. */
const REVEAL_SHARE = 0.45;

type Props = PropsWithChildren<{
  width: number;
  height: number;
  /** Already scratched: the reward shows without the foil. */
  revealed: boolean;
  /** The first touch (the server is asked for the code then, so it is ready under the foil). */
  onStart: () => void;
  /** Enough was scratched: the foil clears. */
  onReveal: () => void;
  disabled?: boolean;
}>;

/**
 * An orange-and-gold foil the customer rubs off with a finger to see the reward underneath. The finger draws a wide clear path
 * through the foil; once about half is cleared, the rest melts away by itself. Drawn with the app's vector drawing, so it works
 * the same on every phone, with no new part in the app.
 */
export function ScratchCard({ width, height, revealed, onStart, onReveal, disabled = false, children }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const maskId = `scratch-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const foilId = `${maskId}-foil`;
  const [path, setPath] = useState("");
  const [cleared, setCleared] = useState(revealed);
  const pathRef = useRef("");
  const frame = useRef<number | null>(null);
  const cells = useRef(new Set<number>());
  const started = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const done = useRef(revealed);
  const foil = useSharedValue(revealed ? 0 : 1);
  const foilStyle = useAnimatedStyle(() => ({ opacity: foil.value }));

  const finish = () => {
    if (done.current) return;
    done.current = true;
    feel("success");
    onReveal();
    foil.set(withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }, (finished) => {
      if (finished) runOnJS(setCleared)(true);
    }));
  };

  const responder = useMemo(() => {
    const mark = (x: number, y: number) => {
      const cellWidth = width / GRID_COLUMNS;
      const cellHeight = height / GRID_ROWS;
      const reach = BRUSH / 2;
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        for (let row = 0; row < GRID_ROWS; row += 1) {
          const centerX = (column + 0.5) * cellWidth;
          const centerY = (row + 0.5) * cellHeight;
          if (Math.abs(centerX - x) <= reach && Math.abs(centerY - y) <= reach) cells.current.add(row * GRID_COLUMNS + column);
        }
      }
      if (cells.current.size / (GRID_COLUMNS * GRID_ROWS) >= REVEAL_SHARE) finish();
    };
    // A fast finger jumps between touch points: everything along the stroke counts, not just where it landed.
    const markStroke = (x: number, y: number) => {
      const from = last.current ?? { x, y };
      const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (BRUSH / 3)));
      for (let step = 1; step <= steps; step += 1) mark(from.x + ((x - from.x) * step) / steps, from.y + ((y - from.y) * step) / steps);
      last.current = { x, y };
    };
    // Drawing is batched to the screen's refresh, so a fast finger never floods the app with updates.
    const draw = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => { frame.current = null; setPath(pathRef.current); });
    };
    // The handlers below read the refs only when a finger moves, never while drawing the card.
    const point = (x: number, y: number) => `${Math.max(0, Math.min(width, x)).toFixed(1)} ${Math.max(0, Math.min(height, y)).toFixed(1)}`;
    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !done.current,
      onMoveShouldSetPanResponder: () => !disabled && !done.current,
      // Scrolling never steals a scratch that has started.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        if (!started.current) { started.current = true; onStart(); }
        feel("tick");
        pathRef.current += `M${point(locationX, locationY)} L${point(locationX + 0.1, locationY + 0.1)} `;
        last.current = null;
        markStroke(locationX, locationY);
        draw();
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        pathRef.current += `L${point(locationX, locationY)} `;
        markStroke(locationX, locationY);
        draw();
      },
    });
    // finish, onStart read the latest props through refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, height, width]);

  return (
    <View style={{ width, height, overflow: "hidden", borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface }}>
      {children}
      {cleared ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, foilStyle]} {...responder.panHandlers} accessibilityRole="adjustable" accessibilityLabel={t("rewards.scratchHere")} accessibilityActions={[{ name: "activate", label: t("rewards.reveal") }]} onAccessibilityAction={() => { if (!started.current) { started.current = true; onStart(); } finish(); }}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id={foilId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#F07811" />
                <Stop offset="0.55" stopColor="#F2A13A" />
                <Stop offset="1" stopColor="#F2B33D" />
              </LinearGradient>
              <Mask id={maskId} x="0" y="0" width={width} height={height} maskUnits="userSpaceOnUse">
                <Rect x="0" y="0" width={width} height={height} fill="#FFFFFF" />
                {path ? <Path d={path} stroke="#000000" strokeWidth={BRUSH} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
              </Mask>
            </Defs>
            <G mask={`url(#${maskId})`}>
              <Rect x="0" y="0" width={width} height={height} fill={`url(#${foilId})`} />
              {/* A light sprinkle of dots makes it read as foil, not a flat button. */}
              {Array.from({ length: 28 }, (_, index) => (
                <Circle key={index} cx={((index * 53) % 100) / 100 * width} cy={((index * 37) % 100) / 100 * height} r={2 + (index % 3)} fill="#FFFFFF" opacity={0.18} />
              ))}
              <SvgText x={width / 2} y={height / 2 - 4} fill="#FFFFFF" fontSize={20} fontWeight="800" textAnchor="middle">{t("rewards.scratchHere")}</SvgText>
              <SvgText x={width / 2} y={height / 2 + 20} fill="#FFFFFF" fontSize={13} fontWeight="600" textAnchor="middle" opacity={0.9}>{t("rewards.scratchHint")}</SvgText>
            </G>
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
