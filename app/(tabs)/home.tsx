import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PressableScale } from "../../src/components/atoms/PressableScale";
import { RiseIn } from "../../src/components/atoms/RiseIn";
import { ThemedText } from "../../src/components/atoms/ThemedText";
import { CategoryChips } from "../../src/components/molecules/CategoryChips";
import { CreditBanner } from "../../src/components/molecules/CreditBanner";
import { ProductGridSkeleton } from "../../src/components/molecules/LoadingSkeletons";
import { NextDeliveryCard } from "../../src/components/molecules/NextDeliveryCard";
import { UpdateStrip } from "../../src/components/molecules/UpdateStrip";
import { CatalogProductCard } from "../../src/components/organisms/CatalogProductCard";
import { HomeNotices } from "../../src/components/organisms/HomeBanners";
import { HomeHero } from "../../src/components/organisms/HomeHero";
import { RewardPopup } from "../../src/components/organisms/RewardPopup";
import { PushPermissionPrompt } from "../../src/components/organisms/PushPermissionPrompt";
import { StateMessage } from "../../src/components/organisms/StateMessage";
import { pickDefaultAddress, useAddresses } from "../../src/hooks/useAddresses";
import { useCatalogCategories, useCatalogProducts } from "../../src/hooks/useCatalog";
import { useCatalogCart } from "../../src/hooks/useCatalogCart";
import { useBanners, useFeatureFlags } from "../../src/hooks/useContent";
import { localized } from "../../src/lib/contentLocalization";
import { isSpacer, padToColumns, type GridSpacer } from "../../src/lib/gridList";
import { useAppStore } from "../../src/store/useAppStore";
import { useTheme } from "../../src/theme";
import type { CatalogProduct } from "../../src/types/catalog";

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const { data: products = [], isError, isLoading, isPlaceholderData, isRefetching: productsRefetching, refetch } = useCatalogProducts(activeCategoryId);
  const { data: categories = [] } = useCatalogCategories();
  const language = useAppStore((state) => state.language);
  const deliveryPin = useAppStore((state) => state.deliveryPin);
  const { data: addresses } = useAddresses();
  const defaultAddress = pickDefaultAddress(addresses);
  const locationPin = defaultAddress?.pincode || deliveryPin;
  const locationCity = defaultAddress?.city.trim();
  const locationAddress = defaultAddress?.line2.trim() || defaultAddress?.line1.trim();
  const locationText = defaultAddress
    ? [locationAddress, locationCity, defaultAddress.pincode].filter(Boolean).join(" • ")
    : deliveryPin
      ? t("home.deliveringToPin", { pin: deliveryPin })
      : t("home.setLocation");
  const { showSeasonalBanner } = useFeatureFlags();
  const { data: banners, isRefetching: bannersRefetching, refetch: refetchBanners } = useBanners();
  // Promotions fill the top banner; the switch in the admin turns them off.
  const promotions = showSeasonalBanner ? (banners ?? []).filter((banner) => banner.type === "promotion") : [];
  const { isAdded, onAdd, onRemove, openProduct } = useCatalogCart();
  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  const activeCategoryName = activeCategory ? localized(activeCategory.name, activeCategory.nameGu, language) : t("home.categories.all");

  // While another shelf loads, the old products stay but dim, so the list never jumps to blank.
  const renderProduct = ({ item, index }: { item: CatalogProduct | GridSpacer; index: number }) =>
    isSpacer(item) ? (
      <View style={{ flex: 1 }} />
    ) : (
      <RiseIn index={index} style={{ flex: 1, marginBottom: theme.spacing.md - 4, opacity: isPlaceholderData ? theme.opacity.subdued : theme.opacity.full }}>
        <CatalogProductCard isAdded={isAdded(item)} product={item} onAdd={onAdd} onRemove={onRemove} onPress={openProduct} />
      </RiseIn>
    );

  const listHeader = (
    <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      <View style={{ marginHorizontal: -theme.layout.screenHorizontalPadding }}>
        <HomeHero promotions={promotions} language={language} locationPin={locationPin} locationCity={locationCity} locationText={locationText}>
          <NextDeliveryCard />
        </HomeHero>
      </View>
      <UpdateStrip />
      <HomeNotices banners={banners} language={language} />
      <CreditBanner />
      <CategoryChips categories={categories} language={language} selectedId={activeCategoryId} onSelect={setActiveCategoryId} />
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <ThemedText variant="h2">{t("home.picks")}</ThemedText>
        <PressableScale accessibilityRole="button" accessibilityLabel={t("home.seeAll")} hitSlop={theme.spacing.sm} onPress={() => router.push("/products")}>
          <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorPrimary }}>{t("home.seeAll")}</ThemedText>
        </PressableScale>
      </View>
    </View>
  );

  // The header is always on screen; only the product area waits, with card-shaped placeholders instead of a spinner.
  const listEmpty = isLoading ? (
    <ProductGridSkeleton />
  ) : isError ? (
    <StateMessage type="error" title={t("home.errorTitle")} description={t("home.errorDetail")} actionLabel={t("common.retry")} onAction={() => void refetch()} />
  ) : (
    <StateMessage type="empty" title={activeCategory ? t("home.empty", { category: activeCategoryName }) : t("home.emptyAll")} />
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <FlatList
        style={{ backgroundColor: theme.colors.colorBackground }}
        data={isLoading || isError ? [] : padToColumns(products)}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: theme.spacing.md - 4 }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
        refreshing={productsRefetching || bannersRefetching}
        onRefresh={() => { void refetchBanners(); void refetch(); }}
      />
      <PushPermissionPrompt />
      <RewardPopup />
    </SafeAreaView>
  );
}
