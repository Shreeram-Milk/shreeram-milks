import { router } from "expo-router";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { StatusBar, View } from "react-native";
import Animated, { FadeOut, LinearTransition, ReduceMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../../src/components/atoms/AppIcon";
import { Button } from "../../src/components/atoms/Button";
import { ThemedText } from "../../src/components/atoms/ThemedText";
import { QuantityStepper } from "../../src/components/molecules/QuantityStepper";
import { useAddresses, pickDefaultAddress } from "../../src/hooks/useAddresses";
import { useDebouncedValue } from "../../src/hooks/useDebouncedValue";
import { useQuote } from "../../src/hooks/useOrders";
import { useMyWallet } from "../../src/hooks/useWallet";
import { useVariantImages } from "../../src/hooks/useCatalog";
import { CartIcon, LocationIcon } from "../../src/icons/appIcons";
import { formatRupees } from "../../src/lib/catalogCart";
import { getLocalizedProductName } from "../../src/lib/productLocalization";
import { useAppStore, type CartItem } from "../../src/store/useAppStore";
import { motion } from "../../src/theme/motion";
import { useTheme } from "../../src/theme";
import { remoteImage } from "../../src/lib/remoteImage";

// Fast + / − taps settle first, then the server is asked once whether everything can be delivered.
const QUOTE_PAUSE_MS = 400;
const rowExit = FadeOut.duration(motion.duration.quick).reduceMotion(ReduceMotion.System);
const rowLayout = LinearTransition.duration(motion.duration.normal).reduceMotion(ReduceMotion.System);

function BillRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
      <ThemedText variant="bodySmall" style={{ flex: 1, color: theme.colors.colorTextSecondary }}>{label}</ThemedText>
      <ThemedText variant="bodySmall" weight="semibold" style={{ color: valueColor ?? theme.colors.colorTextPrimary, fontVariant: ["tabular-nums"] }}>{value}</ThemedText>
    </View>
  );
}

