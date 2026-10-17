import { useEffect, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";

import { usePinAvailability } from "../../hooks/usePinAvailability";
import { CloseIcon, LocationIcon } from "../../icons/appIcons";
import { PIN_CODE } from "../../services/deliveryAvailabilityService";
import { useAppStore } from "../../store/useAppStore";
import { useToast } from "../../providers/ToastProvider";
import { useTheme } from "../../theme";
import { AppIcon } from "../atoms/AppIcon";
import { AppInput } from "../atoms/AppInput";
import { GlassSurface } from "../atoms/GlassSurface";
import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";

/** A centred pop-up that asks for the delivery PIN code in place, checks it, and remembers it, so the customer never leaves the product. */
export function PinCodeSheet({ blurTarget, onClose }: { blurTarget: RefObject<View | null>; onClose: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const savedPin = useAppStore((state) => state.deliveryPin);
  const setDeliveryPin = useAppStore((state) => state.setDeliveryPin);
  const [pin, setPin] = useState(savedPin);
  const complete = PIN_CODE.test(pin);
  const { data, isLoading, isError } = usePinAvailability(pin);
  const locality = data?.options[0]?.locality;
  const served = Boolean(data && data.options.length > 0);

  // Drawn over the page (not as a system modal) so the page behind can be frosted; the phone's back button still closes it.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  const { showToast } = useToast();
  const save = () => {
    setDeliveryPin(pin);
    onClose();
    if (served) showToast(t("toast.pinSaved", { place: locality ?? pin }));
  };

  let status: { text: string; color: string } | null = null;
  if (complete && isLoading) status = { text: t("productDetails.checkingDelivery"), color: theme.colors.colorTextSecondary };
  else if (complete && isError) status = { text: t("productDetails.deliveryError"), color: theme.colors.colorDanger };
  else if (complete && data && !served) status = { text: t("productDetails.pinNotServed"), color: theme.colors.colorDanger };
  else if (complete && served) status = { text: t("productDetails.pinServed", { place: locality ?? pin }), color: theme.colors.colorSuccess };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[StyleSheet.absoluteFill, { justifyContent: "center", padding: theme.spacing.lg, zIndex: theme.zIndex.modal }]}>
      <Pressable accessibilityLabel={t("bottomSheet.close")} onPress={onClose} style={StyleSheet.absoluteFill}>
        <GlassSurface blurTarget={blurTarget} intensity={14} wash="rgba(31, 36, 33, 0.32)" androidWash="rgba(31, 36, 33, 0.5)" highlight={false} style={StyleSheet.absoluteFill} />
      </Pressable>
      <View style={{ gap: theme.spacing.md, padding: theme.spacing.lg, borderRadius: theme.radii.lg + theme.spacing.xs, borderWidth: theme.borderWidths.hairline, borderColor: "rgba(255, 255, 255, 0.7)", backgroundColor: "rgba(255, 255, 255, 0.985)", ...theme.elevation.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <View style={{ width: theme.spacing.xl + theme.spacing.sm, height: theme.spacing.xl + theme.spacing.sm, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorSurfaceMuted }}>
            <AppIcon icon={LocationIcon} accessibilityLabel="" tone="secondary" />
          </View>
          <ThemedText variant="h2" style={{ flex: 1 }}>{t("productDetails.pinSheetTitle")}</ThemedText>
          <Pressable accessibilityRole="button" accessibilityLabel={t("bottomSheet.close")} onPress={onClose} hitSlop={theme.spacing.sm}>
            <AppIcon icon={CloseIcon} accessibilityLabel="" tone="secondary" size="sm" />
          </Pressable>
        </View>
        <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.pinSheetDetail")}</ThemedText>
        <AppInput
          autoFocus
          value={pin}
          onChangeText={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="380015"
          accessibilityLabel={t("productDetails.pinSheetTitle")}
          style={{ fontSize: theme.typography.h2.fontSize, letterSpacing: 4 }}
        />
        <ThemedText variant="caption" accessibilityLiveRegion="polite" style={{ minHeight: theme.typography.caption.lineHeight, color: status?.color ?? theme.colors.colorTextSecondary }}>
          {status?.text ?? ""}
        </ThemedText>
        <Button disabled={!complete || isLoading} onPress={save}>{t("productDetails.pinSave")}</Button>
      </View>
    </KeyboardAvoidingView>
  );
}
