import { router, useLocalSearchParams } from "expo-router";
import { BlurTargetView } from "expo-blur";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Button } from "../src/components/atoms/Button";
import { IconButton } from "../src/components/atoms/IconButton";
import { PressableScale } from "../src/components/atoms/PressableScale";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { ProductDetailSkeleton } from "../src/components/molecules/LoadingSkeletons";
import { NutritionAccordion } from "../src/components/molecules/NutritionAccordion";
import { ProductDeliveryCard } from "../src/components/molecules/ProductDeliveryCard";
import { QuantityStepper } from "../src/components/molecules/QuantityStepper";
import { SegmentedTabs } from "../src/components/molecules/SegmentedTabs";
import { ExistingPlanCard } from "../src/components/organisms/ExistingPlanCard";
import { PinCodeSheet } from "../src/components/organisms/PinCodeSheet";
import { ProductImageCarousel } from "../src/components/organisms/ProductImageCarousel";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { SubscribeSetup, emptyChoice, resolveChoice, type SubscribeChoice } from "../src/components/organisms/SubscribeSetup";
import { useCatalogProduct, useCatalogProductPreview, useProductDelivery } from "../src/hooks/useCatalog";
import { useFeatureFlags } from "../src/hooks/useContent";
import { useMySubscriptions } from "../src/hooks/useSubscriptions";
import { BackIcon, CartIcon, SuccessIcon } from "../src/icons/appIcons";
import { formatRupees, toCartProduct } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";
import { tapFeedback } from "../src/lib/haptics";
import { useToast } from "../src/providers/ToastProvider";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";

type PurchasePlan = "single" | "trial" | "subscription";
const PLAN_OF_METHOD = { buy_once: "single", trial: "trial", subscription: "subscription" } as const;
const PLAN_LABEL: Record<PurchasePlan, string> = { single: "purchasePlans.single", trial: "purchasePlans.trial", subscription: "purchasePlans.subscription" };

/** Back and cart as small white circles floating on the photo. The same on the loading page, so nothing jumps when it fills in. */
function PhotoButtons() {
  const theme = useTheme();
  const { t } = useTranslation();
  const circle = { backgroundColor: theme.colors.colorSurface, borderRadius: theme.radii.pill, ...theme.elevation.sm };
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: theme.spacing.sm, left: theme.layout.screenHorizontalPadding, right: theme.layout.screenHorizontalPadding, flexDirection: "row", justifyContent: "space-between" }}>
      <View style={circle}><IconButton icon={BackIcon} label={t("productDetails.back")} onPress={() => router.back()} /></View>
      <View style={circle}><IconButton icon={CartIcon} label={t("navigation.cart")} onPress={() => router.navigate("/cart")} /></View>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <ThemedText variant="body" weight="bold">{children}</ThemedText>;
}

