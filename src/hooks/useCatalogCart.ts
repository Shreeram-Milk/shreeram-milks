import { router } from "expo-router";
import { useCallback, useMemo } from "react";

import { isInCart, toCartProduct } from "../lib/catalogCart";
import { useAppStore } from "../store/useAppStore";
import type { CatalogProduct, CatalogVariant } from "../types/catalog";

/** What a product list needs to add and remove products: one size goes straight to the cart, several sizes open the product page. */
export function useCatalogCart() {
  const cart = useAppStore((state) => state.cart);
  const addToCart = useAppStore((state) => state.addToCart);
  const removeFromCart = useAppStore((state) => state.removeFromCart);
  const updateCartQuantity = useAppStore((state) => state.updateCartQuantity);
  const cartIds = useMemo(() => new Set(cart.map((item) => item.product.id)), [cart]);

  const openProduct = useCallback((productId: string) => router.push({ pathname: "/product-details", params: { productId } }), []);
  const onAdd = useCallback(
    (product: CatalogProduct) => {
      const [only] = product.variants;
      if (product.variants.length === 1 && only) addToCart(toCartProduct(product, only));
      else openProduct(product.id);
    },
    [addToCart, openProduct],
  );
  const onRemove = useCallback(
    (product: CatalogProduct) => { for (const variant of product.variants) removeFromCart(variant.id); },
    [removeFromCart],
  );
  const isAdded = useCallback((product: CatalogProduct) => isInCart(product, cartIds), [cartIds]);
  /** How many of this product (all sizes together) are in the cart. */
  const quantityOf = useCallback(
    (product: CatalogProduct) => product.variants.reduce((sum, variant) => sum + (cart.find((item) => item.product.id === variant.id)?.quantity ?? 0), 0),
    [cart],
  );
  /** One less of a one-size product (the last one leaves the cart); several sizes open the product page to choose. */
  const onDecrease = useCallback(
    (product: CatalogProduct) => {
      const [only] = product.variants;
      if (product.variants.length !== 1 || !only) { openProduct(product.id); return; }
      const current = cart.find((item) => item.product.id === only.id)?.quantity ?? 0;
      updateCartQuantity(only.id, current - 1);
    },
    [cart, openProduct, updateCartQuantity],
  );
  /** How many of one size are in the cart. */
  const quantityOfVariant = useCallback((variantId: string) => cart.find((item) => item.product.id === variantId)?.quantity ?? 0, [cart]);
  /** One more of one size (used by the size picker). */
  const addVariant = useCallback((product: CatalogProduct, variant: CatalogVariant) => addToCart(toCartProduct(product, variant)), [addToCart]);
  /** One less of one size; the last one leaves the cart. */
  const removeOneOfVariant = useCallback((variantId: string) => updateCartQuantity(variantId, (cart.find((item) => item.product.id === variantId)?.quantity ?? 0) - 1), [cart, updateCartQuantity]);
  return { isAdded, onAdd, onRemove, onDecrease, openProduct, quantityOf, quantityOfVariant, addVariant, removeOneOfVariant };
}
