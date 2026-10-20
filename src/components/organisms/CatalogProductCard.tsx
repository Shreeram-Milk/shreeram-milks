import { memo, useEffect } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { AppIcon } from "../atoms/AppIcon";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";
import { CheckIcon } from "../../icons/appIcons";
import { usePrefetchCatalogProduct } from "../../hooks/useCatalog";
import { useToast } from "../../providers/ToastProvider";
import { formatRupees } from "../../lib/catalogCart";
import { localized } from "../../lib/contentLocalization";
import { tapFeedback } from "../../lib/haptics";
import { motion } from "../../theme/motion";
import { useTheme } from "../../theme";
import type { CatalogProduct } from "../../types/catalog";
import type { AppLanguage } from "../../types/models";
import { remoteImage } from "../../lib/remoteImage";

interface CatalogProductCardProps {
  isAdded?: boolean;
  onAdd: (product: CatalogProduct) => void;
  onRemove: (product: CatalogProduct) => void;
  onPress: (productId: string) => void;
  product: CatalogProduct;
}

const POP_SCALE = 1.12;

/** A product on a list. One size adds straight to the cart; several sizes open the product page so the customer can choose. */
export const CatalogProductCard = memo(function CatalogProductCard({ isAdded = false, onAdd, onRemove, onPress, product }: CatalogProductCardProps) {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const prefetch = usePrefetchCatalogProduct();
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  useEffect(() => {
    if (!isAdded) return;
    pop.value = withSequence(
      withTiming(POP_SCALE, { duration: motion.duration.instant, reduceMotion: ReduceMotion.System }),
      withSpring(1, { ...motion.spring.pop, reduceMotion: ReduceMotion.System }),
    );
  }, [isAdded, pop]);

  const language: AppLanguage = (i18n.resolvedLanguage ?? i18n.language).startsWith("gu") ? "gu" : "en";
  const productName = localized(product.name, product.nameGu, language);
  const severalSizes = product.variants.length > 1;
  const badge = product.badges[0];

  const handleCartAction = () => {
    if (isAdded) {
      onRemove(product);
      showToast(t("productCard.removedToast", { product: productName }), "info");
      return;
    }
    onAdd(product);
    // With several sizes the customer is sent to choose one, so there is nothing to confirm yet.
    if (!severalSizes) {
      tapFeedback();
      showToast(t("productCard.addedToast", { product: productName }));
    }
  };
  const actionLabel = t(isAdded ? "productCard.removeAction" : severalSizes ? "catalog.chooseSize" : "productCard.addAction", { product: productName });
  const price = formatRupees(product.priceFromPaise);

  return (
    <View style={{ flex: 1, overflow: "hidden", borderRadius: theme.radii.lg, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, backgroundColor: theme.colors.colorSurface, ...theme.elevation.card }}>
      <PressableScale accessibilityRole="button" accessibilityLabel={productName} onPress={() => onPress(product.id)} onPressIn={() => prefetch(product.id)}>
        {/* The photo runs edge to edge across the top of the card; the card's own rounded corners clip it. */}
        <View style={{ backgroundColor: theme.colors.colorSurfaceMuted }}>
          <Image source={remoteImage(product.imageUrl)} contentFit="cover" transition={theme.motion.duration.fast} style={{ width: "100%", aspectRatio: 1 }} />
          {badge ? (
            <View style={{ position: "absolute", top: theme.spacing.sm, left: theme.spacing.sm, borderRadius: theme.radii.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: 3, backgroundColor: theme.colors.colorAccent }}>
              <ThemedText variant="caption" weight="bold" numberOfLines={1} style={{ color: theme.colors.colorTextInverse }}>{badge}</ThemedText>
            </View>
          ) : null}
        </View>
        <View style={{ gap: 2, paddingHorizontal: theme.spacing.sm + 2, paddingTop: theme.spacing.sm + 2 }}>
          <ThemedText variant="label" weight="bold" numberOfLines={1}>{productName}</ThemedText>
          <ThemedText variant="caption" numberOfLines={1} style={{ color: theme.colors.colorTextSecondary }}>
            {severalSizes ? t("catalog.sizes", { count: product.variants.length }) : (product.variants[0]?.name ?? "")}
          </ThemedText>
        </View>
      </PressableScale>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing.xs, paddingLeft: theme.spacing.sm + 2, paddingRight: theme.spacing.sm, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.sm + 2 }}>
        <ThemedText variant="label" weight="extrabold" numberOfLines={1} style={{ flexShrink: 1, fontVariant: ["tabular-nums"] }}>
          {severalSizes ? t("catalog.from", { price }) : price}
        </ThemedText>
        <Animated.View style={popStyle}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            accessibilityState={{ selected: isAdded }}
            onPress={handleCartAction}
            pressScale={theme.motion.pressScale.compactControl}
            hitSlop={theme.spacing.xs}
            style={{
              minHeight: 32,
              minWidth: 64,
              flexDirection: "row",
              gap: 3,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: theme.spacing.sm + 2,
              borderRadius: theme.radii.sm * 2 + 2,
              backgroundColor: isAdded ? theme.colors.colorPrimary : theme.colors.colorPrimaryTint,
            }}
          >
            {isAdded ? <AppIcon icon={CheckIcon} accessibilityLabel="" size="sm" tone="onPrimary" strong /> : null}
            <ThemedText variant="badgeLabel" numberOfLines={1} style={{ color: isAdded ? theme.colors.colorTextInverse : theme.colors.colorPrimary, letterSpacing: 0.4 }}>
              {t(isAdded ? "productCard.added" : severalSizes ? "productCard.options" : "productCard.add")}
            </ThemedText>
          </PressableScale>
        </Animated.View>
      </View>
    </View>
  );
});
