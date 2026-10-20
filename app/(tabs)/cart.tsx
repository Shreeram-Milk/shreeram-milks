import { router } from "expo-router";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { StatusBar, View } from "react-native";
import Animated, { FadeOut, LinearTransition, ReduceMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../../src/components/atoms/AppIcon";
import { Button } from "../../src/components/atoms/Button";
import { Card } from "../../src/components/atoms/Card";
import { ThemedText } from "../../src/components/atoms/ThemedText";
import { QuantityStepper } from "../../src/components/molecules/QuantityStepper";
import { useAddresses, pickDefaultAddress } from "../../src/hooks/useAddresses";
import { useDebouncedValue } from "../../src/hooks/useDebouncedValue";
import { useQuote } from "../../src/hooks/useOrders";
import { CartIcon, LocationIcon } from "../../src/icons/appIcons";
import { getLocalizedProductName } from "../../src/lib/productLocalization";
import { useAppStore, type CartItem } from "../../src/store/useAppStore";
import { motion } from "../../src/theme/motion";
import { useTheme } from "../../src/theme";
import { remoteImage } from "../../src/lib/remoteImage";

// Fast + / − taps settle first, then the server is asked once whether everything can be delivered.
const QUOTE_PAUSE_MS = 400;
const rowExit = FadeOut.duration(motion.duration.quick).reduceMotion(ReduceMotion.System);
const rowLayout = LinearTransition.duration(motion.duration.normal).reduceMotion(ReduceMotion.System);

function BillRow({ label, value, valueColor, strong = false }: { label: string; value: string; valueColor?: string; strong?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
      <ThemedText variant={strong ? "body" : "bodySmall"} weight={strong ? "extrabold" : "regular"} style={{ color: strong ? theme.colors.colorTextPrimary : theme.colors.colorTextSecondary }}>{label}</ThemedText>
      <ThemedText variant={strong ? "body" : "bodySmall"} weight={strong ? "extrabold" : "semibold"} style={{ color: valueColor ?? theme.colors.colorTextPrimary, fontVariant: ["tabular-nums"] }}>{value}</ThemedText>
    </View>
  );
}

export default function CartScreen() {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const cart = useAppStore((state) => state.cart);
  const updateQuantity = useAppStore((state) => state.updateCartQuantity);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  // Which items the chosen (or default) address cannot receive, asked of the same server check that checkout uses.
  const { data: addresses = [] } = useAddresses();
  const selectedAddressId = useAppStore((state) => state.checkoutSelection.addressId);
  const address = addresses.find((item) => item.id === selectedAddressId) ?? pickDefaultAddress(addresses);
  const settledCart = useDebouncedValue(cart, QUOTE_PAUSE_MS);
  const delivery = useQuote(address && settledCart.length > 0 ? { addressId: address.id, lines: settledCart.map((item) => ({ variantId: item.product.id, quantity: item.quantity, ...(item.slotId ? { slotId: item.slotId } : {}) })), slots: {} } : null);
  const blockedIds = new Set(delivery.data?.unavailable.map((item) => item.variantId) ?? []);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderItem = ({ item }: { item: CartItem }) => (
    <Animated.View exiting={rowExit} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4, paddingVertical: theme.spacing.md - 4, borderBottomWidth: theme.borderWidths.hairline, borderBottomColor: theme.colors.colorBorder }}>
      <View style={{ width: 60, height: 60, overflow: "hidden", borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }}>
        {item.product.imageUrl ? <Image source={remoteImage(item.product.imageUrl)} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText variant="bodySmall" weight="bold" numberOfLines={2}>{getLocalizedProductName(item.product, i18n.resolvedLanguage ?? i18n.language)}</ThemedText>
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{item.product.unit} · ₹{item.product.price}</ThemedText>
        {blockedIds.has(item.product.id) ? (
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorDanger }}>{t("shop.cartNotDelivered", { pin: address?.pincode ?? "" })}</ThemedText>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: theme.spacing.sm - 2 }}>
        <ThemedText variant="bodySmall" weight="extrabold" style={{ fontVariant: ["tabular-nums"] }}>₹{item.product.price * item.quantity}</ThemedText>
        <QuantityStepper value={item.quantity} onDecrement={() => updateQuantity(item.product.id, item.quantity - 1)} onIncrement={() => updateQuantity(item.product.id, item.quantity + 1)} />
      </View>
    </Animated.View>
  );

  const header = (
    <View style={{ gap: theme.spacing.md - 4, paddingBottom: theme.spacing.xs }}>
      {address ? (
        <Card tone="highlight" style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md - 4, padding: theme.spacing.md - 4 }}>
          <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.md - 2, backgroundColor: theme.colors.colorSurface }}>
            <AppIcon icon={LocationIcon} accessibilityLabel="" size="sm" tone="accent" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText variant="overline" style={{ color: theme.colors.colorAccent, textTransform: "uppercase", letterSpacing: 0.6 }}>{t("home.deliveryLocation")}</ThemedText>
            <ThemedText variant="bodySmall" weight="bold" numberOfLines={1}>{[address.line2 || address.line1, address.pincode].filter(Boolean).join(" · ")}</ThemedText>
          </View>
        </Card>
      ) : null}
      {blockedIds.size > 0 ? (
        <Card tone="accent" accessibilityRole="alert" style={{ gap: theme.spacing.xs }}>
          <ThemedText variant="bodySmall" weight="bold" style={{ color: theme.colors.colorHighlightText }}>{t("shop.cartBlockedTitle", { count: blockedIds.size })}</ThemedText>
          <ThemedText variant="caption" style={{ color: theme.colors.colorHighlightText }}>{t("shop.cartBlockedDetail", { pin: address?.pincode ?? "" })}</ThemedText>
        </Card>
      ) : null}
    </View>
  );

  const footer = (
    <Card style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
      <ThemedText variant="label" weight="bold">{t("cart.billDetails")}</ThemedText>
      <BillRow label={t("cart.subtotal")} value={`₹${total}`} />
      <BillRow label={t("cart.delivery")} value={t("cart.free")} valueColor={theme.colors.colorAccent} />
      <View style={{ height: 0, borderTopWidth: 1.5, borderStyle: "dashed", borderColor: theme.colors.colorBorder, marginVertical: theme.spacing.xs }} />
      <BillRow label={t("cart.total")} value={`₹${total}`} strong />
    </Card>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md - 4 }}>
        <ThemedText variant="h1">{t("cart.title")}</ThemedText>
        {itemCount > 0 ? <ThemedText variant="label" style={{ color: theme.colors.colorTextSecondary }}>{itemCount} {t("cart.items")}</ThemedText> : null}
      </View>
      {cart.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.md - 4, paddingHorizontal: theme.spacing.xl }}>
          <View style={{ width: 88, height: 88, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorPrimaryTint }}>
            <AppIcon icon={CartIcon} accessibilityLabel="" size="lg" tone="brand" />
          </View>
          <ThemedText variant="h2" style={{ textAlign: "center" }}>{t("cart.emptyTitle")}</ThemedText>
          <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary, textAlign: "center" }}>{t("cart.emptyDetail")}</ThemedText>
          <Button style={{ alignSelf: "center", marginTop: theme.spacing.sm }} onPress={() => router.navigate("/products")}>{t("cart.browse")}</Button>
        </View>
      ) : (
        <Animated.FlatList
          data={cart}
          keyExtractor={(item) => item.product.id}
          renderItem={renderItem}
          itemLayoutAnimation={rowLayout}
          contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.lg }}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          showsVerticalScrollIndicator={false}
        />
      )}
      {cart.length > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md, paddingHorizontal: theme.layout.screenHorizontalPadding, paddingVertical: theme.spacing.md - 4, backgroundColor: theme.colors.colorSurface, borderTopWidth: theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
          <View>
            <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("cart.toPay")}</ThemedText>
            <ThemedText variant="h2" weight="extrabold" style={{ fontVariant: ["tabular-nums"] }}>₹{total}</ThemedText>
          </View>
          <Button style={{ flex: 1, maxWidth: 200 }} onPress={() => router.push("/checkout-address")}>{t("cart.checkout")}</Button>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
