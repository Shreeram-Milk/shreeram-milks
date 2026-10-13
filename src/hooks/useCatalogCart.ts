import { router } from "expo-router";
import { useCallback, useMemo } from "react";

import { isInCart, toCartProduct } from "../lib/catalogCart";
import { useAppStore } from "../store/useAppStore";
import type { CatalogProduct } from "../types/catalog";

/** What a product list needs to add and remove products: one size goes straight to the cart, several sizes open the product page. */
export function useCatalogCart() {
  const cart = useAppStore((state) => state.cart);
  const addToCart = useAppStore((state) => state.addToCart);
  const removeFromCart = useAppStore((state) => state.removeFromCart);
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
  return { isAdded, onAdd, onRemove, openProduct };
}
