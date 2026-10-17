import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";

import { useTheme } from "../../theme";
import { FIELD_BORDER, FIELD_RADIUS } from "../atoms/AppInput";
import { ThemedText } from "../atoms/ThemedText";

interface OtpBoxesProps {
  /** The digits typed so far. */
  value: string;
  length: number;
  /** True once a code was refused: every box turns red until the customer types again. */
  invalid?: boolean;
  /** True while the real input is focused (so the cursor shows in the next empty box). */
  focused?: boolean;
}

/** The blinking line shown in the box that is waiting for the next digit. */
function Cursor({ color }: { color: string }) {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ width: 2, height: 28, borderRadius: 1, backgroundColor: color, opacity }} />;
}

/**
 * The one-time code, one rounded box per digit. Boxes are soft grey with no border; the box waiting for the next digit turns
 * white with an orange outline, a soft glow and a blinking cursor; typed digits are large and bold; a refused code turns every
 * box red. The boxes are only drawn: the typing happens in a hidden input, so autofill and paste keep working.
 */
export function OtpBoxes({ value, length, invalid = false, focused = true }: OtpBoxesProps) {
  const theme = useTheme();
  // Two groups of three read faster than one long row.
  const groupBreak = length % 2 === 0 ? length / 2 : null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {Array.from({ length }, (_unused, index) => {
        const digit = value[index];
        const active = focused && index === value.length && value.length < length;
        const outline = invalid ? theme.colors.colorDanger : active ? theme.colors.colorPrimary : FIELD_BORDER;
        const background = invalid ? theme.colors.colorDangerTint : theme.colors.colorSurface;
        return (
          <View key={index} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            {index > 0 ? <View style={{ width: groupBreak !== null && index === groupBreak ? theme.spacing.md : theme.spacing.sm }} /> : null}
            <View
              style={{ flex: 1, height: 62, alignItems: "center", justifyContent: "center", borderRadius: FIELD_RADIUS, borderWidth: 1.5, borderColor: outline, backgroundColor: background }}
            >
              {digit ? <ThemedText variant="h1" weight="bold" style={{ color: invalid ? theme.colors.colorDanger : theme.colors.colorTextPrimary }}>{digit}</ThemedText> : active ? <Cursor color={theme.colors.colorPrimary} /> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
