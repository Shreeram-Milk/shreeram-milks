import { View } from "react-native";

import { useTheme } from "../../theme";
import { AppIcon, type IconSvgElement } from "../atoms/AppIcon";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { SubscriptionBottomSheet } from "./SubscriptionBottomSheet";

interface ConfirmSheetProps {
  /** What the customer will lose or change, one short line each. Shown as a list so nothing is a surprise. */
  consequences?: string[];
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  /** Shown under the buttons when the action failed. */
  errorText?: string;
  icon: IconSvgElement;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  /** `danger` is for actions that cannot be undone. */
  tone?: "primary" | "danger";
  visible: boolean;
}

/**
 * The app's own confirmation pop-up (a bottom sheet), used instead of the phone's plain system alert:
 * an icon, a plain title, what will happen, and two clear buttons with the safe choice first.
 */
export function ConfirmSheet({ cancelLabel, confirmLabel, consequences = [], description, errorText, icon, loading = false, onCancel, onConfirm, title, tone = "primary", visible }: ConfirmSheetProps) {
  const theme = useTheme();
  const danger = tone === "danger";
  return (
    <SubscriptionBottomSheet visible={visible} onClose={loading ? () => undefined : onCancel}>
      <View style={{ gap: theme.spacing.md, alignItems: "center" }}>
        <View style={{ width: theme.sizes.avatarLg, height: theme.sizes.avatarLg, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: danger ? theme.colors.colorDangerTint : theme.colors.colorPrimaryTint }}>
          <AppIcon icon={icon} accessibilityLabel="" tone={danger ? "danger" : "primary"} />
        </View>
        <View style={{ gap: theme.spacing.xs, alignItems: "center" }}>
          <ThemedText variant="h2" style={{ textAlign: "center" }}>{title}</ThemedText>
          <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{description}</ThemedText>
        </View>
        {consequences.length > 0 ? (
          <View style={{ alignSelf: "stretch", gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }}>
            {consequences.map((line) => (
              <View key={line} style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <ThemedText variant="bodySmall" style={{ color: danger ? theme.colors.colorDanger : theme.colors.colorPrimary }}>•</ThemedText>
                <ThemedText variant="bodySmall" style={{ flex: 1 }}>{line}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}
        <View style={{ alignSelf: "stretch", gap: theme.spacing.sm }}>
          <Button variant="secondary" disabled={loading} onPress={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} onPress={onConfirm}>{confirmLabel}</Button>
        </View>
        {errorText ? (
          <ThemedText accessibilityLiveRegion="polite" variant="caption" style={{ color: theme.colors.colorDanger, textAlign: "center" }}>{errorText}</ThemedText>
        ) : null}
      </View>
    </SubscriptionBottomSheet>
  );
}
