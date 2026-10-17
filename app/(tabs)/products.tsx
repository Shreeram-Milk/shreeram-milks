import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconButton } from "../../src/components/atoms/IconButton";
import { RiseIn } from "../../src/components/atoms/RiseIn";
import { ThemedText } from "../../src/components/atoms/ThemedText";
import { CategoryChips } from "../../src/components/molecules/CategoryChips";
import { ProductGridSkeleton } from "../../src/components/molecules/LoadingSkeletons";
import { CatalogProductCard } from "../../src/components/organisms/CatalogProductCard";
import { StateMessage } from "../../src/components/organisms/StateMessage";
import { useCatalogCart } from "../../src/hooks/useCatalogCart";
import { useCatalogCategories, useCatalogProducts } from "../../src/hooks/useCatalog";
import { SearchIcon } from "../../src/icons/appIcons";
import { localized } from "../../src/lib/contentLocalization";
import { isSpacer, padToColumns, type GridSpacer } from "../../src/lib/gridList";
import { useAppStore } from "../../src/store/useAppStore";
import { useTheme } from "../../src/theme";
import type { CatalogProduct } from "../../src/types/catalog";

export default function ProductsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const { data: products = [], isError, isLoading, isPlaceholderData, isRefetching, refetch } = useCatalogProducts(activeCategoryId);
  const { data: categories = [] } = useCatalogCategories();
  const { isAdded, onAdd, onRemove, openProduct } = useCatalogCart();
  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  const activeCategoryName = activeCategory ? localized(activeCategory.name, activeCategory.nameGu, language) : t("home.categories.all");

  const renderProduct = ({ item, index }: { item: CatalogProduct | GridSpacer; index: number }) =>
    isSpacer(item) ? (
      <View style={{ flex: 1 }} />
    ) : (
      <RiseIn index={index} style={{ flex: 1, marginBottom: theme.spacing.md - 4, opacity: isPlaceholderData ? theme.opacity.subdued : theme.opacity.full }}>
        <CatalogProductCard isAdded={isAdded(item)} product={item} onAdd={onAdd} onRemove={onRemove} onPress={openProduct} />
      </RiseIn>
    );

  const listEmpty = isLoading ? (
    <ProductGridSkeleton rows={3} />
  ) : isError ? (
    <StateMessage type="error" title={t("products.error")} description={t("products.errorDetail")} actionLabel={t("common.retry")} onAction={() => void refetch()} />
  ) : (
    <StateMessage type="empty" title={activeCategory ? t("products.empty", { category: activeCategoryName }) : t("products.emptyAll")} />
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      {/* Title and shelves stay put while the products scroll underneath. */}
      <View style={{ gap: theme.spacing.md - 4, paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md - 4, borderBottomWidth: theme.borderWidths.hairline, borderBottomColor: theme.colors.colorBorder }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <ThemedText variant="h1">{t("products.title")}</ThemedText>
          <IconButton icon={SearchIcon} label={t("search.placeholder")} filled onPress={() => router.push("/search")} />
        </View>
        <CategoryChips categories={categories} language={language} selectedId={activeCategoryId} onSelect={setActiveCategoryId} />
      </View>
      <FlatList
        data={isLoading || isError ? [] : padToColumns(products)}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: theme.spacing.md - 4 }}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={{ padding: theme.layout.screenHorizontalPadding, paddingBottom: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching && !isPlaceholderData}
        onRefresh={() => void refetch()}
      />
    </SafeAreaView>
  );
}
