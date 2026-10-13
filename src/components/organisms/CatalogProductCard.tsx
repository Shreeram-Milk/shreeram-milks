import { memo, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

import { AppIcon } from "../atoms/AppIcon";
import { CheckIcon, AddIcon } from "../../icons/appIcons";
import { useToast } from "../../providers/ToastProvider";
import { formatRupees } from "../../lib/catalogCart";
import { localized } from "../../lib/contentLocalization";
import { useTheme } from "../../theme";
import type { CatalogProduct } from "../../types/catalog";
import type { AppLanguage } from "../../types/models";
import { ThemedText } from "../atoms/ThemedText";

interface CatalogProductCardProps {
  isAdded?: boolean;
  onAdd: (product: CatalogProduct) => void;
  onRemove: (product: CatalogProduct) => void;
  onPress: (productId: string) => void;
  product: CatalogProduct;
}

/** A product on a list. One size adds straight to the cart; several sizes open the product page so the customer can choose. */
export const CatalogProductCard = memo(function CatalogProductCard({ isAdded = false, onAdd, onRemove, onPress, product }: CatalogProductCardProps) {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const cardScale = useRef(new Animated.Value(1)).current;
  const addScale = useRef(new Animated.Value(1)).current;

  const animate = (value: Animated.Value, toValue: number) =>
    Animated.timing(value, { toValue, duration: theme.motion.duration.fast, easing: Easing.bezier(...theme.motion.easing.standard), useNativeDriver: true }).start();
  const language: AppLanguage = (i18n.resolvedLanguage ?? i18n.language).startsWith("gu") ? "gu" : "en";
  const productName = localized(product.name, product.nameGu, language);
  const severalSizes = product.variants.length > 1;

  const handleCartAction = () => {
    if (isAdded) {
      onRemove(product);
      showToast(t("productCard.removedToast", { product: productName }));
      return;
    }
    onAdd(product);
    // With several sizes the customer is sent to choose one, so there is nothing to confirm yet.
    if (!severalSizes) showToast(t("productCard.addedToast", { product: productName }));
  };
  const actionLabel = t(isAdded ? "productCard.removeAction" : severalSizes ? "catalog.chooseSize" : "productCard.addAction", { product: productName });
  const price = formatRupees(product.priceFromPaise);

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: cardScale }] }}>
      <View style={{ overflow: "hidden", borderRadius: theme.radii.lg, backgroundColor: theme.colors.colorSurface, ...theme.elevation.card }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={productName}
          onPress={() => onPress(product.id)}
          onPressIn={() => animate(cardScale, theme.motion.pressScale.card)}
          onPressOut={() => animate(cardScale, 1)}
        >
          <Image
            source={{ uri: product.imageUrl ?? undefined }}
            contentFit="cover"
            transition={theme.motion.duration.fast}
            style={{ height: theme.sizes.productCardImageSize, backgroundColor: theme.colors.colorPrimaryTint }}
          />
          <View style={{ gap: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, paddingTop: theme.spacing.sm }}>
            <ThemedText variant="bodySmall" weight="semibold" numberOfLines={1}>
              {productName}
            </ThemedText>
            <ThemedText variant="caption" numberOfLines={1} style={{ color: theme.colors.colorTextSecondary }}>
              {severalSizes ? t("catalog.sizes", { count: product.variants.length }) : (product.variants[0]?.name ?? "")}
            </ThemedText>
          </View>
        </Pressable>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: theme.spacing.sm }}>
          <ThemedText variant="bodySmall" weight="semibold">
            {severalSizes ? t("catalog.from", { price }) : price}
          </ThemedText>
          <Animated.View style={{ transform: [{ scale: addScale }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              accessibilityState={{ selected: isAdded }}
              onPress={handleCartAction}
              onPressIn={() => animate(addScale, theme.motion.pressScale.control)}
              onPressOut={() => animate(addScale, 1)}
              style={({ pressed }) => ({
                width: theme.layout.touchTargetMin,
                height: theme.layout.touchTargetMin,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.colors.colorTransparent,
                opacity: pressed ? theme.opacity.subdued : theme.opacity.full,
              })}
            >
              {isAdded ? (
                <View style={{ width: theme.sizes.iconMd, height: theme.sizes.iconMd, alignItems: "center", justifyContent: "center", borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorSuccess }}>
                  <AppIcon icon={CheckIcon} accessibilityLabel="" size="sm" tone="onPrimary" />
                </View>
              ) : (
                <AppIcon icon={AddIcon} accessibilityLabel="" size="md" tone="primary" />
              )}
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
});
