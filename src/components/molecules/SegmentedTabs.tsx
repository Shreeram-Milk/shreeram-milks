import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { motion } from "../../theme/motion";
import { useTheme } from "../../theme";
import { ThemedText } from "../atoms/ThemedText";

export interface SegmentedTab<T extends string> {
  key: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (key: T) => void;
}

const INSET = 3;

/** A grey track with a white pill that slides to the chosen tab. A long label wraps to two lines instead of being cut. */
export function SegmentedTabs<T extends string>({ onChange, tabs, value }: SegmentedTabsProps<T>) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, tabs.findIndex((tab) => tab.key === value));
  const segment = tabs.length > 0 ? (width - INSET * 2) / tabs.length : 0;
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withTiming(index * segment, { duration: motion.duration.normal, easing: Easing.bezier(...motion.easing.standard), reduceMotion: ReduceMotion.System });
  }, [index, offset, segment]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <View accessibilityRole="tablist" onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ flexDirection: "row", padding: INSET, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }}>
      {segment > 0 ? (
        <Animated.View pointerEvents="none" style={[{ position: "absolute", top: INSET, bottom: INSET, left: INSET, width: segment, borderRadius: theme.radii.md - INSET, backgroundColor: theme.colors.colorSurface, ...theme.elevation.sm }, pillStyle]} />
      ) : null}
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(tab.key)} style={{ flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.xs, paddingVertical: theme.spacing.xs + 2 }}>
            <ThemedText variant="label" weight={selected ? "bold" : "medium"} numberOfLines={2} style={{ textAlign: "center", color: selected ? theme.colors.colorTextPrimary : theme.colors.colorTextSecondary }}>{tab.label}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
