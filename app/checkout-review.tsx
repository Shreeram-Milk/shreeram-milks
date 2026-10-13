import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { FlatList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { CheckoutProgress } from "../src/components/molecules/CheckoutProgress";
import { CheckoutFooter } from "../src/components/organisms/CheckoutFooter";
import { HomeIcon, ShieldIcon } from "../src/icons/appIcons";
import { useAddresses } from "../src/hooks/useAddresses";
import { useAppStore, type CartItem } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import { getLocalizedProductName } from "../src/lib/productLocalization";

export default function CheckoutReviewScreen() {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const cart = useAppStore((state) => state.cart);
  const selection = useAppStore((state) => state.checkoutSelection);
  const { data: addresses = [] } = useAddresses();
  const address = addresses.find(
    (item) => item.id === selection.addressId && item.isServiceable,
  );
  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const deliveryWindow =
    selection.deliverySlot === "standard"
      ? t("checkout.address.standardSlot")
      : t("checkout.address.earlySlot");
  const renderItem = ({ item }: { item: CartItem }) => (
    <View
      style={{
        flexDirection: "row",
        gap: theme.spacing.md,
        alignItems: "center",
        borderRadius: theme.radii.lg,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.colorSurface,
      }}
    >
      <View
        style={{
          width: theme.sizes.avatarMd,
          height: theme.sizes.avatarMd,
          borderRadius: theme.radii.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.colorPrimaryTint,
        }}
      >
        <ThemedText
          variant="bodySmall"
          weight="bold"
          style={{ color: theme.colors.colorPrimary }}
        >
          {item.quantity}
        </ThemedText>
      </View>
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <ThemedText variant="bodySmall" weight="semibold">
          {getLocalizedProductName(
            item.product,
            i18n.resolvedLanguage ?? i18n.language,
          )}
        </ThemedText>
        <ThemedText
          variant="caption"
          style={{ color: theme.colors.colorTextSecondary }}
        >
          {t("checkout.review.deliveryTomorrow")} · {item.product.unit}
        </ThemedText>
      </View>
      <ThemedText variant="bodySmall" weight="bold">
        ₹{item.product.price * item.quantity}
      </ThemedText>
    </View>
  );
  const emptyCart = (
    <View
      style={{
        alignItems: "center",
        gap: theme.spacing.md,
        borderRadius: theme.radii.lg,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.colorSurface,
      }}
    >
      <ThemedText variant="body" weight="semibold">
        {t("checkout.empty.title")}
      </ThemedText>
      <ThemedText
        variant="bodySmall"
        style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}
      >
        {t("checkout.empty.detail")}
      </ThemedText>
      <Button onPress={() => router.replace("/cart")}>
        {t("checkout.empty.action")}
      </Button>
    </View>
  );

  if (cart.length > 0 && !address)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.colorBackground,
          padding: theme.layout.screenHorizontalPadding,
          gap: theme.spacing.md,
        }}
      >
        <CheckoutProgress step={2} title={t("checkout.review.title")} />
        <ThemedText variant="body">{t("checkout.review.noAddress")}</ThemedText>
        <Button onPress={() => router.replace("/checkout-address")}>
          {t("checkout.address.title")}
        </Button>
      </SafeAreaView>
    );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: theme.layout.screenHorizontalPadding,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.sm,
        }}
        ListHeaderComponent={
          <View
            style={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.md }}
          >
            <CheckoutProgress step={2} title={t("checkout.review.title")} />
            {cart.length === 0 ? (
              emptyCart
            ) : (
              <>
                <View
                  style={{
                    gap: theme.spacing.sm,
                    borderRadius: theme.radii.lg,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.colorSurface,
                    ...theme.elevation.card,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: theme.spacing.sm,
                      alignItems: "flex-start",
                    }}
                  >
                    <AppIcon
                      icon={HomeIcon}
                      size="sm"
                      accessibilityLabel=""
                      tone="primary"
                    />
                    <View style={{ flex: 1, gap: theme.spacing.xs }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: theme.spacing.sm,
                        }}
                      >
                        <ThemedText variant="bodySmall" weight="bold">
                          {t("checkout.review.deliveryTo", {
                            address: address
                              ? t(`addresses.${address.addressType}`)
                              : t("addresses.home"),
                          })}
                        </ThemedText>
                        {address?.isDefault ? (
                          <View
                            style={{
                              borderRadius: theme.radii.pill,
                              paddingHorizontal: theme.spacing.sm,
                              backgroundColor: theme.colors.colorPrimaryTint,
                            }}
                          >
                            <ThemedText
                              variant="badgeLabel"
                              style={{ color: theme.colors.colorPrimary }}
                            >
                              {t("addresses.default")}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      <ThemedText
                        variant="caption"
                        style={{ color: theme.colors.colorTextSecondary }}
                      >
                        {address
                          ? `${address.line1}, ${address.city} – ${address.pincode}`
                          : t("checkout.review.noAddress")}
                      </ThemedText>
                      <ThemedText
                        variant="caption"
                        weight="semibold"
                        style={{ color: theme.colors.colorPrimary }}
                      >
                        {t("checkout.review.deliveryWindow", {
                          slot: deliveryWindow,
                        })}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    gap: theme.spacing.sm,
                    borderRadius: theme.radii.lg,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.colorSurface,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <ThemedText variant="body" weight="bold">
                      {t("checkout.review.billTitle")}
                    </ThemedText>
                    <View
                      style={{
                        borderRadius: theme.radii.pill,
                        paddingHorizontal: theme.spacing.sm,
                        backgroundColor: theme.colors.colorPrimaryTint,
                      }}
                    >
                      <ThemedText
                        variant="badgeLabel"
                        style={{ color: theme.colors.colorPrimary }}
                      >
                        {t("checkout.review.deliveryFree")}
                      </ThemedText>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <ThemedText
                      variant="bodySmall"
                      style={{ color: theme.colors.colorTextSecondary }}
                    >
                      {t("checkout.review.itemTotal")}
                    </ThemedText>
                    <ThemedText variant="bodySmall">₹{total}</ThemedText>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <ThemedText
                      variant="bodySmall"
                      style={{ color: theme.colors.colorTextSecondary }}
                    >
                      {t("checkout.review.deliveryFee")}
                    </ThemedText>
                    <ThemedText
                      variant="bodySmall"
                      weight="semibold"
                      style={{ color: theme.colors.colorPrimary }}
                    >
                      {t("checkout.review.free")}
                    </ThemedText>
                  </View>
                  <View
                    style={{
                      height: theme.borderWidths.hairline,
                      backgroundColor: theme.colors.colorBorder,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <ThemedText variant="bodySmall" weight="bold">
                      {t("checkout.review.totalPayable")}
                    </ThemedText>
                    <ThemedText
                      variant="body"
                      weight="bold"
                      style={{ color: theme.colors.colorPrimary }}
                    >
                      ₹{total}
                    </ThemedText>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.sm,
                    borderRadius: theme.radii.md,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.colorSurfaceMuted,
                  }}
                >
                  <AppIcon
                    icon={ShieldIcon}
                    size="sm"
                    accessibilityLabel=""
                    tone="secondary"
                  />
                  <ThemedText
                    variant="caption"
                    style={{ flex: 1, color: theme.colors.colorTextSecondary }}
                  >
                    {t("checkout.review.reassurance")}
                  </ThemedText>
                </View>
                <ThemedText variant="bodySmall" weight="semibold">
                  {t("checkout.review.itemsTitle", { count: cart.length })}
                </ThemedText>
              </>
            )}
          </View>
        }
      />
      <>
        {cart.length > 0 ? (
          <CheckoutFooter
            amount={total}
            label={t("checkout.review.continue")}
            onPress={() => router.push("/checkout-payment")}
          />
        ) : null}
      </>
    </SafeAreaView>
  );
}
