import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { BottomNavigation } from "../src/components/organisms/BottomNavigation";
import { HomeBanners } from "../src/components/organisms/HomeBanners";
import { CategoryChips } from "../src/components/molecules/CategoryChips";
import { CatalogProductCard } from "../src/components/organisms/CatalogProductCard";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useBanners, useFeatureFlags } from "../src/hooks/useContent";
import { useCatalogCart } from "../src/hooks/useCatalogCart";
import { useCatalogCategories, useCatalogProducts } from "../src/hooks/useCatalog";
import { localized } from "../src/lib/contentLocalization";
import {
  CalendarIcon,
  CartIcon,
  HomeIcon,
  LocationIcon,
  NotificationIcon,
  ProductsIcon,
  ProfileIcon,
} from "../src/icons/appIcons";
import { useTheme } from "../src/theme";
import type { CatalogProduct } from "../src/types/catalog";
import { pickDefaultAddress, useAddresses } from "../src/hooks/useAddresses";
import { useAppStore } from "../src/store/useAppStore";
import { useSessionStore } from "../src/store/useSessionStore";

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const { data: products = [], isError, isLoading, isRefetching: productsRefetching, refetch } = useCatalogProducts(activeCategoryId);
  const { data: categories = [] } = useCatalogCategories();
  const language = useAppStore((state) => state.language);
  const customer = useSessionStore((state) => state.customer);
  const deliveryPin = useAppStore((state) => state.deliveryPin);
  const { data: addresses } = useAddresses();
  const defaultAddress = pickDefaultAddress(addresses);
  const firstName = customer?.name.trim().split(/\s+/)[0] ?? "";
  const locationText = defaultAddress
    ? [defaultAddress.line2 || defaultAddress.line1, defaultAddress.pincode].filter(Boolean).join(" • ")
    : deliveryPin
      ? t("home.deliveringToPin", { pin: deliveryPin })
      : t("home.setLocation");
  const { showSeasonalBanner } = useFeatureFlags();
  const { data: banners, isLoading: bannersLoading, isRefetching: bannersRefetching, refetch: refetchBanners } = useBanners();
  const [activeTab, setActiveTab] = useState("home");
  const { isAdded, onAdd, onRemove, openProduct } = useCatalogCart();
  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  const activeCategoryName = activeCategory ? localized(activeCategory.name, activeCategory.nameGu, language) : t("home.categories.all");
  const renderProduct = ({ item }: { item: CatalogProduct }) => (
    <View style={{ flex: 1, marginBottom: theme.spacing.md }}>
      <CatalogProductCard isAdded={isAdded(item)} product={item} onAdd={onAdd} onRemove={onRemove} onPress={openProduct} />
    </View>
  );

  const listHeader = (
    <View
      style={{
        gap: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <ThemedText variant="h2">{firstName ? t("home.greeting", { name: firstName }) : t("home.greetingNoName")}</ThemedText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.xs,
            }}
          >
            <AppIcon
              icon={LocationIcon}
              accessibilityLabel={t("home.deliveryLocation")}
              size="sm"
              tone="secondary"
            />
            <ThemedText
              variant="caption"
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {locationText}
            </ThemedText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.notifications")}
          onPress={() => router.push("/settings")}
          style={{
            width: theme.sizes.avatarMd,
            height: theme.sizes.avatarMd,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.colorSurface,
          }}
        >
          <AppIcon icon={NotificationIcon} accessibilityLabel="" size="sm" />
        </Pressable>
      </View>
      {showSeasonalBanner ? <HomeBanners banners={banners} isLoading={bannersLoading} language={language} /> : null}
      <CategoryChips categories={categories} language={language} selectedId={activeCategoryId} onSelect={setActiveCategoryId} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <ThemedText variant="h2">{t("home.picks")}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.seeAll")}
          onPress={() => router.push("/products")}
        >
          <ThemedText
            variant="bodySmall"
            weight="semibold"
            style={{ color: theme.colors.colorTextSecondary }}
          >
            {t("home.seeAll")}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.spacing.md }}>
        {isLoading ? (
          <StateMessage type="loading" title={t("home.loading")} />
        ) : isError ? (
          <StateMessage
            type="error"
            title={t("home.errorTitle")}
            description={t("home.errorDetail")}
            actionLabel={t("common.retry")}
            onAction={() => refetch()}
          />
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: theme.spacing.sm }}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <StateMessage
                type="empty"
                title={activeCategory ? t("home.empty", { category: activeCategoryName }) : t("home.emptyAll")}
              />
            }
            showsVerticalScrollIndicator={false}
            refreshing={productsRefetching || bannersRefetching}
            onRefresh={() => { void refetchBanners(); void refetch(); }}
          />
        )}
      </View>
      <BottomNavigation
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          if (key === "products") router.push("/products");
          if (key === "cart") router.push("/cart");
          if (key === "subscriptions") router.push("/subscriptions");
          if (key === "profile") router.push("/profile");
        }}
        items={[
          { key: "home", label: t("navigation.home"), icon: HomeIcon },
          { key: "products", label: t("navigation.products"), icon: ProductsIcon },
          { key: "subscriptions", label: t("navigation.subscriptions"), icon: CalendarIcon },
          { key: "cart", label: t("navigation.cart"), icon: CartIcon },
          { key: "profile", label: t("navigation.profile"), icon: ProfileIcon },
        ]}
      />
    </SafeAreaView>
  );
}
