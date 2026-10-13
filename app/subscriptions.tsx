import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Button } from "../src/components/atoms/Button";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { BottomNavigation } from "../src/components/organisms/BottomNavigation";
import { ProductCard } from "../src/components/organisms/ProductCard";
import { useProducts } from "../src/hooks/useProducts";
import {
  CalendarIcon,
  CartIcon,
  HomeIcon,
  NotificationIcon,
  ProductsIcon,
  ProfileIcon,
} from "../src/icons/appIcons";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import type { Product } from "../src/types/models";

type Tab = "active" | "paused" | "ended";

interface Subscription {
  id: string;
  nameKey: string;
  nextDeliveryKey: string;
  price: number;
  tagKey: "subscription" | "trial";
}

const activeSubscriptions: Subscription[] = [
  {
    id: "a2-cow-milk",
    nameKey: "subscriptionVacation.a2Milk",
    tagKey: "subscription",
    nextDeliveryKey: "subscriptionManage.nextDeliveryValue",
    price: 85,
  },
  {
    id: "buffalo-milk",
    nameKey: "subscriptionVacation.buffaloMilk",
    tagKey: "subscription",
    nextDeliveryKey: "subscriptionManage.nextDeliveryValue",
    price: 95,
  },
  {
    id: "premium-curd",
    nameKey: "subscriptionsManage.premiumCurd",
    tagKey: "trial",
    nextDeliveryKey: "subscriptionsManage.thursdayDelivery",
    price: 65,
  },
];

const tabLabels: { key: Tab; labelKey: string }[] = [
  { key: "active", labelKey: "subscriptions.tabs.active" },
  { key: "paused", labelKey: "subscriptions.tabs.paused" },
  { key: "ended", labelKey: "subscriptions.tabs.ended" },
];

