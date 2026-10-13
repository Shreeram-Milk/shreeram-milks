import { useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useFeatureFlags } from "../../hooks/useContent";
import { useTheme } from "../../theme";
import { ThemedText } from "../atoms/ThemedText";

export type PurchasePlan = "single" | "trial" | "subscription";
interface PurchasePlanTabsProps { onChange: (plan: PurchasePlan) => void; value: PurchasePlan; /** The ways this product can be bought. Leave out to show every way the admin has switched on. */ available?: readonly PurchasePlan[]; }
const plans: { key: PurchasePlan; labelKey: string }[] = [{ key: "single", labelKey: "purchasePlans.single" }, { key: "trial", labelKey: "purchasePlans.trial" }, { key: "subscription", labelKey: "purchasePlans.subscription" }];

function PlanTab({ labelKey, onPress, selected }: { labelKey: string; onPress: () => void; selected: boolean }) {
  const theme = useTheme(); const { t } = useTranslation(); const [scale] = useState(() => new Animated.Value(1));
  const animateScale = (toValue: number) => Animated.timing(scale, { toValue, duration: theme.motion.duration.fast, easing: Easing.bezier(...theme.motion.easing.standard), useNativeDriver: true }).start();
  return <Animated.View style={{ flex: 1, transform: [{ scale }] }}><Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} onPressIn={() => animateScale(theme.motion.pressScale.control)} onPressOut={() => animateScale(1)} style={({ pressed }) => ({ minHeight: theme.layout.touchTargetMin, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.sm, paddingHorizontal: theme.spacing.xs, borderWidth: selected ? theme.borderWidths.hairline : theme.borderWidths.none, borderColor: selected ? theme.colors.colorSelected : theme.colors.colorTransparent, backgroundColor: selected ? theme.colors.colorSurfaceSelected : theme.colors.colorTransparent, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}><ThemedText variant="caption" weight="semibold" style={{ color: selected ? theme.colors.colorPrimary : theme.colors.colorTextPrimary, textAlign: "center" }}>{t(labelKey)}</ThemedText></Pressable></Animated.View>;
}

export function PurchasePlanTabs({ onChange, value, available }: PurchasePlanTabsProps) {
  const theme = useTheme();
  const { showTrials, showSubscriptions } = useFeatureFlags();
  // The admin can switch trial packs and subscriptions off; a plain one-time purchase is always available.
  const visible = plans.filter((plan) => (plan.key !== "trial" || showTrials) && (plan.key !== "subscription" || showSubscriptions) && (!available || available.includes(plan.key)));
  return <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: theme.spacing.xs, padding: theme.spacing.xs, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }}>{visible.map((plan) => <PlanTab key={plan.key} labelKey={plan.labelKey} selected={value === plan.key} onPress={() => onChange(plan.key)} />)}</View>;
}
