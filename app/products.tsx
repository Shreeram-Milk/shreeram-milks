import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryChips } from "../src/components/molecules/CategoryChips";
import { ScreenHeader } from "../src/components/molecules/ScreenHeader";
import { BottomNavigation } from "../src/components/organisms/BottomNavigation";
import { CatalogProductCard } from "../src/components/organisms/CatalogProductCard";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { useCatalogCart } from "../src/hooks/useCatalogCart";
import { useCatalogCategories, useCatalogProducts } from "../src/hooks/useCatalog";
import {
  CartIcon,
  CalendarIcon,
  HomeIcon,
  ProductsIcon,
  ProfileIcon,
} from "../src/icons/appIcons";
import { localized } from "../src/lib/contentLocalization";
import { useTheme } from "../src/theme";
import type { CatalogProduct } from "../src/types/catalog";
import { useAppStore } from "../src/store/useAppStore";

export default function ProductsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const { data: products = [], isError, isLoading, refetch } = useCatalogProducts(activeCategoryId);
  const { data: categories = [] } = useCatalogCategories();
  const { isAdded, onAdd, onRemove, openProduct } = useCatalogCart();
  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  const activeCategoryName = activeCategory ? localized(activeCategory.name, activeCategory.nameGu, language) : t("home.categories.all");

  const renderProduct = ({ item }: { item: CatalogProduct }) => (
    <View style={{ flex: 1, marginBottom: theme.spacing.md }}>
      <CatalogProductCard isAdded={isAdded(item)} product={item} onAdd={onAdd} onRemove={onRemove} onPress={openProduct} />
    </View>
  );

  const header = (
    <View
      style={{
        gap: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.md,
      }}
    >
      <ScreenHeader backLabel={t("products.back")} title={t("products.title")} />
      <CategoryChips categories={categories} language={language} selectedId={activeCategoryId} onSelect={setActiveCategoryId} />
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: theme.spacing.md }}>
        {isLoading ? (
          <StateMessage type="loading" title={t("products.loading")} />
        ) : isError ? (
          <StateMessage
            type="error"
            title={t("products.error")}
            description={t("products.errorDetail")}
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
            ListHeaderComponent={header}
            ListEmptyComponent={
              <StateMessage
                type="empty"
                title={activeCategory ? t("products.empty", { category: activeCategoryName }) : t("products.emptyAll")}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      <BottomNavigation
        activeKey="products"
        onChange={(key) => {
          if (key === "home") router.replace("/home");
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
