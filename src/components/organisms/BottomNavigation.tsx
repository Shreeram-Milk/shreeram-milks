import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFeatureFlags } from "../../hooks/useContent";
import { useAppStore } from "../../store/useAppStore";
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

function NavigationItem({
  active,
  cartCount,
  item,
  onChange,
}: {
  active: boolean;
  cartCount: number;
  item: BottomNavigationItem;
  onChange: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeProgress] = useState(() => new Animated.Value(active ? 1 : 0));
  useEffect(() => {
    Animated.timing(activeProgress, {
      toValue: active ? 1 : 0,
      duration: theme.motion.duration.fast,
      easing: Easing.bezier(...theme.motion.easing.standard),
      useNativeDriver: true,
    }).start();
  }, [
    active,
    activeProgress,
    theme.motion.duration.fast,
    theme.motion.easing.standard,
  ]);
  const isCart = item.key === "cart";
  const count = cartCount > 99 ? "99+" : cartCount;
  const label = t(`navigation.${item.key}`, { defaultValue: item.label });
  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={
          isCart && cartCount > 0 ? t("navigation.cartCount", { count }) : label
        }
        onPress={onChange}
        style={({ pressed }) => ({
          minHeight: theme.sizes.buttonHeight + theme.spacing.sm,
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.xs,
          opacity: pressed
            ? theme.opacity.subdued
            : active
              ? theme.opacity.full
              : theme.opacity.subdued,
        })}
      >
        <View style={{ position: "relative" }}>
          <AppIcon
            icon={item.icon}
            accessibilityLabel=""
            size="md"
            tone="onPrimary"
          />
          {isCart && cartCount > 0 ? (
            <View
              accessibilityLabel={t("navigation.cartCount", { count })}
              style={{
                position: "absolute",
                top: -theme.spacing.sm,
                right: -theme.spacing.xs,
                minWidth: theme.sizes.iconSm,
                height: theme.sizes.iconSm,
                paddingHorizontal:
                  cartCount > 9 ? theme.spacing.xs : theme.spacing.none,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.colorSurfaceMuted,
                borderWidth: theme.borderWidths.hairline,
                borderColor: theme.colors.colorNavigation,
              }}
            >
              <ThemedText
                variant="badgeLabel"
                weight="semibold"
                style={{ color: theme.colors.colorTextPrimary }}
              >
                {count}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText
          variant="badgeLabel"
          weight={active ? "semibold" : "regular"}
          numberOfLines={1}
          style={{ color: theme.colors.colorTextInverse }}
        >
          {label}
        </ThemedText>
        <Animated.View
          style={{
            height: theme.borderWidths.medium,
            width: theme.spacing.md,
            overflow: "hidden",
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.colorTextInverse,
            opacity: activeProgress,
          }}
        />
      </Pressable>
    </View>
  );
}

export function BottomNavigation({
  activeKey,
  items,
  onChange,
}: BottomNavigationProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { showSubscriptions } = useFeatureFlags();
  const visibleItems = items.filter((item) => item.key !== "subscriptions" || showSubscriptions);
  const cartCount = useAppStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0),
  );
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        overflow: "hidden",
        borderTopLeftRadius: theme.radii.lg,
        borderTopRightRadius: theme.radii.lg,
        paddingTop: theme.spacing.sm,
        paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
        backgroundColor: theme.colors.colorNavigation,
      }}
    >
      {visibleItems.map((item) => (
        <NavigationItem
          key={item.key}
          active={item.key === activeKey}
          cartCount={cartCount}
          item={item}
          onChange={() => onChange(item.key)}
        />
      ))}
    </View>
  );
}
