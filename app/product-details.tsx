import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "../src/components/atoms/AppIcon";
import { Chip } from "../src/components/atoms/Chip";
import { Button } from "../src/components/atoms/Button";
import { IconButton } from "../src/components/atoms/IconButton";
import { ThemedText } from "../src/components/atoms/ThemedText";
import { NutritionAccordion } from "../src/components/molecules/NutritionAccordion";
import {
  PurchasePlanTabs,
  type PurchasePlan,
} from "../src/components/molecules/PurchasePlanTabs";
import { ProductDeliveryCard } from "../src/components/molecules/ProductDeliveryCard";
import { QuantityStepper } from "../src/components/molecules/QuantityStepper";
import { SubscriptionScheduleConfigurator } from "../src/components/molecules/SubscriptionScheduleConfigurator";
import { ProductImageCarousel } from "../src/components/organisms/ProductImageCarousel";
import { StateMessage } from "../src/components/organisms/StateMessage";
import { BackIcon, CartIcon, CheckIcon } from "../src/icons/appIcons";
import { useCatalogProduct, useProductDelivery } from "../src/hooks/useCatalog";
import { useToast } from "../src/providers/ToastProvider";
import { useAppStore } from "../src/store/useAppStore";
import { useTheme } from "../src/theme";
import { formatRupees, toCartProduct } from "../src/lib/catalogCart";
import { localized } from "../src/lib/contentLocalization";

const PLAN_OF_METHOD = { buy_once: "single", trial: "trial", subscription: "subscription" } as const;

