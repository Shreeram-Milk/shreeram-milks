import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";

import { ChevronDownIcon } from "../../icons/appIcons";
import { useTheme } from "../../theme";
import { AppIcon } from "../atoms/AppIcon";
import { ThemedText } from "../atoms/ThemedText";

interface FaqItemProps {
  answer: string;
  expanded: boolean;
  isLast?: boolean;
  onPress: () => void;
  question: string;
}

/** One question that opens to show its answer. The answer is only drawn while open or animating, to keep long lists light. */
export function FaqItem({ answer, expanded, isLast = false, onPress, question }: FaqItemProps) {
  const theme = useTheme();
  const [answerMounted, setAnswerMounted] = useState(expanded);
  const [progress] = useState(() => new Animated.Value(expanded ? 1 : 0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: theme.motion.duration.fast,
      easing: expanded ? Easing.bezier(...theme.motion.easing.decelerate) : Easing.bezier(...theme.motion.easing.accelerate),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !expanded) setAnswerMounted(false);
    });
  }, [expanded, progress, theme.motion.duration.fast, theme.motion.easing.accelerate, theme.motion.easing.decelerate]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => {
        if (!expanded) setAnswerMounted(true);
        onPress();
      }}
      style={({ pressed }) => ({
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderBottomWidth: isLast ? theme.borderWidths.none : theme.borderWidths.hairline,
        borderBottomColor: theme.colors.colorBorder,
        backgroundColor: theme.colors.colorSurface,
        opacity: pressed ? theme.opacity.subdued : theme.opacity.full,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <ThemedText variant="body" weight="semibold" style={{ flex: 1 }}>{question}</ThemedText>
        <Animated.View style={{ transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}>
          <AppIcon icon={ChevronDownIcon} accessibilityLabel="" size="sm" tone="secondary" />
        </Animated.View>
      </View>
      {answerMounted ? (
        <Animated.View
          accessibilityElementsHidden={!expanded}
          importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
          style={{ opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [theme.motion.entranceOffset, 0] }) }] }}
        >
          <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{answer}</ThemedText>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}
