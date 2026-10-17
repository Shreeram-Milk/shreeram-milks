import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../../src/components/atoms/AppIcon";
import { PressableScale } from "../../src/components/atoms/PressableScale";
import { RiseIn } from "../../src/components/atoms/RiseIn";
import { ThemedText } from "../../src/components/atoms/ThemedText";
import { CategoryChips } from "../../src/components/molecules/CategoryChips";
import { CreditBanner } from "../../src/components/molecules/CreditBanner";
import { ProductGridSkeleton } from "../../src/components/molecules/LoadingSkeletons";
import { NextDeliveryCard } from "../../src/components/molecules/NextDeliveryCard";
import { NotificationBell } from "../../src/components/molecules/NotificationBell";
import { CatalogProductCard } from "../../src/components/organisms/CatalogProductCard";
import { HomeBanners } from "../../src/components/organisms/HomeBanners";
import { PushPermissionPrompt } from "../../src/components/organisms/PushPermissionPrompt";
import { StateMessage } from "../../src/components/organisms/StateMessage";
import { pickDefaultAddress, useAddresses } from "../../src/hooks/useAddresses";
import { useCatalogCategories, useCatalogProducts } from "../../src/hooks/useCatalog";
import { useCatalogCart } from "../../src/hooks/useCatalogCart";
import { useAppConfig, useBanners, useFeatureFlags } from "../../src/hooks/useContent";
import { LocationIcon, SearchIcon } from "../../src/icons/appIcons";
import { localized } from "../../src/lib/contentLocalization";
import { isSpacer, padToColumns, type GridSpacer } from "../../src/lib/gridList";
import { useAppStore } from "../../src/store/useAppStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { useTheme } from "../../src/theme";
import type { CatalogProduct } from "../../src/types/catalog";

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const { data: products = [], isError, isLoading, isPlaceholderData, isRefetching: productsRefetching, refetch } = useCatalogProducts(activeCategoryId);
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
  const { data: appConfig } = useAppConfig();
  const promise = appConfig ? localized(appConfig.deliveryPromiseEn, appConfig.deliveryPromiseGu, language) : "";
  const { data: banners, isLoading: bannersLoading, isRefetching: bannersRefetching, refetch: refetchBanners } = useBanners();
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
    <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText variant="h1" numberOfLines={1}>{firstName ? t("home.greeting", { name: firstName }) : t("home.greetingNoName")}</ThemedText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
            <AppIcon icon={LocationIcon} accessibilityLabel={t("home.deliveryLocation")} size="sm" tone="accent" />
            <ThemedText variant="caption" numberOfLines={1} style={{ flexShrink: 1, color: theme.colors.colorTextSecondary }}>{locationText}</ThemedText>
          </View>
          {promise ? <ThemedText variant="caption" weight="semibold" numberOfLines={2} style={{ color: theme.colors.colorAccent }}>{promise}</ThemedText> : null}
        </View>
        <NotificationBell />
      </View>
      <PressableScale
        accessibilityRole="search"
        accessibilityLabel={t("search.placeholder")}
        onPress={() => router.push("/search")}
        style={{ minHeight: theme.sizes.inputHeight, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceMuted }}
      >
        <AppIcon icon={SearchIcon} accessibilityLabel="" size="sm" tone="secondary" />
        <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }} numberOfLines={1}>{t("search.placeholder")}</ThemedText>
      </PressableScale>
      <CreditBanner />
      <NextDeliveryCard />
      {showSeasonalBanner ? <HomeBanners banners={banners} isLoading={bannersLoading} language={language} /> : null}
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
      <StatusBar barStyle="dark-content" />
      <FlatList
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
    </SafeAreaView>
  );
}