export default function ProductDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const id = Array.isArray(productId) ? productId[0] : productId;
  const { data: product, isError, isLoading, refetch } = useCatalogProduct(id);
  const deliveryPin = useAppStore((state) => state.deliveryPin);
  const delivery = useProductDelivery(deliveryPin, product?.fulfilmentProfileId ?? null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PurchasePlan>("single");
  const [trialPlanId, setTrialPlanId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [slotId, setSlotId] = useState<string | null>(null);
  const addToCart = useAppStore((state) => state.addToCart);
  const cart = useAppStore((state) => state.cart);
  const updateCartQuantity = useAppStore((state) => state.updateCartQuantity);
  const { showToast } = useToast();

  if (isLoading)
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
      >
        <StateMessage type="loading" title={t("productDetails.loading")} />
      </SafeAreaView>
    );
  if (isError || !product)
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
      >
        <StateMessage
          type="error"
          title={t("productDetails.unavailableTitle")}
          description={t("productDetails.unavailableDetail")}
          actionLabel={isError ? t("common.retry") : undefined}
          onAction={isError ? () => refetch() : undefined}
        />
      </SafeAreaView>
    );

  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  if (!variant) return null;
  const cartProduct = toCartProduct(product, variant);
  const productName = localized(product.name, product.nameGu, language);
  const description = localized(product.longDescriptionEn || product.shortDescriptionEn, product.longDescriptionGu || product.shortDescriptionGu, language);
  const highlights = language === "gu" && product.highlightsGu.length > 0 ? product.highlightsGu : product.highlightsEn;
  const nutrition = localized(product.nutritionEn, product.nutritionGu, language);
  const plans = product.purchaseMethods.map((method) => PLAN_OF_METHOD[method]);
  const activePlan: PurchasePlan = plans.includes(plan) ? plan : (plans[0] ?? "single");
  const activeTrialId = product.trialPlans.some((item) => item.id === trialPlanId) ? trialPlanId : (product.trialPlans[0]?.id ?? null);
  const slots = delivery.data?.served && delivery.data.deliveryMethod === "local_delivery" ? delivery.data.slots : [];
  const activeSlotId = slots.some((slot) => slot.slotId === slotId) ? slotId : (slots[0]?.slotId ?? null);
  // Only a PIN code we are sure we cannot deliver to blocks buying; before a PIN is entered, or while checking, the customer can carry on.
  const blocked = Boolean(deliveryPin) && delivery.data?.served === false;
  const imageUrls = [product.imageUrl, ...product.galleryUrls].filter((url): url is string => Boolean(url));
  const perDelivery = t("productDetails.perDelivery", { price: formatRupees(variant.pricePaise) });

  const addSelectedQuantity = () => {
    for (let index = 0; index < quantity; index += 1) addToCart(cartProduct);
  };
  const cartItem = cart.find((item) => item.product.id === cartProduct.id);
  const isInCart = Boolean(cartItem);
  const ensureSelectedQuantity = () => {
    if (!cartItem) {
      addSelectedQuantity();
      return;
    }
    if (cartItem.quantity < quantity) updateCartQuantity(cartProduct.id, quantity);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.colorBackground }}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            gap: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <ProductImageCarousel imageUrls={imageUrls} accessibilityLabel={productName} />
            <View
              style={{
                position: "absolute",
                top: theme.spacing.md,
                left: theme.layout.screenHorizontalPadding,
                backgroundColor: theme.colors.colorSurface,
                borderRadius: theme.radii.md,
              }}
            >
              <IconButton icon={BackIcon} label={t("productDetails.back")} onPress={() => router.back()} />
            </View>
          </View>
          <View
            style={{
              gap: theme.spacing.lg,
              paddingHorizontal: theme.layout.screenHorizontalPadding,
            }}
          >
            <ProductSummary
              name={productName}
              description={description}
              price={formatRupees(variant.pricePaise)}
              oldPrice={variant.compareAtPricePaise === null ? null : formatRupees(variant.compareAtPricePaise)}
              rupees={formatRupees(variant.pricePaise).slice(1)}
              unit={variant.name}
              highlights={highlights}
            />
            {product.variants.length > 1 ? (
              <View style={{ gap: theme.spacing.sm }}>
                <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.size")}</ThemedText>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
                  {product.variants.map((item) => (
                    <Chip key={item.id} selected={item.id === variant.id} onPress={() => setVariantId(item.id)}>{item.name}</Chip>
                  ))}
                </View>
              </View>
            ) : null}
            <PurchasePlanTabs value={activePlan} onChange={setPlan} available={plans} />
            {activePlan === "trial" ? (
              <TrialPack plans={product.trialPlans} selectedId={activeTrialId} onSelect={setTrialPlanId} perDelivery={perDelivery} />
            ) : null}
            {activePlan === "subscription" ? (
              <SubscriptionScheduleConfigurator pricePerDelivery={variant.pricePaise / 100} />
            ) : null}
            <ProductDeliveryCard
              pin={deliveryPin}
              delivery={delivery.data}
              isLoading={delivery.isLoading}
              isError={delivery.isError}
              language={language}
              selectedSlotId={activeSlotId}
              onSelectSlot={setSlotId}
              onRetry={() => void delivery.refetch()}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.radii.lg,
                borderWidth: theme.borderWidths.hairline,
                borderColor: theme.colors.colorBorder,
                backgroundColor: theme.colors.colorSurface,
              }}
            >
              <View style={{ flex: 1 }}>
                <ThemedText variant="body" weight="semibold">
                  {t("productDetails.quantity")}
                </ThemedText>
                <ThemedText
                  variant="caption"
                  style={{ color: theme.colors.colorTextSecondary }}
                >
                  {t("productDetails.bottleHint")}
                </ThemedText>
              </View>
              <QuantityStepper
                value={quantity}
                onDecrement={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                onIncrement={() => setQuantity((current) => current + 1)}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.colorSurfaceMuted,
              }}
            >
              <AppIcon
                icon={CartIcon}
                accessibilityLabel={t("productDetails.freshDelivery")}
                size="sm"
              />
              <ThemedText
                variant="bodySmall"
                style={{ flex: 1, color: theme.colors.colorTextSecondary }}
              >
                {t("productDetails.deliveryReassurance")}
              </ThemedText>
            </View>
            {nutrition ? <NutritionAccordion title={t("productDetails.nutritionTitle")} content={nutrition} /> : null}
          </View>
        </ScrollView>
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.sm,
            paddingHorizontal: theme.layout.screenHorizontalPadding,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.md,
            backgroundColor: theme.colors.colorBackground,
          }}
        >
          <Button
            icon={isInCart ? CheckIcon : CartIcon}
            variant="secondary"
            style={{ flex: 1 }}
            disabled={isInCart || blocked}
            onPress={() => {
              addSelectedQuantity();
              showToast(t("productCard.addedToast", { product: productName }));
            }}
          >
            {t(isInCart ? "productDetails.inCart" : "productDetails.addToCart")}
          </Button>
          <Button
            style={{ flex: 1 }}
            disabled={blocked}
            onPress={() => {
              ensureSelectedQuantity();
              router.push("/checkout-address");
            }}
          >
            {t("productDetails.buyNow")}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ProductSummary({
  description,
  highlights,
  name,
  oldPrice,
  price,
  rupees,
  unit,
}: {
  description: string;
  highlights: string[];
  name: string;
  oldPrice: string | null;
  price: string;
  rupees: string;
  unit: string;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <ThemedText variant="h1">{name}</ThemedText>
          <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>
            {t("productDetails.inclusiveTaxes", { price: rupees, unit })}
          </ThemedText>
        </View>
        <View style={{ alignItems: "flex-end", gap: theme.spacing.xs }}>
          <ThemedText variant="h2">{price}</ThemedText>
          {oldPrice ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textDecorationLine: "line-through" }}>{oldPrice}</ThemedText> : null}
        </View>
      </View>
      {description ? <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("productDetails.productDescription", { description })}</ThemedText> : null}
      {highlights.map((line) => (
        <ThemedText key={line} variant="bodySmall">{`• ${line}`}</ThemedText>
      ))}
    </View>
  );
}

