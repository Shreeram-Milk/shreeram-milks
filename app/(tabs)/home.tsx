import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../../src/components/atoms/AppIcon";
import { PressableScale } from "../../src/components/atoms/PressableScale";
import { RiseIn } from "../../src/components/atoms/RiseIn";
import { ThemedText } from "../../src/components/atoms/ThemedText";
import { ThemedView } from "../../src/components/atoms/ThemedView";
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
import { useGreetingPart } from "../../src/hooks/useGreeting";
import { useBanners, useFeatureFlags } from "../../src/hooks/useContent";
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
  const greeting = t(`home.greetings.${useGreetingPart()}`);
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
    <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      <ThemedView style={{ marginHorizontal: -theme.layout.screenHorizontalPadding, paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.colorPrimaryTint, borderBottomLeftRadius: theme.radii.xl, borderBottomRightRadius: theme.radii.xl, borderBottomWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md }}>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            {firstName ? <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{greeting}</ThemedText> : null}
            <ThemedText variant="h1" numberOfLines={1}>{firstName || greeting}</ThemedText>
          </View>
          <NotificationBell />
        </View>
        <View accessible accessibilityLabel={`${t("home.deliveryLocation")}: ${locationText}`} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <AppIcon icon={LocationIcon} accessibilityLabel="" size="sm" tone="accent" />
          <ThemedText variant="bodySmall" weight="medium" numberOfLines={1} style={{ flex: 1, color: theme.colors.colorTextSecondary }}>{locationText}</ThemedText>
        </View>
        <PressableScale
          accessibilityRole="search"
          accessibilityLabel={t("search.placeholder")}
          onPress={() => router.push("/search")}
          style={{ minHeight: theme.sizes.inputHeight, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder }}
        >
          <AppIcon icon={SearchIcon} accessibilityLabel="" size="sm" tone="secondary" />
          <ThemedText variant="bodySmall" style={{ flex: 1, color: theme.colors.colorTextSecondary }} numberOfLines={1}>{t("search.placeholder")}</ThemedText>
        </PressableScale>
      </ThemedView>
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
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.colorPrimaryTint }}>
      <StatusBar barStyle="dark-content" />
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
    </SafeAreaView>
  );
}