export default function ProductDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const language = useAppStore((state) => state.language);
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const id = Array.isArray(productId) ? productId[0] : productId;
  const { data: product, isError, isLoading, refetch } = useCatalogProduct(id);
  // Name, photo and price are already known from the list the customer tapped, so they show while the rest loads.
  const preview = useCatalogProductPreview(id);
  const deliveryPin = useAppStore((state) => state.deliveryPin);
  const delivery = useProductDelivery(deliveryPin, product?.id ?? null);
  const { data: mySubscriptions = [] } = useMySubscriptions();
  const { showTrials, showSubscriptions } = useFeatureFlags();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PurchasePlan>("single");
  const [quantity, setQuantity] = useState(1);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [choice, setChoice] = useState<SubscribeChoice>(emptyChoice);
  const [expanded, setExpanded] = useState(false);
  // The PIN pop-up frosts the page behind it (on iPhone), which needs the page wrapped as a blur target.
  const blurTargetRef = useRef<View>(null);
  const addToCart = useAppStore((state) => state.addToCart);
  const cart = useAppStore((state) => state.cart);
  const { showToast } = useToast();

  if (isLoading)
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
        <StatusBar barStyle="dark-content" />
        <View accessibilityLabel={t("productDetails.loading")} style={{ flex: 1 }}>
          <View style={{ width, height: width, backgroundColor: theme.colors.colorSurfaceMuted }}>
            {preview?.imageUrl ? <Image source={{ uri: preview.imageUrl }} contentFit="cover" style={{ width, height: width }} /> : null}
            <PhotoButtons />
          </View>
          <View style={{ gap: theme.spacing.lg, padding: theme.layout.screenHorizontalPadding }}>
            {preview ? (
              <View style={{ gap: theme.spacing.xs }}>
                <ThemedText variant="h1">{localized(preview.name, preview.nameGu, language)}</ThemedText>
                <ThemedText variant="h1" weight="extrabold">{formatRupees(preview.priceFromPaise)}</ThemedText>
              </View>
            ) : null}
            <ProductDetailSkeleton compact />
          </View>
        </View>
      </SafeAreaView>
    );
  if (isError || !product)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
        <StateMessage type="error" title={t("productDetails.unavailableTitle")} description={t("productDetails.unavailableDetail")} actionLabel={isError ? t("common.retry") : undefined} onAction={isError ? () => void refetch() : undefined} />
      </SafeAreaView>
    );

  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  if (!variant) return null;
  const cartProduct = toCartProduct(product, variant);
  const productName = localized(product.name, product.nameGu, language);
  const description = localized(product.longDescriptionEn || product.shortDescriptionEn, product.longDescriptionGu || product.shortDescriptionGu, language);
  const highlights = language === "gu" && product.highlightsGu.length > 0 ? product.highlightsGu : product.highlightsEn;
  const nutrition = localized(product.nutritionEn, product.nutritionGu, language);
  // A courier product is bought once only: trials and subscriptions need a delivery window every day. The admin can switch trials and subscriptions off.
  const plans = product.purchaseMethods
    .filter((method) => product.deliveryMethod !== "shipping" || method === "buy_once")
    .map((method) => PLAN_OF_METHOD[method])
    .filter((key) => (key !== "trial" || showTrials) && (key !== "subscription" || showSubscriptions));
  const activePlan: PurchasePlan = plans.includes(plan) ? plan : (plans[0] ?? "single");
  const slots = delivery.data?.served && delivery.data.deliveryMethod === "local_delivery" ? delivery.data.slots : [];
  const activeSlotId = slots.some((slot) => slot.slotId === slotId) ? slotId : (slots[0]?.slotId ?? null);
  // Only a PIN code we are sure we cannot deliver to blocks buying; before a PIN is entered, or while checking, the customer can carry on.
  const blocked = Boolean(deliveryPin) && delivery.data?.served === false;
  const imageUrls = [product.imageUrl, ...product.galleryUrls].filter((url): url is string => Boolean(url));
  const savePercent = variant.compareAtPricePaise !== null && variant.compareAtPricePaise > variant.pricePaise ? Math.round(((variant.compareAtPricePaise - variant.pricePaise) / variant.compareAtPricePaise) * 100) : null;

  const repeating = activePlan === "trial" || activePlan === "subscription" ? activePlan : null;
  // A live subscription (or trial) of this product is shown instead of the set-up; a new one can start once it has ended.
  const existing = repeating ? mySubscriptions.find((item) => item.productId === product.id && item.kind === repeating && (item.status === "active" || item.status === "paused")) ?? null : null;
  const setup = repeating && !existing ? resolveChoice(choice, repeating, product, slots) : null;
  const reviewSubscription = () => {
    if (!repeating || !setup?.ready || !setup.startDate) return;
    const draft = { kind: repeating, variantId: variant.id, ruleId: repeating === "subscription" ? setup.rule?.id : undefined, endDate: repeating === "subscription" ? (setup.endDate ?? undefined) : undefined, trialPlanId: setup.trialPlanId ?? undefined, weekdays: setup.weekdays, startDate: setup.startDate, lines: setup.lines };
    router.push({ pathname: "/subscribe-review", params: { draft: JSON.stringify(draft) } });
  };

  const isInCart = cart.some((item) => item.product.id === cartProduct.id);
  const addSelectedQuantity = () => {
    tapFeedback();
    for (let index = 0; index < quantity; index += 1) addToCart(cartProduct, activeSlotId);
    showToast(t("productCard.addedToast", { product: productName }));
  };
  // Buy now puts the chosen quantity in the cart (unless it is already there) and goes straight to checkout.
  const buyNow = () => {
    if (!isInCart) {
      tapFeedback();
      for (let index = 0; index < quantity; index += 1) addToCart(cartProduct, activeSlotId);
    }
    router.push("/checkout-address");
  };

  // The bottom bar: one clear action for the chosen way of buying. A preview price only; the server prices it at checkout.
  const bottomBar = existing ? (
    <Button onPress={() => router.push({ pathname: "/subscription-manage", params: { id: existing.id } })}>{t(existing.kind === "trial" ? "subs.manageTrial" : "subscriptionManage.title")}</Button>
  ) : repeating && setup ? (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: theme.spacing.md }}>
        <ThemedText variant="caption" numberOfLines={2} style={{ flex: 1, color: theme.colors.colorTextSecondary }}>{t("subs.summary", { count: setup.deliveries ?? 0, quantity: setup.perDelivery })}</ThemedText>
        <ThemedText variant="h2" weight="extrabold" style={{ fontVariant: ["tabular-nums"] }}>{formatRupees(variant.pricePaise * setup.perDelivery * (setup.deliveries ?? 0))}</ThemedText>
      </View>
      <Button disabled={blocked || !setup.ready || !deliveryPin} onPress={reviewSubscription}>{t(!deliveryPin ? "subs.addPinFirst" : repeating === "trial" ? "subs.continueTrial" : "subs.continue")}</Button>
    </View>
  ) : (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
      {isInCart ? (
        <Button variant="secondary" icon={CartIcon} style={{ flex: 1 }} onPress={() => router.navigate("/cart")}>{t("productDetails.viewCart")}</Button>
      ) : (
        <Button variant="secondary" icon={CartIcon} style={{ flex: 1 }} disabled={blocked} onPress={addSelectedQuantity}>{t("productDetails.addToCart")}</Button>
      )}
      <Button style={{ flex: 1 }} disabled={blocked} onPress={buyNow}>{t("productDetails.buyNow")}</Button>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
      <StatusBar barStyle="dark-content" />
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}>
        <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
          <View>
            <ProductImageCarousel imageUrls={imageUrls} accessibilityLabel={productName} />
            <PhotoButtons />
          </View>
          <View style={{ gap: theme.spacing.lg + 4, padding: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.lg }}>
            {/* Name, size and price, with the quantity beside the price when buying once. */}
            <View style={{ gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radii.xl, backgroundColor: theme.colors.colorSurface, borderWidth: theme.borderWidths.hairline, borderColor: theme.colors.colorBorder, ...theme.elevation.sm }}>
              <View style={{ gap: theme.spacing.xs }}>
                <ThemedText variant="h1">{productName}</ThemedText>
                <View style={{ alignSelf: "flex-start", paddingHorizontal: theme.spacing.sm, paddingVertical: 2, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorPrimaryTint }}>
                  <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.colorPrimary }}>{variant.name}</ThemedText>
                </View>
              </View>
              <View style={{ height: theme.borderWidths.hairline, backgroundColor: theme.colors.colorBorder }} />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md }}>
                <View style={{ flexShrink: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: theme.spacing.sm }}>
                    <ThemedText variant="display" style={{ fontVariant: ["tabular-nums"] }}>{formatRupees(variant.pricePaise)}</ThemedText>
                    {variant.compareAtPricePaise !== null && savePercent ? <ThemedText variant="body" style={{ color: theme.colors.colorTextSecondary, textDecorationLine: "line-through" }}>{formatRupees(variant.compareAtPricePaise)}</ThemedText> : null}
                    {savePercent ? (
                      <View style={{ paddingHorizontal: theme.spacing.sm, paddingVertical: 2, borderRadius: theme.radii.pill, backgroundColor: theme.colors.colorHighlightTint }}>
                        <ThemedText variant="caption" weight="bold" style={{ color: theme.colors.colorHighlightText }}>{t("productDetails.savePercent", { percent: savePercent })}</ThemedText>
                      </View>
                    ) : null}
                  </View>
                  <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.perUnitTaxes", { unit: variant.name })}</ThemedText>
                </View>
                {!repeating && !isInCart ? (
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.quantity")}</ThemedText>
                    <QuantityStepper value={quantity} onDecrement={() => setQuantity((current) => Math.max(1, current - 1))} onIncrement={() => setQuantity((current) => current + 1)} />
                  </View>
                ) : null}
              </View>
            </View>

            {product.variants.length > 1 ? (
              <View style={{ gap: theme.spacing.sm }}>
                <SectionTitle>{t("productDetails.size")}</SectionTitle>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
                  {product.variants.map((item) => {
                    const selected = item.id === variant.id;
                    return (
                      <PressableScale key={item.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setVariantId(item.id)} pressScale={theme.motion.pressScale.control} style={{ minHeight: 40, justifyContent: "center", paddingHorizontal: theme.spacing.md - 2, borderRadius: theme.radii.pill, borderWidth: 1.5, borderColor: selected ? theme.colors.colorAccent : theme.colors.colorBorder, backgroundColor: selected ? theme.colors.colorAccentTint : theme.colors.colorSurface }}>
                        <ThemedText variant="label" weight={selected ? "bold" : "medium"} style={{ color: selected ? theme.colors.colorAccent : theme.colors.colorTextPrimary }}>{item.name} · {formatRupees(item.pricePaise)}</ThemedText>
                      </PressableScale>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {plans.length > 1 ? <SegmentedTabs tabs={plans.map((key) => ({ key, label: t(PLAN_LABEL[key]) }))} value={activePlan} onChange={setPlan} /> : null}

            <ProductDeliveryCard
              showSlots={!repeating}
              pin={deliveryPin}
              delivery={delivery.data}
              isLoading={delivery.isLoading}
              isError={delivery.isError}
              language={language}
              selectedSlotId={activeSlotId}
              onSelectSlot={setSlotId}
              onChangePin={() => setPinSheetOpen(true)}
              onRetry={() => void delivery.refetch()}
            />

            {existing ? <ExistingPlanCard subscription={existing} language={language} /> : repeating ? <SubscribeSetup kind={repeating} product={product} unitPricePaise={variant.pricePaise} slots={slots} language={language} choice={choice} onChange={setChoice} /> : null}

            {description || highlights.length > 0 ? (
              <View style={{ gap: theme.spacing.sm }}>
                <SectionTitle>{t("productDetails.about")}</SectionTitle>
                {highlights.map((line) => (
                  <View key={line} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
                    <AppIcon icon={SuccessIcon} size="sm" tone="accent" accessibilityLabel="" />
                    <ThemedText variant="bodySmall" style={{ flex: 1 }}>{line}</ThemedText>
                  </View>
                ))}
                {description ? (
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={{ gap: theme.spacing.xs }}>
                    <ThemedText variant="bodySmall" numberOfLines={expanded ? undefined : 3} style={{ color: theme.colors.colorTextSecondary }}>{description}</ThemedText>
                    <ThemedText variant="label" weight="bold" style={{ color: theme.colors.colorPrimary }}>{t(expanded ? "productDetails.readLess" : "productDetails.readMore")}</ThemedText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {nutrition ? <NutritionAccordion title={t("productDetails.nutritionTitle")} content={nutrition} /> : null}
          </View>
        </ScrollView>
      </BlurTargetView>
      <View accessibilityLiveRegion="polite" style={{ paddingHorizontal: theme.layout.screenHorizontalPadding, paddingTop: theme.spacing.md - 4, paddingBottom: Math.max(insets.bottom, theme.spacing.md - 4), backgroundColor: theme.colors.colorSurface, borderTopWidth: theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
        {bottomBar}
      </View>
      {pinSheetOpen ? <PinCodeSheet blurTarget={blurTargetRef} onClose={() => setPinSheetOpen(false)} /> : null}
    </SafeAreaView>
  );
}
