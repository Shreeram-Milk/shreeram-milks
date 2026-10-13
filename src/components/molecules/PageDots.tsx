import { memo } from "react";
import { View } from "react-native";
import Animated, { Extrapolation, interpolate, interpolateColor, useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { useTheme } from "../../theme";

interface PageDotsProps {
  count: number;
  /** The carousel's horizontal scroll position, so the dots grow and shrink while the finger is still moving. */
  scrollX: SharedValue<number>;
  /** Distance between one slide's start and the next (slide width plus the gap). Must be above zero. */
  step: number;
  accessibilityLabel: string;
}

interface DotProps {
  position: number;
  scrollX: SharedValue<number>;
  step: number;
  small: number;
  wide: number;
  height: number;
  radius: number;
  idleColor: string;
  activeColor: string;
}

function Dot({ position, scrollX, step, small, wide, height, radius, idleColor, activeColor }: DotProps) {
  // Runs on the UI thread, so it never waits for JavaScript and adds no work to the screen.
  const style = useAnimatedStyle(() => {
    const range = [(position - 1) * step, position * step, (position + 1) * step];
    return {
      width: interpolate(scrollX.value, range, [small, wide, small], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(scrollX.value, range, [idleColor, activeColor, idleColor]),
    };
  });
  return <Animated.View style={[{ height, borderRadius: radius }, style]} />;
}

/** The dots under a carousel. The current dot stretches smoothly as you swipe toward it. */
export const PageDots = memo(function PageDots({ count, scrollX, step, accessibilityLabel }: PageDotsProps) {
  const theme = useTheme();
  if (count < 2 || step <= 0) return null;
  return (
    <View accessibilityLabel={accessibilityLabel} style={{ flexDirection: "row", justifyContent: "center", gap: theme.spacing.xs }}>
      {Array.from({ length: count }, (_, position) => (
        <Dot
          key={position}
          position={position}
          scrollX={scrollX}
          step={step}
          small={theme.spacing.xs}
          wide={theme.spacing.lg}
          height={theme.spacing.xs}
          radius={theme.radii.pill}
          idleColor={theme.colors.colorBorder}
          activeColor={theme.colors.colorPrimary}
        />
      ))}
    </View>
  );
});
