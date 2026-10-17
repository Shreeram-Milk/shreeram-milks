import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { RadioDot } from "../src/components/atoms/RadioDot";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { CheckoutEmptyCart } from "../src/components/molecules/CheckoutEmptyCart";
import { CheckoutProgress } from "../src/components/molecules/CheckoutProgress";
import { CheckoutSection } from "../src/components/molecules/CheckoutSection";
import { ChoiceTile } from "../src/components/molecules/ChoiceTile";
import { CheckoutFooter } from "../src/components/organisms/CheckoutFooter";
import { AddIcon, AlertsIcon, HomeIcon, ShieldIcon, TruckIcon } from "../src/icons/appIcons";
import { pickDefaultAddress, useAddresses, useDoorstepInstructions, useSaveDoorstepInstructions } from "../src/hooks/useAddresses";
import { parseInstructions } from "../src/services/addressService";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { DoorstepInstructions } from "../src/types/models";

export default function CheckoutAddressScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const cart = useAppStore((state) => state.cart);
  const { data: addresses = [] } = useAddresses();
  const checkoutSelection = useAppStore((state) => state.checkoutSelection);
  const setCheckoutAddress = useAppStore((state) => state.setCheckoutAddress);
  const { data: savedInstructions } = useDoorstepInstructions();
  const saveInstructions = useSaveDoorstepInstructions();
  const doorstepInstructions = savedInstructions ?? parseInstructions(null);
  const setDoorstepInstructions = (next: DoorstepInstructions) => saveInstructions.mutate(next);
  const totalPaise = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100;
  // The address picked earlier if it still exists, otherwise the default one, so the common case needs no tap.
  const selectedAddressId = addresses.some((address) => address.id === checkoutSelection.addressId) ? checkoutSelection.addressId : (pickDefaultAddress(addresses)?.id ?? null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ gap: theme.spacing.xl, padding: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.xl }}>
        <CheckoutProgress step={1} title={t("checkout.address.title")} />
        {cart.length === 0 ? <CheckoutEmptyCart /> : (
          <>
            <CheckoutSection title={t("checkout.address.savedTitle")} aside={<ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("checkout.address.savedCount", { count: addresses.length })}</ThemedText>}>
              <View accessibilityRole="radiogroup">
                {addresses.map((address, index) => {
                  const selected = address.id === selectedAddressId;
                  return (
                    <Pressable
                      key={address.id}
                      accessibilityRole="radio"
                      accessibilityLabel={`${t(`addresses.${address.addressType}`)}, ${address.line1}`}
                      accessibilityState={{ selected }}
                      onPress={() => setCheckoutAddress(address.id)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: theme.spacing.md,
                        padding: theme.spacing.md,
                        borderTopWidth: index === 0 ? theme.borderWidths.none : theme.borderWidths.hairline,
                        borderTopColor: theme.colors.colorBorder,
                        backgroundColor: selected ? theme.colors.colorSurfaceMuted : theme.colors.colorTransparent,
                        opacity: pressed ? theme.opacity.subdued : theme.opacity.full,
                      })}
                    >
                      <View style={{ width: theme.sizes.avatarSm, height: theme.sizes.avatarSm, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md, backgroundColor: selected ? theme.colors.colorSurface : theme.colors.colorSurfaceMuted }}>
                        <AppIcon icon={HomeIcon} size="sm" tone="secondary" accessibilityLabel="" />
                      </View>
                      <View style={{ flex: 1, gap: theme.spacing.xs }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
                          <ThemedText variant="bodySmall" weight="medium">{t(`addresses.${address.addressType}`)}</ThemedText>
                          {address.isDefault ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>· {t("addresses.default")}</ThemedText> : null}
                        </View>
                        <ThemedText variant="caption" numberOfLines={2} style={{ color: theme.colors.colorTextSecondary }}>
                          {address.line1}, {address.line2}, {address.city} – {address.pincode}
                        </ThemedText>
                      </View>
                      <RadioDot selected={selected} />
                    </Pressable>
                  );
                })}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/delivery-address-form")}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md, borderTopWidth: addresses.length > 0 ? theme.borderWidths.hairline : theme.borderWidths.none, borderTopColor: theme.colors.colorBorder, opacity: pressed ? theme.opacity.subdued : theme.opacity.full })}
                >
                  <View style={{ width: theme.sizes.avatarSm, height: theme.sizes.avatarSm, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md, borderWidth: theme.borderWidths.hairline, borderStyle: "dashed", borderColor: theme.colors.colorTextDisabled }}>
                    <AppIcon icon={AddIcon} size="sm" tone="secondary" accessibilityLabel="" />
                  </View>
                  <ThemedText variant="bodySmall" weight="medium">{t("addresses.add")}</ThemedText>
                </Pressable>
              </View>
            </CheckoutSection>
            {addresses.length === 0 ? <ThemedText variant="caption" style={{ color: theme.colors.colorDanger, marginTop: -theme.spacing.md }}>{t("checkout.review.noAddress")}</ThemedText> : null}

            <CheckoutSection card={false} title={t("checkout.address.instructionsTitle")}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
                <ChoiceTile kind="checkbox" icon={AlertsIcon} title={t("checkout.address.noDoorbell")} selected={doorstepInstructions.noDoorbell} onPress={() => setDoorstepInstructions({ ...doorstepInstructions, noDoorbell: !doorstepInstructions.noDoorbell })} />
                <ChoiceTile kind="checkbox" icon={ShieldIcon} title={t("checkout.address.leaveBag")} selected={doorstepInstructions.handoff === "leave-at-door"} onPress={() => setDoorstepInstructions({ ...doorstepInstructions, handoff: doorstepInstructions.handoff === "leave-at-door" ? "hand-to-me" : "leave-at-door" })} />
              </View>
            </CheckoutSection>

            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, paddingHorizontal: theme.spacing.xs }}>
              <AppIcon icon={TruckIcon} size="sm" tone="success" accessibilityLabel="" />
              <ThemedText variant="caption" style={{ flex: 1, color: theme.colors.colorTextSecondary }}>{t("checkout.address.batchDetail")}</ThemedText>
            </View>
          </>
        )}
      </ScrollView>
      {cart.length > 0 ? <CheckoutFooter amountPaise={totalPaise} disabled={!selectedAddressId} label={t("checkout.address.continue")} onPress={() => { if (selectedAddressId) { setCheckoutAddress(selectedAddressId); router.push("/checkout-review"); } }} /> : null}
    </SafeAreaView>
  );
}
