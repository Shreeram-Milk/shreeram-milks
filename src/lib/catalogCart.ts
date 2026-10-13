import type { CatalogProduct, CatalogVariant } from "../types/catalog";
import type { Product } from "../types/models";

/**
 * The cart still holds the simple one-price product the checkout screens were built on. A cart line is one size of a
 * product, so its id is the size's id and its price is that size's price (paise turned into rupees only for display).
 */
export function toCartProduct(product: CatalogProduct, variant: CatalogVariant): Product {
  const single = product.variants.length === 1;
  return {
    id: variant.id,
    category: product.categoryName,
    name: single ? product.name : `${product.name} · ${variant.name}`,
    nameGujarati: product.nameGu ? (single ? product.nameGu : `${product.nameGu} · ${variant.name}`) : "",
    description: product.shortDescriptionEn,
    price: variant.pricePaise / 100,
    unit: variant.name,
    imageUrl: product.imageUrl,
    isAvailable: true,
  };
}

/** True when any size of this product is in the cart. */
export const isInCart = (product: CatalogProduct, cartIds: ReadonlySet<string>): boolean => product.variants.some((variant) => cartIds.has(variant.id));

/** "₹70" for whole rupees, "₹70.50" otherwise. Money is whole paise until this point. */
export function formatRupees(paise: number): string {
  const rupees = Math.trunc(paise / 100);
  const rest = paise % 100;
  return rest === 0 ? `₹${rupees}` : `₹${rupees}.${String(rest).padStart(2, "0")}`;
}
