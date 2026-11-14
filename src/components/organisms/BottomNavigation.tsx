import { useEffect, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { Easing, FadeInDown, FadeOutDown, ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CartIcon, ForwardIcon } from "../../icons/appIcons";
import { formatRupees } from "../../lib/catalogCart";
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
const BAR_HEIGHT = 64;
const BAR_PADDING = 6;
const ICON_LIFT = -1;
/** A gentle spring: the highlight glides to the chosen tab and settles without bouncing far. */
const SLIDE = { damping: 20, stiffness: 220, mass: 0.8, reduceMotion: ReduceMotion.System } as const;

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
          right: -theme.spacing.sm,
          minWidth: 18,
          height: 18,
          paddingHorizontal: count > 9 ? theme.spacing.xs : theme.spacing.none,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.colorPrimary,
          borderWidth: theme.borderWidths.medium,
          borderColor: theme.colors.colorTabBar,
        },
        style,
      ]}
    >
      <ThemedText variant="badgeLabel" style={{ color: theme.colors.colorTextInverse, fontSize: 10, lineHeight: 12 }}>
        {count > 99 ? "99+" : count}
      </ThemedText>
    </Animated.View>
  );
}

/**
 * "2 items · ₹77   View cart": eases up above the tabs (no bounce) once something is in the cart, on the shopping tabs (not Cart or Account).
 * The total is the cart's own estimate; checkout shows the server's price.
 */
function CartBar({ count, onOpen }: { count: number; onOpen: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const totalPaise = useAppStore((state) => state.cart.reduce((sum, item) => sum + Math.round(item.product.price * 100) * item.quantity, 0));
  return (
    <Animated.View entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)} exiting={FadeOutDown.duration(180).reduceMotion(ReduceMotion.System)} style={{ marginBottom: theme.spacing.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t("cart.itemCount", { count })}, ${formatRupees(totalPaise)}. ${t("cartBar.view")}`}
        onPress={onOpen}
        style={({ pressed }) => ({ minHeight: 54, flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorPrimary, opacity: pressed ? theme.opacity.subdued : theme.opacity.full, ...theme.elevation.lg })}
      >
        <AppIcon icon={CartIcon} accessibilityLabel="" size="sm" color={theme.colors.colorBrand} />
        <ThemedText variant="bodySmall" weight="bold" style={{ flex: 1, color: theme.colors.colorTextInverse, fontVariant: ["tabular-nums"] }}>
          {t("cart.itemCount", { count })} · {formatRupees(totalPaise)}
        </ThemedText>
        <ThemedText variant="bodySmall" weight="bold" style={{ color: theme.colors.colorTextInverse }}>{t("cartBar.view")}</ThemedText>
        <AppIcon icon={ForwardIcon} accessibilityLabel="" size="sm" color={theme.colors.colorTextInverse} />
      </Pressable>
    </Animated.View>
  );
}

/** One tab: its icon lifts a little and turns saffron when chosen. */
function Tab({ active, cartCount, item, onLayout, onPress }: { active: boolean; cartCount: number; item: BottomNavigationItem; onLayout: (event: LayoutChangeEvent) => void; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const lift = useSharedValue(active ? ICON_LIFT : 0);
  useEffect(() => { lift.value = withSpring(active ? ICON_LIFT : 0, SLIDE); }, [active, lift]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  const isCart = item.key === "cart";
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={isCart && cartCount > 0 ? t("navigation.cartCount", { count: cartCount > 99 ? "99+" : cartCount }) : item.label}
      onLayout={onLayout}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: theme.radii.pill, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}
    >
      <Animated.View style={iconStyle}>
        <AppIcon icon={item.icon} accessibilityLabel="" size="md" color={active ? theme.colors.colorTabIconActive : theme.colors.colorTabText} strong={active} />
        {isCart ? <CartBadge count={cartCount} /> : null}
      </Animated.View>
      <ThemedText variant="badgeLabel" weight={active ? "bold" : "medium"} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: active ? theme.colors.colorTabTextActive : theme.colors.colorTabText }}>
        {item.label}
      </ThemedText>
    </Pressable>
  );
}

/**
 * The main tabs as a floating white pill. A soft saffron highlight slides to the chosen tab; the chosen icon turns saffron and
 * lifts slightly. Movement follows the phone's "reduce motion" setting.
 */
export function BottomNavigation({ activeKey, items, onChange }: BottomNavigationProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cartCount = useAppStore((state) => state.cart.reduce((total, item) => total + item.quantity, 0));
  const [frames, setFrames] = useState<Record<string, { x: number; width: number }>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const active = frames[activeKey];

  useEffect(() => {
    if (!active) return;
    // The first placement jumps; every later change of tab glides.
    if (width.value === 0) { x.value = active.x; width.value = active.width; return; }
    x.value = withSpring(active.x, SLIDE);
    width.value = withSpring(active.width, SLIDE);
  }, [active, x, width]);
  const indicatorStyle = useAnimatedStyle(() => ({ width: width.value, transform: [{ translateX: x.value }] }));

  return (
    <View style={{ paddingHorizontal: theme.spacing.md - 4, paddingTop: theme.spacing.xs, paddingBottom: Math.max(insets.bottom, theme.spacing.md - 4), backgroundColor: theme.colors.colorBackground }}>
      {cartCount > 0 && activeKey !== "cart" && activeKey !== "profile" && items.some((item) => item.key === "cart") ? <CartBar count={cartCount} onOpen={() => onChange("cart")} /> : null}
      <View
        accessibilityRole="tablist"
        style={{
          height: BAR_HEIGHT,
          flexDirection: "row",
          padding: BAR_PADDING,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.colorTabBar,
          borderWidth: theme.borderWidths.hairline,
          borderColor: theme.colors.colorBorder,
          ...theme.elevation.lg,
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", top: BAR_PADDING, bottom: BAR_PADDING, left: 0, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorTabIndicator, opacity: active ? 1 : 0 }, indicatorStyle]}
        />
        {items.map((item) => (
          <Tab
            key={item.key}
            item={item}
            active={item.key === activeKey}
            cartCount={cartCount}
            onPress={() => onChange(item.key)}
            onLayout={(event) => {
              const { x: left, width: size } = event.nativeEvent.layout;
              setFrames((current) => (current[item.key]?.x === left && current[item.key]?.width === size ? current : { ...current, [item.key]: { x: left, width: size } }));
            }}
          />
        ))}
      </View>
    </View>
  );
}
