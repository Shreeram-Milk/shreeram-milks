import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { CheckoutProgress } from "../src/components/molecules/CheckoutProgress";
import { DeliverySlotCard } from "../src/components/molecules/DeliverySlotCard";
import { CheckoutFooter } from "../src/components/organisms/CheckoutFooter";
import { HomeIcon, MapPinIcon, ShieldIcon } from "../src/icons/appIcons";
import { useAppStore } from "../src/store/useAppStore";
import { useAddresses, useDoorstepInstructions, useSaveDoorstepInstructions } from "../src/hooks/useAddresses";
import { parseInstructions } from "../src/services/addressService";
import { useTheme } from "../src/theme";
import type { DoorstepInstructions } from "../src/types/models";

export default function CheckoutAddressScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const cart = useAppStore((state) => state.cart);
  const { data: addresses = [] } = useAddresses();
  const checkoutSelection = useAppStore((state) => state.checkoutSelection);
  const setCheckoutAddress = useAppStore((state) => state.setCheckoutAddress);
  const setCheckoutDeliverySlot = useAppStore((state) => state.setCheckoutDeliverySlot);
  const { data: savedInstructions } = useDoorstepInstructions();
  const saveInstructions = useSaveDoorstepInstructions();
  const doorstepInstructions = savedInstructions ?? parseInstructions(null);
  const setDoorstepInstructions = (next: DoorstepInstructions) => saveInstructions.mutate(next);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const serviceableAddresses = addresses.filter((address) => address.isServiceable);
  const selectedAddressId = serviceableAddresses.some((address) => address.id === checkoutSelection.addressId)
    ? checkoutSelection.addressId
    : null;

  const emptyCart = <View style={{ alignItems: "center", gap: theme.spacing.md, borderRadius: theme.radii.lg, padding: theme.spacing.lg, backgroundColor: theme.colors.colorSurface }}>
    <ThemedText variant="body" weight="semibold">{t("checkout.empty.title")}</ThemedText>
    <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t("checkout.empty.detail")}</ThemedText>
    <Button onPress={() => router.replace("/cart")}>{t("checkout.empty.action")}</Button>
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
    <StatusBar barStyle="dark-content" />
    <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, padding: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.xxl }}>
      <CheckoutProgress step={1} title={t("checkout.address.title")} />
      {cart.length === 0 ? emptyCart : <>
        <View style={{ gap: theme.spacing.xs, borderRadius: theme.radii.lg, padding: theme.spacing.md, backgroundColor: theme.colors.colorSurface, ...theme.elevation.card }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}><ThemedText variant="overline" style={{ color: theme.colors.colorPrimary }}>{t("checkout.address.freshBatch")}</ThemedText><View style={{ borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, backgroundColor: theme.colors.colorPrimaryTint }}><ThemedText variant="badgeLabel" style={{ color: theme.colors.colorPrimary }}>{t("checkout.address.chilled")}</ThemedText></View></View>
          <ThemedText variant="body" weight="bold">{t("checkout.address.batchTitle")}</ThemedText><ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("checkout.address.batchDetail")}</ThemedText>
        </View>
        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><ThemedText variant="bodySmall" weight="semibold">{t("checkout.address.savedTitle")}</ThemedText><ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("checkout.address.savedCount", { count: serviceableAddresses.length })}</ThemedText></View>
          {serviceableAddresses.map((address) => {
            const selected = address.id === selectedAddressId;
            return <Pressable key={address.id} accessibilityRole="radio" accessibilityLabel={t(`addresses.${address.addressType}`)} accessibilityState={{ selected }} onPress={() => setCheckoutAddress(address.id)} style={({ pressed }) => ({ minHeight: theme.layout.touchTargetMin + theme.spacing.xl, flexDirection: "row", gap: theme.spacing.sm, alignItems: "flex-start", borderRadius: theme.radii.lg, padding: theme.spacing.md, borderWidth: selected ? theme.borderWidths.medium : theme.borderWidths.hairline, borderColor: selected ? theme.colors.colorPrimary : theme.colors.colorBorder, backgroundColor: selected ? theme.colors.colorPrimaryTint : theme.colors.colorSurface, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}>
              <AppIcon icon={HomeIcon} size="sm" accessibilityLabel="" tone={selected ? "primary" : "secondary"} /><View style={{ flex: 1, gap: theme.spacing.xs }}><View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}><ThemedText variant="bodySmall" weight="bold">{t(`addresses.${address.addressType}`)}</ThemedText>{address.isDefault ? <View style={{ borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, backgroundColor: theme.colors.colorPrimary }}><ThemedText variant="badgeLabel" style={{ color: theme.colors.colorTextInverse }}>{t("addresses.default")}</ThemedText></View> : null}</View><ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{address.line1}, {address.line2}, {address.city} – {address.pincode}</ThemedText></View><View accessible={false} style={{ width: theme.spacing.md, height: theme.spacing.md, borderRadius: theme.radii.pill, borderWidth: theme.borderWidths.medium, borderColor: selected ? theme.colors.colorPrimary : theme.colors.colorBorder, backgroundColor: selected ? theme.colors.colorPrimary : theme.colors.colorSurface }} />
            </Pressable>;
          })}
          {serviceableAddresses.length === 0 ? <ThemedText variant="bodySmall" style={{ color: theme.colors.colorDanger }}>{t("checkout.review.noAddress")}</ThemedText> : null}
          <Button variant="secondary" onPress={() => router.push("/delivery-address-form")}>{t("addresses.add")}</Button>
        </View>
        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><ThemedText variant="bodySmall" weight="semibold">{t("checkout.address.slotTitle")}</ThemedText><ThemedText variant="overline" style={{ color: theme.colors.colorPrimary }}>{t("checkout.address.everyday")}</ThemedText></View>
          <DeliverySlotCard selected={checkoutSelection.deliverySlot === "early"} onPress={() => setCheckoutDeliverySlot("early")} label={t("checkout.address.earlySlot")} description={t("checkout.address.earlySlotDetail")} />
          <DeliverySlotCard selected={checkoutSelection.deliverySlot === "standard"} onPress={() => setCheckoutDeliverySlot("standard")} label={t("checkout.address.standardSlot")} description={t("checkout.address.standardSlotDetail")} />
        </View>
        <View style={{ gap: theme.spacing.sm, borderRadius: theme.radii.lg, padding: theme.spacing.md, backgroundColor: theme.colors.colorSurface }}>
          <ThemedText variant="bodySmall" weight="semibold">{t("checkout.address.instructionsTitle")}</ThemedText>
          <View style={{ minHeight: theme.layout.touchTargetMin, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}><AppIcon icon={MapPinIcon} size="sm" accessibilityLabel="" tone="secondary" /><ThemedText variant="caption" style={{ flex: 1, color: theme.colors.colorTextSecondary }}>{t("checkout.address.noDoorbell")}</ThemedText><Switch accessibilityLabel={t("checkout.address.noDoorbell")} value={doorstepInstructions.noDoorbell} onValueChange={(noDoorbell) => setDoorstepInstructions({ ...doorstepInstructions, noDoorbell })} trackColor={{ false: theme.colors.colorSurfaceDisabled, true: theme.colors.colorPrimaryTint }} thumbColor={doorstepInstructions.noDoorbell ? theme.colors.colorPrimary : theme.colors.colorTextDisabled} /></View>
          <View style={{ minHeight: theme.layout.touchTargetMin, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}><AppIcon icon={ShieldIcon} size="sm" accessibilityLabel="" tone="secondary" /><ThemedText variant="caption" style={{ flex: 1, color: theme.colors.colorTextSecondary }}>{t("checkout.address.leaveBag")}</ThemedText><Switch accessibilityLabel={t("checkout.address.leaveBag")} value={doorstepInstructions.handoff === "leave-at-door"} onValueChange={(enabled) => setDoorstepInstructions({ ...doorstepInstructions, handoff: enabled ? "leave-at-door" : "hand-to-me" })} trackColor={{ false: theme.colors.colorSurfaceDisabled, true: theme.colors.colorPrimaryTint }} thumbColor={doorstepInstructions.handoff === "leave-at-door" ? theme.colors.colorPrimary : theme.colors.colorTextDisabled} /></View>
        </View>
      </>}
    </ScrollView>
    {cart.length > 0 ? <CheckoutFooter amount={total} disabled={!selectedAddressId} label={t("checkout.address.continue")} onPress={() => router.push("/checkout-review")} /> : null}
  </SafeAreaView>;
}