export default function CartScreen() {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const cart = useAppStore((state) => state.cart);
  const updateQuantity = useAppStore((state) => state.updateCartQuantity);
  const wallet = useMyWallet();
  const variantImages = useVariantImages();
  const estimatedSubtotalPaise = cart.reduce((sum, item) => sum + Math.round(item.product.price * 100) * item.quantity, 0);
  // Which items the chosen (or default) address cannot receive, asked of the same server check that checkout uses.
  const { data: addresses = [] } = useAddresses();
  const selectedAddressId = useAppStore((state) => state.checkoutSelection.addressId);
  const address = addresses.find((item) => item.id === selectedAddressId) ?? pickDefaultAddress(addresses);
  const settledCart = useDebouncedValue(cart, QUOTE_PAUSE_MS);
  const delivery = useQuote(address && settledCart.length > 0 ? { addressId: address.id, lines: settledCart.map((item) => ({ variantId: item.product.id, quantity: item.quantity, ...(item.slotId ? { slotId: item.slotId } : {}) })), slots: {} } : null);
  const quote = address && settledCart === cart && !delivery.isPlaceholderData ? delivery.data : undefined;
  const blockedIds = new Set(quote?.unavailable.map((item) => item.variantId));
  const everyItemBlocked = cart.length > 0 && cart.every((item) => blockedIds.has(item.product.id));
  const subtotalPaise = quote?.orders.reduce((sum, order) => sum + order.totalPaise + order.discountPaise, 0) ?? estimatedSubtotalPaise;
  const discountPaise = quote?.orders.reduce((sum, order) => sum + order.discountPaise, 0) ?? 0;
  const totalPaise = quote?.totalPaise ?? estimatedSubtotalPaise;
  const quotedPaise = new Map<string, number>();
  for (const order of quote?.orders ?? []) {
    for (const line of order.items) {
      if (!line.isGift) quotedPaise.set(line.variantId, line.unitPricePaise);
    }
  }
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderItem = ({ item }: { item: CartItem }) => {
    const unitPaise = quotedPaise.get(item.product.id) ?? Math.round(item.product.price * 100);
    return (
      <Animated.View exiting={rowExit} style={{ flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.md - 4, paddingVertical: theme.spacing.md, borderBottomWidth: theme.borderWidths.hairline, borderBottomColor: theme.colors.colorBorder }}>
        <View style={{ width: 52, height: 64, overflow: "hidden", borderTopLeftRadius: 26, borderTopRightRadius: 26, borderBottomLeftRadius: theme.radii.sm * 2, borderBottomRightRadius: theme.radii.sm * 2, backgroundColor: theme.colors.colorSurfaceTile }}>
          {(variantImages.get(item.product.id) ?? item.product.imageUrl) ? <Image source={remoteImage(variantImages.get(item.product.id) ?? item.product.imageUrl)} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : null}
        </View>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: theme.spacing.sm }}>
            <ThemedText variant="bodySmall" weight="bold" style={{ flex: 1 }}>{getLocalizedProductName(item.product, i18n.resolvedLanguage ?? i18n.language)}</ThemedText>
            <ThemedText variant="bodySmall" weight="bold" style={{ fontVariant: ["tabular-nums"] }}>{formatRupees(unitPaise * item.quantity)}</ThemedText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
            <ThemedText variant="caption" style={{ flex: 1, color: theme.colors.colorTextSecondary }}>{item.product.unit} · {formatRupees(unitPaise)}</ThemedText>
            <QuantityStepper value={item.quantity} onDecrement={() => updateQuantity(item.product.id, item.quantity - 1)} onIncrement={() => updateQuantity(item.product.id, item.quantity + 1)} />
          </View>
          {blockedIds.has(item.product.id) ? (
            <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorDanger }}>{t("shop.cartNotDelivered", { pin: address?.pincode ?? "" })}</ThemedText>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  const header = (
    <View style={{ gap: theme.spacing.md - 4, paddingBottom: theme.spacing.xs }}>
      {address ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.md, borderBottomWidth: theme.borderWidths.hairline, borderBottomColor: theme.colors.colorBorder }}>
          <AppIcon icon={LocationIcon} accessibilityLabel="" size="sm" tone="secondary" />
          <ThemedText variant="bodySmall" style={{ flex: 1, color: theme.colors.colorTextSecondary }}>
            <ThemedText variant="bodySmall" weight="semibold">{t("home.deliveryLocation")} · </ThemedText>
            {[address.line2 || address.line1, address.pincode].filter(Boolean).join(" · ")}
          </ThemedText>
        </View>
      ) : null}
      {blockedIds.size > 0 ? (
        <View accessibilityRole="alert" style={{ gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorHighlightTint }}>
          <ThemedText variant="bodySmall" weight="bold" style={{ color: theme.colors.colorHighlightText }}>{t("shop.cartBlockedTitle", { count: blockedIds.size })}</ThemedText>
          <ThemedText variant="caption" style={{ color: theme.colors.colorHighlightText }}>{t("shop.cartBlockedDetail", { pin: address?.pincode ?? "" })}</ThemedText>
        </View>
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg, padding: theme.spacing.md, borderRadius: theme.radii.xl, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
      <ThemedText variant="h2">{t("cart.billDetails")}</ThemedText>
      <BillRow label={t("cart.subtotal")} value={formatRupees(subtotalPaise)} />
      {discountPaise > 0 ? <BillRow label={t("offers.discount")} value={`−${formatRupees(discountPaise)}`} valueColor={theme.colors.colorAccent} /> : null}
      <BillRow label={t("cart.delivery")} value={t("cart.free")} valueColor={theme.colors.colorAccent} />
      {wallet.data?.enabled && wallet.data.balancePaise > 0 ? (
        <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, paddingTop: theme.spacing.xs }}>{t("wallet.cartHint", { amount: formatRupees(wallet.data.balancePaise) })}</ThemedText>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md - 4 }}>
        <ThemedText accessibilityRole="header" variant="display" weight="semibold">{t("cart.title")}</ThemedText>
        {itemCount > 0 ? <ThemedText variant="label" style={{ color: theme.colors.colorTextSecondary }}>{t("cart.itemCount", { count: itemCount })}</ThemedText> : null}
      </View>
      {cart.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.md - 4, paddingHorizontal: theme.spacing.xl }}>
          <AppIcon icon={CartIcon} accessibilityLabel="" size="md" tone="secondary" />
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
            <ThemedText variant="h2" weight="extrabold" style={{ fontVariant: ["tabular-nums"] }}>{formatRupees(totalPaise)}</ThemedText>
          </View>
          <Button disabled={everyItemBlocked} style={{ flex: 1, maxWidth: 200 }} onPress={() => { useAppStore.getState().clearBuyNow(); router.push("/checkout-address"); }}>{t("cart.checkout")}</Button>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
