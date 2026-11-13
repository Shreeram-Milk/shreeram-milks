import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { AddIcon, MinusIcon } from "../../icons/appIcons";
import { tapFeedback } from "../../lib/haptics";
import { motion } from "../../theme/motion";
import { useTheme } from "../../theme";
import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";

interface QuantityStepperProps { onDecrement: () => void; onIncrement: () => void; value: number; unit?: string; }

const ROLL_DISTANCE = 10;

function StepperButton({ icon, label, onPress }: { icon: IconSvgElement; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} hitSlop={theme.spacing.xs} onPress={() => { tapFeedback(); onPress(); }} pressScale={theme.motion.pressScale.compactControl} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
      <AppIcon icon={icon} accessibilityLabel="" size="sm" tone="primary" />
    </PressableScale>
  );
}

/** A neutral quantity control with a rolling count. */
export function QuantityStepper({ onDecrement, onIncrement, unit = "", value }: QuantityStepperProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const previous = useRef(value);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (previous.current === value) return;
    offset.value = value > previous.current ? ROLL_DISTANCE : -ROLL_DISTANCE;
    offset.value = withTiming(0, { duration: motion.duration.quick, easing: Easing.bezier(...motion.easing.standard), reduceMotion: ReduceMotion.System });
    previous.current = value;
  }, [offset, value]);

  const rollStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }], opacity: 1 - Math.abs(offset.value) / (ROLL_DISTANCE * 2) }));

  return (
    <View style={{ minHeight: theme.sizes.quantityStepperHeight, flexDirection: "row", alignItems: "center", paddingHorizontal: 2, borderRadius: theme.radii.md - 2, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurfaceMuted }}>
      <StepperButton icon={MinusIcon} label={t("quantity.decrease")} onPress={onDecrement} />
      <View style={{ minWidth: 24, alignItems: "center", overflow: "hidden" }}>
        <Animated.View style={rollStyle}>
          <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorTextPrimary, fontVariant: ["tabular-nums"] }}>{`${value}${unit}`}</ThemedText>
        </Animated.View>
      </View>
      <StepperButton icon={AddIcon} label={t("quantity.increase")} onPress={onIncrement} />
    </View>
  );
}
