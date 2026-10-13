import { router } from "expo-router";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { FlatList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { QuantityStepper } from "../src/components/molecules/QuantityStepper";
import { BottomNavigation } from "../src/components/organisms/BottomNavigation";
import {
  CartIcon,
  CalendarIcon,
  HomeIcon,
  ProductsIcon,
  ProfileIcon,
} from "../src/icons/appIcons";
import { useAppStore, type CartItem } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import { getLocalizedProductName } from "../src/lib/productLocalization";

export default function CartScreen() {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const cart = useAppStore((state) => state.cart);
  const updateQuantity = useAppStore((state) => state.updateCartQuantity);
  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const quantityControl = (item: CartItem) => (
    <QuantityStepper
      value={item.quantity}
      unit=""
      onDecrement={() => updateQuantity(item.product.id, item.quantity - 1)}
      onIncrement={() => updateQuantity(item.product.id, item.quantity + 1)}
    />
  );
  const renderItem = ({ item }: { item: CartItem }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        gap: theme.spacing.sm,
        minHeight: theme.sizes.avatarLg + theme.spacing.xxl,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: theme.borderWidths.hairline,
        borderBottomColor: theme.colors.colorBorder,
      }}
    >
      <View
        style={{
          width: theme.sizes.avatarLg + theme.spacing.sm,
          height: theme.sizes.avatarLg + theme.spacing.sm,
          overflow: "hidden",
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.colorPrimaryTint,
          alignSelf: "center",
        }}
      >
        {item.product.imageUrl ? (
          <Image
            source={{ uri: item.product.imageUrl }}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        ) : null}
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          minHeight: theme.sizes.avatarLg + theme.spacing.xl,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: theme.spacing.sm,
          }}
        >
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <ThemedText variant="bodySmall" weight="semibold" numberOfLines={1}>
              {getLocalizedProductName(
                item.product,
                i18n.resolvedLanguage ?? i18n.language,
              )}
            </ThemedText>
            <ThemedText
              variant="caption"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {item.product.unit}
            </ThemedText>
          </View>
          <ThemedText
            variant="bodySmall"
            weight="bold"
            style={{ color: theme.colors.colorPrimary }}
          >
            ₹{item.product.price * item.quantity}
          </ThemedText>
        </View>
        <View style={{ alignItems: "flex-end" }}>{quantityControl(item)}</View>
      </View>
    </View>
  );
  const footer = (
    <View style={{ gap: theme.spacing.sm, paddingTop: theme.spacing.lg }}>
      <ThemedText
        variant="overline"
        style={{ color: theme.colors.colorTextSecondary }}
      >
        {t("cart.billDetails")}
      </ThemedText>
      <View style={{ gap: theme.spacing.xs }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {t("cart.subtotal")}
          </ThemedText>
          <ThemedText variant="caption">₹{total}</ThemedText>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {t("cart.delivery")}
          </ThemedText>
          <ThemedText
            variant="caption"
            weight="semibold"
            style={{ color: theme.colors.colorPrimary }}
          >
            {t("cart.free")}
          </ThemedText>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {t("cart.discount")}
          </ThemedText>
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.colorPrimary }}
          >
            −₹0
          </ThemedText>
        </View>
      </View>
      <View
        style={{
          height: theme.borderWidths.hairline,
          backgroundColor: theme.colors.colorBorder,
          marginVertical: theme.spacing.sm,
        }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <ThemedText variant="body" weight="bold">
          {t("cart.total")}
        </ThemedText>
        <ThemedText variant="body" weight="bold">
          ₹{total}
        </ThemedText>
      </View>
    </View>
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.layout.screenHorizontalPadding,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: theme.spacing.md,
          }}
        >
          <ThemedText variant="h2">{t("cart.title")}</ThemedText>
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {itemCount} {t("cart.items")}
          </ThemedText>
        </View>
        {cart.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: theme.spacing.md,
            }}
          >
            <ThemedText variant="h2">{t("cart.emptyTitle")}</ThemedText>
            <ThemedText
              variant="bodySmall"
              style={{
                color: theme.colors.colorTextSecondary,
                textAlign: "center",
              }}
            >
              {t("cart.emptyDetail")}
            </ThemedText>
            <Button onPress={() => router.replace("/products")}>
              {t("cart.browse")}
            </Button>
          </View>
        ) : (
          <FlatList
            data={cart}
            keyExtractor={(item) => item.product.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
            ListFooterComponent={footer}
          />
        )}
      </View>
      {cart.length > 0 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing.md,
            paddingHorizontal: theme.layout.screenHorizontalPadding,
            paddingVertical: theme.spacing.sm,
            backgroundColor: theme.colors.colorSurface,
            ...theme.elevation.card,
          }}
        >
          <View>
            <ThemedText
              variant="caption"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {t("cart.toPay")}
            </ThemedText>
            <ThemedText variant="body" weight="bold">
              ₹{total}
            </ThemedText>
          </View>
          <Button
            style={{ flex: 1, maxWidth: 170 }}
            onPress={() => router.push("/checkout-address")}
          >
            {t("cart.checkout")} →
          </Button>
        </View>
      ) : null}
      <BottomNavigation
        activeKey="cart"
        onChange={(key) => {
          if (key === "home") router.replace("/home");
          if (key === "products") router.replace("/products");
          if (key === "subscriptions") router.replace("/subscriptions");
          if (key === "profile") router.replace("/profile");
        }}
        items={[
          { key: "home", label: t("navigation.home"), icon: HomeIcon },
          {
            key: "products",
            label: t("navigation.products"),
            icon: ProductsIcon,
          },
          {
            key: "subscriptions",
            label: t("navigation.subscriptions"),
            icon: CalendarIcon,
          },
          { key: "cart", label: t("navigation.cart"), icon: CartIcon },
          { key: "profile", label: t("navigation.profile"), icon: ProfileIcon },
        ]}
      />
    </SafeAreaView>
  );
}
