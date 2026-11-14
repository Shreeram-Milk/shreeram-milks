import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button } from "../atoms/Button";
import { ThemedText } from "../atoms/ThemedText";
import { QuantityStepper } from "../molecules/QuantityStepper";
import { useCatalogCart } from "../../hooks/useCatalogCart";
import { formatRupees } from "../../lib/catalogCart";
import { localized } from "../../lib/contentLocalization";
import { tapFeedback } from "../../lib/haptics";
import { useTheme } from "../../theme";
import type { CatalogProduct } from "../../types/catalog";
import type { AppLanguage } from "../../types/models";
import { SubscriptionBottomSheet } from "./SubscriptionBottomSheet";

interface SizePickerSheetProps {
  language: AppLanguage;
  onClose: () => void;
  product: CatalogProduct;
  visible: boolean;
}

/**
 * Adding a product that comes in several sizes without leaving the list: each size with its price and an Add button that
 * becomes "− n +". The full product page is one tap away for plans and details.
 */
export function SizePickerSheet({ language, onClose, product, visible }: SizePickerSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { addVariant, openProduct, quantityOfVariant, removeOneOfVariant } = useCatalogCart();
  const name = localized(product.name, product.nameGu, language);

  return (
    <SubscriptionBottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ gap: 2 }}>
          <ThemedText variant="h2">{name}</ThemedText>
          <ThemedText variant="bodySmall" style={{ color: theme.colors.colorTextSecondary }}>{t("sizePicker.detail")}</ThemedText>
        </View>
        <View accessibilityRole="list">
          {product.variants.map((variant, index) => {
            const quantity = quantityOfVariant(variant.id);
            const compare = variant.compareAtPricePaise && variant.compareAtPricePaise > variant.pricePaise ? variant.compareAtPricePaise : null;
            return (
              <View key={variant.id} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.spacing.md - 2, borderTopWidth: index === 0 ? 0 : theme.borderWidths.hairline, borderTopColor: theme.colors.colorBorder }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText variant="body" weight="semibold">{variant.name}</ThemedText>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: theme.spacing.sm }}>
                    <ThemedText variant="bodySmall" weight="bold" style={{ fontVariant: ["tabular-nums"] }}>{formatRupees(variant.pricePaise)}</ThemedText>
                    {compare ? <ThemedText variant="caption" style={{ color: theme.colors.colorTextSecondary, textDecorationLine: "line-through" }}>{formatRupees(compare)}</ThemedText> : null}
                  </View>
                </View>
                {quantity > 0 ? (
                  <QuantityStepper value={quantity} onDecrement={() => removeOneOfVariant(variant.id)} onIncrement={() => { tapFeedback(); addVariant(product, variant); }} />
                ) : (
                  <Button compact style={{ alignSelf: "center", minWidth: 88 }} onPress={() => { tapFeedback(); addVariant(product, variant); }} accessibilityLabel={t("sizePicker.addSize", { size: variant.name, product: name })}>
                    {t("sizePicker.add")}
                  </Button>
                )}
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <Button variant="secondary" style={{ flex: 1 }} onPress={() => { onClose(); openProduct(product.id); }}>{t("sizePicker.details")}</Button>
          <Button style={{ flex: 1 }} onPress={onClose}>{t("sizePicker.done")}</Button>
        </View>
      </View>
    </SubscriptionBottomSheet>
  );
}
