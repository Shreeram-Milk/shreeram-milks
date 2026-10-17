import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, ReduceMotion, interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";

import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { PulseRing } from "../atoms/PulseRing";
import { ThemedText } from "../atoms/ThemedText";
import { CheckIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";
import { motion } from "../../theme/motion";

export interface TimelineStep {
  key: string;
  label: string;
  hint: string;
  icon: IconSvgElement;
}

interface TrackingTimelineProps {
  steps: readonly TimelineStep[];
  /** Index of the step the order is at now. Everything before it is done. */
  reached: number;
}

type NodeState = "todo" | "current" | "done";

const STEP_MS = motion.duration.slow;
const timing = (duration: number) => ({ duration, easing: Easing.bezier(...motion.easing.standard), reduceMotion: ReduceMotion.System });

interface NodeProps {
  icon: IconSvgElement;
  state: NodeState;
  delay: number;
  pulsing: boolean;
}

/** One round marker: it colours in and pops when its turn comes, and keeps rippling while it is where the order is now. */
function Node({ delay, icon, pulsing, state }: NodeProps) {
  const theme = useTheme();
  const level = useSharedValue(0);
  const scale = useSharedValue(1);
  const target = state === "done" ? 2 : state === "current" ? 1 : 0;

  useEffect(() => {
    level.value = withDelay(delay, withTiming(target, timing(motion.duration.normal)));
    if (target > 0) scale.value = withDelay(delay, withSequence(withTiming(1.18, timing(motion.duration.fast)), withTiming(1, timing(motion.duration.normal))));
  }, [delay, level, scale, target]);

  const colors = [theme.colors.colorSurfaceMuted, theme.colors.colorPrimary, theme.colors.colorSuccess];
  const style = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(level.value, [0, 1, 2], colors), transform: [{ scale: scale.value }] }));
  const size = theme.sizes.avatarSm;

  return (
    <View style={{ width: size, height: size }}>
      <PulseRing active={pulsing} color={theme.colors.colorPrimary} radius={theme.radii.pill} />
      <Animated.View style={[{ width: size, height: size, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center" }, style]}>
        <AppIcon icon={state === "done" ? CheckIcon : icon} size="sm" tone={state === "todo" ? "secondary" : "onPrimary"} accessibilityLabel="" />
      </Animated.View>
    </View>
  );
}

/** The line between two markers. It fills downward when the order has passed the marker above it. */
function Connector({ delay, filled }: { delay: number; filled: boolean }) {
  const theme = useTheme();
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(delay, withTiming(filled ? 1 : 0, timing(STEP_MS)));
  }, [delay, fill, filled]);

  const style = useAnimatedStyle(() => ({ height: `${fill.value * 100}%` }));
  const width = theme.spacing.xs / 2;

  return (
    <View style={{ flex: 1, width, minHeight: theme.spacing.lg, marginVertical: theme.spacing.xs, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorBorder, overflow: "hidden" }}>
      <Animated.View style={[{ width, backgroundColor: theme.colors.colorSuccess }, style]} />
    </View>
  );
}

/** The order's journey as a vertical line of steps that draws itself in, one step after another. */
export const TrackingTimeline = memo(function TrackingTimeline({ reached, steps }: TrackingTimelineProps) {
  const theme = useTheme();
  const last = steps.length - 1;
  return (
    <View>
      {steps.map((step, index) => {
        const state: NodeState = index < reached || (index === reached && index === last) ? "done" : index === reached ? "current" : "todo";
        const delay = index * STEP_MS;
        return (
          <View key={step.key} accessible accessibilityLabel={`${step.label}. ${step.hint}`} accessibilityState={{ selected: state === "current" }} style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <View style={{ alignItems: "center" }}>
              <Node delay={delay} icon={step.icon} pulsing={state === "current"} state={state} />
              {index < last ? <Connector delay={delay + motion.duration.normal} filled={index < reached} /> : null}
            </View>
            <View style={{ flex: 1, minHeight: theme.sizes.avatarSm, justifyContent: "center", paddingBottom: index < last ? theme.spacing.md : 0 }}>
              <ThemedText variant="bodySmall" weight={state === "todo" ? "regular" : "semibold"} style={{ color: state === "todo" ? theme.colors.colorTextSecondary : theme.colors.colorTextPrimary }}>{step.label}</ThemedText>
              <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{step.hint}</ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
});