function TrialPack({ perDelivery, plans, selectedId, onSelect }: { perDelivery: string; plans: { id: string; name: string; durationDays: number }[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <ThemedText variant="caption" weight="semibold" style={{ color: theme.colors.colorTextSecondary }}>
        {t("productDetails.trialLabel")}
      </ThemedText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
        {plans.map((item) => (
          <PlanOption key={item.id} active={item.id === selectedId} title={t("productDetails.trialDays", { count: item.durationDays })} description={item.name} value={perDelivery} onPress={() => onSelect(item.id)} />
        ))}
      </View>
    </View>
  );
}

function PlanOption({
  active,
  badges,
  description,
  onPress,
  title,
  value,
}: {
  active: boolean;
  badges?: string[];
  description: string;
  onPress: () => void;
  title: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        flex: 1,
        gap: theme.spacing.xs,
        marginTop: badges ? theme.spacing.xs : theme.spacing.none,
        padding: theme.spacing.md,
        borderRadius: theme.radii.lg,
        borderWidth: active
          ? theme.borderWidths.none
          : theme.borderWidths.hairline,
        borderColor: theme.colors.colorBorder,
        backgroundColor: active
          ? theme.colors.colorPrimaryTint
          : theme.colors.colorSurface,
      }}
    >
      {badges ? (
        <View
          style={{
            position: "absolute",
            top: -theme.spacing.sm,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.card,
            flexDirection: "row",
            justifyContent: "center",
            gap: theme.spacing.xs,
          }}
        >
          {badges.map((badge, index) => (
            <View
              key={badge}
              style={{
                paddingHorizontal: theme.spacing.sm,
                borderRadius: theme.radii.pill,
                backgroundColor:
                  index === 0
                    ? theme.colors.colorPrimary
                    : theme.colors.colorTextSecondary,
              }}
            >
              <ThemedText
                variant="badgeLabel"
                weight="semibold"
                style={{ color: theme.colors.colorTextInverse }}
              >
                {badge}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
      <ThemedText
        variant="bodySmall"
        weight="semibold"
        style={{ color: theme.colors.colorTextPrimary }}
      >
        {title}
      </ThemedText>
      <ThemedText
        variant="caption"
        style={{
          color: theme.colors.colorTextSecondary,
        }}
      >
        {description}
      </ThemedText>
      <View
        style={{
          height: theme.borderWidths.hairline,
          backgroundColor: theme.colors.colorBorder,
        }}
      />
      <ThemedText
        variant="body"
        weight="bold"
        style={{ color: theme.colors.colorTextPrimary }}
      >
        {value}
      </ThemedText>
    </Pressable>
  );
}
