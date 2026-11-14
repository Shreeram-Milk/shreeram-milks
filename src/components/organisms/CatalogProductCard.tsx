import { memo, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { AppIcon } from "../atoms/AppIcon";
import { PressableScale } from "../atoms/PressableScale";
import { ThemedText } from "../atoms/ThemedText";
import { AddIcon, MinusIcon } from "../../icons/appIcons";
import { usePrefetchCatalogProduct } from "../../hooks/useCatalog";
import { useToast } from "../../providers/ToastProvider";
import { formatRupees } from "../../lib/catalogCart";
import { localized } from "../../lib/contentLocalization";
import { tapFeedback } from "../../lib/haptics";
import { useTheme } from "../../theme";
import type { CatalogProduct } from "../../types/catalog";
import type { AppLanguage } from "../../types/models";
import { remoteImage } from "../../lib/remoteImage";
import { openFromCard } from "../../lib/morph";
import { SizePickerSheet } from "./SizePickerSheet";

interface CatalogProductCardProps {
  /** How many are in the cart (all sizes together). */
  quantity: number;
  onAdd: (product: CatalogProduct) => void;
  onDecrease: (product: CatalogProduct) => void;
  onPress: (productId: string) => void;
  product: CatalogProduct;
}

const BUTTON = 40;
const STEPPER = 104;
/** The round "+" grows into "− n +" with a soft spring when the first one goes into the cart. */
const GROW = { damping: 18, stiffness: 240, mass: 0.7, reduceMotion: ReduceMotion.System } as const;

/**
 * A product on a list: an arched photo, the name and size, the price (an old price sits underneath it, so the growing
 * button never covers it), and one control. One size: "+" grows into "− n +". Several sizes: "+" opens the product page to
 * choose, with how many are already in the cart.
 */
export const CatalogProductCard = memo(function CatalogProductCard({ onAdd, onDecrease, onPress, product, quantity }: CatalogProductCardProps) {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const { showToast } = useToast();
  const prefetch = usePrefetchCatalogProduct();
  const photo = useRef<View>(null);
  const language: AppLanguage = (i18n.resolvedLanguage ?? i18n.language).startsWith("gu") ? "gu" : "en";
  const productName = localized(product.name, product.nameGu, language);
  const severalSizes = product.variants.length > 1;
  const only = product.variants[0];
  const badge = product.badges[0];
  const comparePaise = !severalSizes && only?.compareAtPricePaise && only.compareAtPricePaise > only.pricePaise ? only.compareAtPricePaise : null;
  const open = !severalSizes && quantity > 0;
  const [choosing, setChoosing] = useState(false);

  const width = useSharedValue(open ? STEPPER : BUTTON);
  useEffect(() => { width.value = withSpring(open ? STEPPER : BUTTON, GROW); }, [open, width]);
  const controlStyle = useAnimatedStyle(() => ({ width: width.value }));
  const insideStyle = useAnimatedStyle(() => ({ opacity: (width.value - BUTTON) / (STEPPER - BUTTON) }));

  const add = () => {
    // Several sizes: choose one here, without leaving the list.
    if (severalSizes) { setChoosing(true); return; }
    onAdd(product);
    if (!severalSizes) {
      tapFeedback();
      if (quantity === 0) showToast(t("productCard.addedToast", { product: productName }));
    }
  };
  const price = formatRupees(product.priceFromPaise);

  return (
    <View style={{ flex: 1 }}>
      <PressableScale accessibilityRole="button" accessibilityLabel={productName} onPress={() => openFromCard(photo.current, `product:${product.id}`, theme.radii.lg, product.imageUrl, () => onPress(product.id))} onPressIn={() => prefetch(product.id)}>
        {/* An arch, taken from the logo: the top corners are as round as the card is wide. */}
        <View ref={photo} collapsable={false} style={{ overflow: "hidden", aspectRatio: 4 / 5, borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomLeftRadius: theme.radii.md, borderBottomRightRadius: theme.radii.md, backgroundColor: theme.colors.colorSurfaceTile }}>
          <Image source={remoteImage(product.imageUrl)} contentFit="cover" cachePolicy="memory-disk" transition={theme.motion.duration.fast} style={{ width: "100%", height: "100%" }} />
        </View>
        <View style={{ gap: 1, paddingTop: theme.spacing.sm + 2, paddingHorizontal: 2 }}>
          {badge ? <ThemedText variant="badgeLabel" numberOfLines={1} style={{ color: theme.colors.colorBrandText }}>{badge}</ThemedText> : null}
          <ThemedText variant="label" weight="semibold" numberOfLines={1}>{productName}</ThemedText>
          <ThemedText variant="caption" numberOfLines={1} style={{ color: theme.colors.colorTextSecondary }}>
            {severalSizes ? t("catalog.sizes", { count: product.variants.length }) : (only?.name ?? "")}
          </ThemedText>
        </View>
      </PressableScale>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing.xs, paddingTop: theme.spacing.sm, paddingLeft: 2, minHeight: BUTTON + theme.spacing.sm }}>
        <View style={{ flexShrink: 1 }}>
          <ThemedText variant="body" weight="bold" numberOfLines={1} style={{ fontVariant: ["tabular-nums"] }}>{severalSizes ? t("catalog.from", { price }) : price}</ThemedText>
          {comparePaise ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textDecorationLine: "line-through", fontVariant: ["tabular-nums"] }}>{formatRupees(comparePaise)}</ThemedText> : null}
        </View>
        <View>
        <Animated.View style={[{ height: BUTTON, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorPrimary, overflow: "hidden" }, controlStyle]}>
          {open ? (
            <Animated.View style={[{ position: "absolute", left: 0, top: 0, bottom: 0, right: BUTTON, flexDirection: "row", alignItems: "center" }, insideStyle]}>
              <PressableScale accessibilityRole="button" accessibilityLabel={t("productCard.oneLess", { product: productName })} hitSlop={theme.spacing.xs} onPress={() => onDecrease(product)} style={{ width: BUTTON, height: BUTTON, alignItems: "center", justifyContent: "center" }}>
                <AppIcon icon={MinusIcon} accessibilityLabel="" size="sm" tone="onPrimary" strong />
              </PressableScale>
              <ThemedText accessibilityLiveRegion="polite" variant="label" weight="bold" style={{ flex: 1, textAlign: "center", color: theme.colors.colorTextInverse, fontVariant: ["tabular-nums"] }}>{quantity}</ThemedText>
            </Animated.View>
          ) : null}
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t(severalSizes ? "catalog.chooseSize" : quantity > 0 ? "productCard.addedAction" : "productCard.addAction", { product: productName })}
            hitSlop={theme.spacing.xs}
            onPress={add}
            pressScale={theme.motion.pressScale.compactControl}
            containerStyle={{ position: "absolute", right: 0, top: 0 }}
            style={{ width: BUTTON, height: BUTTON, alignItems: "center", justifyContent: "center" }}
          >
            <AppIcon icon={AddIcon} accessibilityLabel="" size="sm" tone="onPrimary" strong />
          </PressableScale>
        </Animated.View>
        {/* How many are in the cart, on the corner of "+": outside the round button so it is never cut off. */}
        {severalSizes && quantity > 0 ? (
          <View pointerEvents="none" style={{ position: "absolute", top: -6, right: -6, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: theme.radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.colorBrand, borderWidth: theme.borderWidths.medium, borderColor: theme.colors.colorBackground }}>
            <ThemedText variant="badgeLabel" style={{ fontSize: 10, lineHeight: 12, color: theme.colors.colorPrimary }}>{quantity}</ThemedText>
          </View>
        ) : null}
        </View>
      </View>
      {severalSizes ? <SizePickerSheet visible={choosing} product={product} language={language} onClose={() => setChoosing(false)} /> : null}
    </View>
  );
});