const SubscriptionCard = memo(function SubscriptionCard({
  subscription,
}: {
  subscription: Subscription;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [skipped, setSkipped] = useState(false);
  const name = t(subscription.nameKey);
  const tag = t(`purchasePlans.${subscription.tagKey === "trial" ? "trial" : "subscription"}`);
  return (
    <View
      style={[
        {
          minHeight:
            theme.sizes.productCardImageSize +
            theme.sizes.buttonHeight +
            theme.spacing.lg +
            theme.spacing.md,
          gap: theme.spacing.xs,
          padding: theme.spacing.sm,
          justifyContent: "space-between",
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.colorSurface,
        },
        theme.elevation.card,
      ]}
    >
      <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
        <View
          style={{
            width: theme.sizes.productCardImageSize,
            height: theme.sizes.productCardImageSize,
            overflow: "hidden",
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.colorPrimaryTint,
          }}
        >
          <Image
            source={require("../assets/onboarding-milk-hero.png")}
            contentFit="cover"
            transition={theme.motion.duration.normal}
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <View
            style={{
              alignSelf: "flex-start",
              borderRadius: theme.radii.pill,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              backgroundColor: theme.colors.colorSurfaceMuted,
            }}
          >
            <ThemedText
              variant="caption"
              weight="semibold"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              ● {tag}
            </ThemedText>
          </View>
          <ThemedText variant="body" weight="semibold" numberOfLines={2}>
            {name}
          </ThemedText>
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            ▣ {skipped ? t("subscriptionsManage.skipped") : t("subscriptionsManage.nextDelivery", { date: t(subscription.nextDeliveryKey) })}
          </ThemedText>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: theme.spacing.md,
        }}
      >
        <View style={{ width: theme.sizes.productCardImageSize }}>
          <ThemedText
            variant="caption"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {t("subscriptionsManage.planPrice")}
          </ThemedText>
          <ThemedText variant="body" weight="semibold">
            ₹{subscription.price}
            <ThemedText
              variant="caption"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {" "}
              {t("subscriptionsManage.perDay")}
            </ThemedText>
          </ThemedText>
        </View>
        <View style={{ flex: 1, flexDirection: "row", gap: theme.spacing.sm }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("subscriptionsManage.skip", { product: name })}
            onPress={() => setSkipped((current) => !current)}
            style={{
              flex: 1,
              minHeight: theme.layout.touchTargetMin,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radii.lg,
              paddingHorizontal: theme.spacing.sm,
              backgroundColor: theme.colors.colorSurfaceMuted,
            }}
          >
            <ThemedText variant="caption" weight="semibold">
              {t("subscriptionsManage.skipNext")}
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("subscriptionsManage.manage", { product: name })}
            onPress={() => router.push("/subscription-manage")}
            style={{
              flex: 1,
              minHeight: theme.layout.touchTargetMin,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radii.lg,
              paddingHorizontal: theme.spacing.sm,
              backgroundColor: theme.colors.colorPrimary,
            }}
          >
            <ThemedText
              variant="caption"
              weight="semibold"
              style={{ color: theme.colors.colorTextInverse }}
            >
              {t("subscriptionsManage.manageLabel")}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

function EmptySubscriptions({ products }: { products: Product[] }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const cart = useAppStore((state) => state.cart);
  const addToCart = useAppStore((state) => state.addToCart);
  const removeFromCart = useAppStore((state) => state.removeFromCart);
  const dailyProducts = useMemo(() => products.slice(0, 2), [products]);
  return (
    <View style={{ gap: theme.spacing.lg, paddingVertical: theme.spacing.md }}>
      <View
        style={{
          alignItems: "center",
          gap: theme.spacing.md,
          paddingTop: theme.spacing.lg,
        }}
      >
        <View
          style={[
            {
              width: theme.sizes.avatarLg * 2,
              height: theme.sizes.avatarLg * 2,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.colorSurface,
            },
            theme.elevation.card,
          ]}
        >
          <AppIcon
            icon={ProductsIcon}
            accessibilityLabel={t("subscriptions.emptyIcon")}
            size="lg"
          />
        </View>
        <ThemedText variant="h2">{t("subscriptions.emptyTitle")}</ThemedText>
        <ThemedText
          variant="bodySmall"
          style={{
            color: theme.colors.colorTextSecondary,
            textAlign: "center",
          }}
        >
          {t("subscriptions.emptyDetail")}
        </ThemedText>
        <Button onPress={() => router.push("/products")}>
          {t("subscriptions.browse")}
        </Button>
      </View>
      <View
        style={{
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.colorSurface,
        }}
      >
        <ThemedText variant="bodySmall" weight="semibold">
          {t("subscriptions.perks")}
        </ThemedText>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.spacing.sm,
          }}
        >
          <ThemedText
            variant="caption"
            style={{
              borderRadius: theme.radii.pill,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              backgroundColor: theme.colors.colorSurfaceMuted,
            }}
          >
            {t("subscriptions.perkDelivery")}
          </ThemedText>
          <ThemedText
            variant="caption"
            style={{
              borderRadius: theme.radii.pill,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              backgroundColor: theme.colors.colorSurfaceMuted,
            }}
          >
            {t("subscriptions.perkPause")}
          </ThemedText>
          <ThemedText
            variant="caption"
            style={{
              borderRadius: theme.radii.pill,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              backgroundColor: theme.colors.colorSurfaceMuted,
            }}
          >
            {t("subscriptions.perkBottles")}
          </ThemedText>
        </View>
      </View>
      <View style={{ gap: theme.spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <ThemedText variant="body" weight="semibold">
            {t("subscriptions.popular")}
          </ThemedText>
          <Pressable onPress={() => router.push("/products")}>
            <ThemedText
              variant="caption"
              weight="semibold"
              style={{ color: theme.colors.colorPrimary }}
            >
              {t("home.seeAll")}
            </ThemedText>
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {dailyProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAdded={cart.some((item) => item.product.id === product.id)}
              onAdd={() => addToCart(product)}
              onRemove={removeFromCart}
              onPress={(productId) => router.push({ pathname: "/product-details", params: { productId } })}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function SubscriptionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: products = [] } = useProducts();
  const [tab, setTab] = useState<Tab>("active");
  const vacationPause = useAppStore((state) => state.vacationPause);
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const pausedIds = vacationPause && todayKey >= vacationPause.from && todayKey < vacationPause.resumeOn ? vacationPause.subscriptionIds : [];
  const data = tab === "active" ? activeSubscriptions.filter((item) => !pausedIds.includes(item.id)) : tab === "paused" ? activeSubscriptions.filter((item) => pausedIds.includes(item.id)) : [];
  const renderItem = useCallback(
    ({ item }: { item: Subscription }) => (
      <SubscriptionCard subscription={item} />
    ),
    [],
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: theme.layout.screenHorizontalPadding,
            paddingVertical: theme.spacing.md,
            backgroundColor: theme.colors.colorBackground,
          }}
        >
          <ThemedText variant="h1">{t("subscriptions.title")}</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("home.notifications")}
            onPress={() => router.push("/settings")}
            style={{
              width: theme.layout.touchTargetMin,
              height: theme.layout.touchTargetMin,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radii.pill,
            }}
          >
            <AppIcon icon={NotificationIcon} accessibilityLabel="" size="md" />
          </Pressable>
        </View>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            gap: theme.spacing.md,
            padding: theme.spacing.md,
            paddingBottom: theme.spacing.lg,
          }}
          ListHeaderComponent={
            <View style={{ gap: theme.spacing.md }}>
              <View
                style={{
                  flexDirection: "row",
                  padding: theme.spacing.xs,
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.colorSurface,
                }}
              >
                {tabLabels.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: tab === item.key }}
                    onPress={() => {
                      setTab(item.key);
                    }}
                    style={{
                      flex: 1,
                      minHeight: theme.layout.touchTargetMin,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: theme.radii.pill,
                      backgroundColor:
                        tab === item.key
                          ? theme.colors.colorPrimary
                          : theme.colors.colorTransparent,
                    }}
                  >
                    <ThemedText
                      variant="caption"
                      weight={tab === item.key ? "semibold" : "regular"}
                      style={{
                        color:
                          tab === item.key
                            ? theme.colors.colorTextInverse
                            : theme.colors.colorTextSecondary,
                      }}
                    >
                      {t(item.labelKey)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              {data.length > 0 ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push("/subscription-vacation")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: theme.spacing.md,
                      padding: theme.spacing.md,
                      borderRadius: theme.radii.lg,
                      borderWidth: theme.borderWidths.hairline,
                      borderColor: theme.colors.colorBorder,
                      backgroundColor: theme.colors.colorSurface,
                    }}
                  >
                    <View
                      style={{
                        width: theme.sizes.avatarMd,
                        height: theme.sizes.avatarMd,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: theme.radii.pill,
                        backgroundColor: theme.colors.colorSurfaceMuted,
                      }}
                    >
                      <AppIcon
                        icon={CalendarIcon}
                        accessibilityLabel={t("subscriptions.pause")}
                        tone="secondary"
                        size="sm"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        variant="body"
                        weight="semibold"
                        style={{ color: theme.colors.colorTextPrimary }}
                      >
                        {t("subscriptions.awayTitle")}
                      </ThemedText>
                      <ThemedText
                        variant="caption"
                        style={{ color: theme.colors.colorTextSecondary }}
                      >
                        {t("subscriptions.awayDetail")}
                      </ThemedText>
                    </View>
                    <View
                      style={{
                        borderRadius: theme.radii.pill,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        backgroundColor: theme.colors.colorSurfaceMuted,
                      }}
                    >
                      <ThemedText
                        variant="caption"
                        weight="semibold"
                        style={{ color: theme.colors.colorTextSecondary }}
                      >
                        {t("subscriptions.pause")}
                      </ThemedText>
                    </View>
                  </Pressable>
                </>
              ) : null}
            </View>
          }
          ListEmptyComponent={<EmptySubscriptions products={products} />}
        />
        <BottomNavigation
          activeKey="subscriptions"
          onChange={(key) => {
            if (key === "home") router.replace("/home");
            if (key === "products") router.replace("/products");
            if (key === "cart") router.replace("/cart");
            if (key === "profile") router.replace("/profile");
          }}
          items={[
            { key: "home", label: t("navigation.home"), icon: HomeIcon },
            { key: "products", label: t("navigation.products"), icon: ProductsIcon },
            {
              key: "subscriptions",
              label: t("navigation.subscriptions"),
              icon: CalendarIcon,
            },
            { key: "cart", label: t("navigation.cart"), icon: CartIcon },
            { key: "profile", label: t("navigation.profile"), icon: ProfileIcon },
          ]}
        />
      </View>
    </SafeAreaView>
  );
}
