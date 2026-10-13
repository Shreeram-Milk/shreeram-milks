import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { CheckoutProgress } from "../src/components/molecules/CheckoutProgress";
import { LockIcon, WalletIcon } from "../src/icons/appIcons";
import { useAddresses } from "../src/hooks/useAddresses";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";

type PaymentMethod = "upi" | "card" | "wallet";

export default function CheckoutPaymentScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const cart = useAppStore((state) => state.cart);
  const { data: addresses = [] } = useAddresses();
  const checkoutAddressId = useAppStore((state) => state.checkoutSelection.addressId);
  const selectedAddress = addresses.find((address) => address.id === checkoutAddressId && address.isServiceable);
  const validAddress = selectedAddress !== undefined;
  const confirmPreviewOrder = useAppStore((state) => state.confirmPreviewOrder);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [confirming, setConfirming] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const methods: { key: PaymentMethod; detail: string; disabled?: boolean; title: string }[] = [{ key: "upi", title: t("payment.upi"), detail: t("payment.upiDetail") }, { key: "card", title: t("payment.card"), detail: t("payment.cardDetail"), disabled: true }, { key: "wallet", title: t("payment.wallet"), detail: t("payment.walletDetail"), disabled: true }];
  const confirmPreview = () => {
    if (confirming || cart.length === 0 || !selectedAddress) return;
    setConfirming(true);
    if (!confirmPreviewOrder(`${selectedAddress.line1}, ${selectedAddress.line2}, ${selectedAddress.city} – ${selectedAddress.pincode}`)) { setConfirming(false); return; }
    router.dismissAll();
    router.replace("/order-success");
  };
  const emptyCart = <View style={{ alignItems: "center", gap: theme.spacing.md, borderRadius: theme.radii.lg, padding: theme.spacing.lg, backgroundColor: theme.colors.colorSurface }}><ThemedText variant="body" weight="semibold">{t("checkout.empty.title")}</ThemedText><ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t("checkout.empty.detail")}</ThemedText><Button onPress={() => router.replace("/cart")}>{t("checkout.empty.action")}</Button></View>;

  if (cart.length > 0 && !validAddress) return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground, padding: theme.layout.screenHorizontalPadding, gap: theme.spacing.md }}><CheckoutProgress step={3} title={t("payment.title")} /><ThemedText variant="body">{t("checkout.review.noAddress")}</ThemedText><Button onPress={() => router.replace("/checkout-address")}>{t("checkout.address.title")}</Button></SafeAreaView>;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{
          gap: theme.spacing.lg,
          padding: theme.layout.screenHorizontalPadding,
          paddingBottom: theme.spacing.xxl,
        }}
      >
        <CheckoutProgress step={3} title={t("payment.title")} />
        {cart.length === 0 ? (
          emptyCart
        ) : (
          <>
            <View
              style={{
                gap: theme.spacing.xs,
                borderRadius: theme.radii.lg,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.colorSurface,
                ...theme.elevation.card,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <ThemedText
                  variant="overline"
                  style={{ color: theme.colors.colorTextSecondary }}
                >
                  {t("payment.amount")}
                </ThemedText>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.xs,
                    borderRadius: theme.radii.pill,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    backgroundColor: theme.colors.colorInfoTint,
                  }}
                >
                  <AppIcon
                    icon={LockIcon}
                    size="sm"
                    accessibilityLabel=""
                    tone="secondary"
                  />
                  <ThemedText
                    variant="badgeLabel"
                    style={{ color: theme.colors.colorInfo }}
                  >
                    {t("payment.preview")}
                  </ThemedText>
                </View>
              </View>
              <ThemedText variant="h1">₹{total}</ThemedText>
              <ThemedText
                variant="caption"
                style={{ color: theme.colors.colorTextSecondary }}
              >
                {t("payment.orderCount", { count: cart.length })}
              </ThemedText>
            </View>
            <View style={{ gap: theme.spacing.sm }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <ThemedText variant="bodySmall" weight="semibold">
                  {t("payment.methodTitle")}
                </ThemedText>
                <ThemedText
                  variant="overline"
                  style={{ color: theme.colors.colorInfo }}
                >
                  {t("payment.preview")}
                </ThemedText>
              </View>
              {methods.map((item) => {
                const selected = method === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="radio"
                    accessibilityLabel={item.title}
                    accessibilityState={{ selected, disabled: item.disabled }}
                    disabled={item.disabled}
                    onPress={() => setMethod(item.key)}
                    style={({ pressed }) => ({
                      minHeight: theme.layout.touchTargetMin + theme.spacing.sm,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: theme.spacing.sm,
                      padding: theme.spacing.md,
                      borderRadius: theme.radii.lg,
                      borderWidth: selected
                        ? theme.borderWidths.medium
                        : theme.borderWidths.hairline,
                      borderColor: selected
                        ? theme.colors.colorPrimary
                        : theme.colors.colorBorder,
                      backgroundColor: selected
                        ? theme.colors.colorPrimaryTint
                        : theme.colors.colorSurface,
                      opacity: item.disabled
                        ? theme.opacity.disabled
                        : pressed
                          ? theme.opacity.subdued
                          : theme.opacity.full,
                    })}
                  >
                    <View
                      style={{
                        width: theme.sizes.avatarSm,
                        height: theme.sizes.avatarSm,
                        borderRadius: theme.radii.md,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.colors.colorSurfaceSecondary,
                      }}
                    >
                      <AppIcon
                        icon={item.key === "wallet" ? WalletIcon : LockIcon}
                        size="sm"
                        accessibilityLabel=""
                        tone="secondary"
                      />
                    </View>
                    <View style={{ flex: 1, gap: theme.spacing.xs }}>
                      <ThemedText variant="bodySmall" weight="semibold">
                        {item.title}
                      </ThemedText>
                      <ThemedText
                        variant="caption"
                        style={{ color: theme.colors.colorTextSecondary }}
                      >
                        {item.detail}
                      </ThemedText>
                    </View>
                    <View
                      accessible={false}
                      style={{
                        width: theme.spacing.md,
                        height: theme.spacing.md,
                        borderRadius: theme.radii.pill,
                        borderWidth: theme.borderWidths.medium,
                        borderColor: selected
                          ? theme.colors.colorPrimary
                          : theme.colors.colorBorder,
                        backgroundColor: selected
                          ? theme.colors.colorPrimary
                          : theme.colors.colorSurface,
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
                borderRadius: theme.radii.md,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.colorSurfaceSecondary,
              }}
            >
              <AppIcon
                icon={LockIcon}
                size="sm"
                accessibilityLabel=""
                tone="secondary"
              />
              <ThemedText
                variant="caption"
                style={{ flex: 1, color: theme.colors.colorTextSecondary }}
              >
                {t("payment.reassurance")}
              </ThemedText>
            </View>
          </>
        )}
      </ScrollView>
      {cart.length > 0 ? (
        <View
          style={[
            {
              paddingHorizontal: theme.layout.screenHorizontalPadding,
              paddingTop: theme.spacing.sm,
              paddingBottom: theme.spacing.md,
              backgroundColor: theme.colors.colorSurface,
            },
            theme.elevation.card,
          ]}
        >
          <Button loading={confirming} onPress={confirmPreview}>
            {t(confirming ? "payment.confirming" : "payment.continue")}
          </Button>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
