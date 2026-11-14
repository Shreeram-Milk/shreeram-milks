import { router } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { formatRupees } from "../../lib/catalogCart";
import { useTheme } from "../../theme";
import { AppIcon } from "../atoms/AppIcon";
import { ThemedText } from "../atoms/ThemedText";
import { WalletIcon } from "../../icons/appIcons";

interface WalletPayChoiceProps {
  balancePaise: number;
  /** What would be taken from the wallet. */
  neededPaise: number;
  selected: boolean;
  onChange: (selected: boolean) => void;
}

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 28;
const KNOB = 22;

/**
 * "Pay from wallet": a switch when the wallet covers the amount, otherwise the balance and a link to add money. It only
 * chooses; the server checks the balance again under a lock when the order is placed.
 */
export function WalletPayChoice({ balancePaise, neededPaise, onChange, selected }: WalletPayChoiceProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const enough = balancePaise >= neededPaise;
  const on = enough && selected;
  const knob = useSharedValue(on ? 1 : 0);
  useEffect(() => { knob.value = withSpring(on ? 1 : 0, { damping: 18, stiffness: 260, reduceMotion: ReduceMotion.System }); }, [on, knob]);
  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: knob.value * (TRACK_WIDTH - KNOB - 6) }] }));

  return (
    <Pressable
      accessibilityRole={enough ? "switch" : "button"}
      accessibilityState={enough ? { checked: on } : undefined}
      accessibilityLabel={enough ? `${t("wallet.payFromWallet")}. ${t("wallet.payFromWalletDetail", { amount: formatRupees(balancePaise) })}` : t("wallet.addMoneyLink")}
      onPress={() => (enough ? onChange(!selected) : router.push("/wallet"))}
      style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4, padding: theme.spacing.md, borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: on ? theme.colors.colorPrimary : theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface }}
    >
      <AppIcon icon={WalletIcon} accessibilityLabel="" size="md" tone="brand" />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText variant="bodySmall" weight="bold">{t("wallet.payFromWallet")}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>
          {enough ? t("wallet.payFromWalletDetail", { amount: formatRupees(balancePaise) }) : t("wallet.payFromWalletShort", { balance: formatRupees(balancePaise), needed: formatRupees(neededPaise - balancePaise) })}
        </ThemedText>
      </View>
      {enough ? (
        <View style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT, borderRadius: theme.radii.pill, padding: 3, backgroundColor: on ? theme.colors.colorPrimary : theme.colors.colorBorder }}>
          <Animated.View style={[{ width: KNOB, height: KNOB, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorSurface, ...theme.elevation.sm }, knobStyle]} />
        </View>
      ) : (
        <ThemedText variant="label" weight="bold" style={{ textDecorationLine: "underline" }}>{t("wallet.addMoneyLink")}</ThemedText>
      )}
    </Pressable>
  );
}
