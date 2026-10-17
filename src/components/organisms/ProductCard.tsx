import { memo, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

import { AppIcon } from "../atoms/AppIcon";
import { CheckIcon, AddIcon } from "../../icons/appIcons";
import { useToast } from "../../providers/ToastProvider";
import { getLocalizedProductName } from "../../lib/productLocalization";
import { useTheme } from "../../theme";
import type { Product } from "../../types/models";
import { ThemedText } from "../atoms/ThemedText";

interface ProductCardProps {
  isAdded?: boolean;
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
  onPress: (productId: string) => void;
  product: Product;
}

export const ProductCard = memo(function ProductCard({
  isAdded = false,
  onAdd,
  onRemove,
  onPress,
  product,
}: ProductCardProps) {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const cardScale = useRef(new Animated.Value(1)).current;
  const addScale = useRef(new Animated.Value(1)).current;

  const animate = (value: Animated.Value, toValue: number) =>
    Animated.timing(value, {
      toValue,
      duration: theme.motion.duration.fast,
      easing: Easing.bezier(...theme.motion.easing.standard),
      useNativeDriver: true,
    }).start();
  const productName = getLocalizedProductName(product, i18n.resolvedLanguage ?? i18n.language);

  const handleCartAction = () => {
    if (isAdded) {
      onRemove(product.id);
      showToast(t("productCard.removedToast", { product: productName }), "info");
      return;
    }
    onAdd(product.id);
    showToast(t("productCard.addedToast", { product: productName }));
  };
  const actionLabel = t(
    isAdded ? "productCard.removeAction" : "productCard.addAction",
    { product: productName },
  );

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: cardScale }] }}>
      <View
        style={{
          overflow: "hidden",
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.colorSurface,
          ...theme.elevation.card,
        }}
      >
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
            style={{
              height: theme.sizes.productCardImageSize,
              backgroundColor: theme.colors.colorSurfaceMuted,
            }}
          />
          <View
            style={{
              gap: theme.spacing.xs,
              paddingHorizontal: theme.spacing.sm,
              paddingTop: theme.spacing.sm,
            }}
          >
            <ThemedText variant="bodySmall" weight="semibold" numberOfLines={1}>
              {productName}
            </ThemedText>
            <ThemedText
              variant="caption"
              numberOfLines={1}
              style={{ color: theme.colors.colorTextSecondary }}
            >
              {product.unit}
            </ThemedText>
          </View>
        </Pressable>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: theme.spacing.sm,
          }}
        >
          <ThemedText variant="bodySmall" weight="semibold">
            {`₹${product.price}`}
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
                <View
                  style={{
                    width: theme.sizes.iconMd,
                    height: theme.sizes.iconMd,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: theme.radii.pill,
                    backgroundColor: theme.colors.colorSuccess,
                  }}
                >
                  <AppIcon
                    icon={CheckIcon}
                    accessibilityLabel=""
                    size="sm"
                    tone="onPrimary"
                  />
                </View>
              ) : (
                <AppIcon
                  icon={AddIcon}
                  accessibilityLabel=""
                  size="md"
                  tone="primary"
                />
              )}
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
});
