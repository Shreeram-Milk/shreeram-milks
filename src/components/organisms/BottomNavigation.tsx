import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppStore } from "../../store/useAppStore";
import { motion } from "../../theme/motion";
import { useTheme } from "../../theme";
import type { IconSvgElement } from "../atoms/AppIcon";
import { AppIcon } from "../atoms/AppIcon";
import { ThemedText } from "../atoms/ThemedText";

export interface BottomNavigationItem {
  icon: IconSvgElement;
  key: string;
  label: string;
}
interface BottomNavigationProps {
  activeKey: string;
  items: BottomNavigationItem[];
  onChange: (key: string) => void;
}

const BUMP_SCALE = 1.25;

/** The cart count bubble: it bumps whenever the number of items changes. */
function CartBadge({ count }: { count: number }) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (count === 0) return;
    scale.value = withSequence(
      withTiming(BUMP_SCALE, { duration: motion.duration.instant, reduceMotion: ReduceMotion.System }),
      withSpring(1, { ...motion.spring.pop, reduceMotion: ReduceMotion.System }),
    );
  }, [count, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  if (count === 0) return null;
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: -theme.spacing.xs,
          right: theme.spacing.xs,
          minWidth: 18,
          height: 18,
          paddingHorizontal: count > 9 ? theme.spacing.xs : theme.spacing.none,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.colorHighlight,
          borderWidth: theme.borderWidths.medium,
          borderColor: theme.colors.colorNavigation,
        },
        style,
      ]}
    >
      <ThemedText variant="badgeLabel" style={{ color: theme.colors.colorOnHighlight, fontSize: 10, lineHeight: 12 }}>
        {count > 99 ? "99+" : count}
      </ThemedText>
    </Animated.View>
  );
}

export function BottomNavigation({ activeKey, items, onChange }: BottomNavigationProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const cartCount = useAppStore((state) => state.cart.reduce((total, item) => total + item.quantity, 0));

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        paddingHorizontal: theme.spacing.xs,
        paddingTop: theme.spacing.sm,
        paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
        borderTopLeftRadius: theme.radii.xl,
        borderTopRightRadius: theme.radii.xl,
        backgroundColor: theme.colors.colorNavigation,
      }}
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        const isCart = item.key === "cart";
        const count = cartCount > 99 ? "99+" : cartCount;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={isCart && cartCount > 0 ? t("navigation.cartCount", { count }) : item.label}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => ({ flex: 1, minHeight: theme.sizes.buttonHeight, alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 2, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}
          >
            {/* The chosen tab is plain white on the dark bar; the others stay grey. */}
            <View style={{ width: 52, height: 30, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorTransparent }}>
              <AppIcon icon={item.icon} accessibilityLabel="" size="md" color={active ? theme.colors.colorNavigationActive : theme.colors.colorNavigationText} strong={active} />
              {isCart ? <CartBadge count={cartCount} /> : null}
            </View>
            <ThemedText variant="badgeLabel" weight={active ? "bold" : "medium"} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: active ? theme.colors.colorNavigationActive : theme.colors.colorNavigationText }}>
              {item.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
