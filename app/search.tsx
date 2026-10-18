import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon } from "../src/components/atoms/AppIcon";
import { AppInput } from "../src/components/atoms/AppInput";
import { IconButton } from "../src/components/atoms/IconButton";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { CategoryChips } from "../src/components/molecules/CategoryChips";
import { CatalogProductCard } from "../src/components/organisms/CatalogProductCard";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { BackIcon, CartIcon, SearchIcon } from "../src/icons/appIcons";
import { useCatalogCart } from "../src/hooks/useCatalogCart";
import { useDebouncedValue } from "../src/hooks/useDebouncedValue";
import { useCatalogCategories, useCatalogProducts } from "../src/hooks/useCatalog";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import { isSpacer, padToColumns, type GridSpacer } from "../src/lib/gridList";
import type { CatalogProduct } from "../src/types/catalog";

const SEARCH_PAUSE_MS = 300;

export default function SearchScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  // Waits for a pause in typing before asking the server, so each keystroke does not become a request.
  const search = useDebouncedValue(query.trim(), SEARCH_PAUSE_MS);
  const { data: results = [], isError, isLoading, refetch } = useCatalogProducts(categoryId, search);
  const { data: categories = [] } = useCatalogCategories();
  const { isAdded, onAdd, onRemove, openProduct } = useCatalogCart();
  const renderItem = ({ item }: { item: CatalogProduct | GridSpacer }) =>
    isSpacer(item) ? (
      <View style={{ flex: 1 }} />
    ) : (
      <View style={{ flex: 1, marginBottom: theme.spacing.sm }}>
        <CatalogProductCard product={item} isAdded={isAdded(item)} onAdd={onAdd} onRemove={onRemove} onPress={openProduct} />
      </View>
    );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={padToColumns(results)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: theme.spacing.sm }}
        contentContainerStyle={{
          padding: theme.layout.screenHorizontalPadding,
          paddingBottom: theme.spacing.xxl,
        }}
        ListHeaderComponent={
          <View
            style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}
          >
            <View
              style={{
                minHeight: theme.sizes.buttonHeight,
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <IconButton
                icon={BackIcon}
                label={t("search.back")}
                onPress={() => router.back()}
              />
              <ThemedText variant="h2" style={{ flex: 1 }}>
                {t("search.title")}
              </ThemedText>
              <IconButton
                icon={CartIcon}
                label={t("search.cart")}
                onPress={() => router.push("/cart")}
              />
            </View>
            <View style={{ position: "relative" }}>
              <AppInput
                value={query}
                onChangeText={setQuery}
                accessibilityLabel={t("search.placeholder")}
                placeholder={t("search.placeholder")}
                style={{ paddingLeft: theme.sizes.iconLg + theme.spacing.md }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: theme.spacing.md,
                  top: theme.spacing.md,
                }}
              >
                <AppIcon
                  icon={SearchIcon}
                  accessibilityLabel=""
                  size="sm"
                  tone="secondary"
                />
              </View>
            </View>
            <CategoryChips categories={categories} language={language} selectedId={categoryId} onSelect={setCategoryId} />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <ThemedText variant="bodySmall" weight="semibold">
                {t("search.offerings")}
              </ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <StateMessage type="loading" title={t("search.loading")} />
          ) : (
            <StateMessage
              type={isError ? "error" : "empty"}
              title={isError ? t("search.error") : t("search.empty")}
              actionLabel={isError ? t("common.retry") : undefined}
              onAction={isError ? () => refetch() : undefined}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
