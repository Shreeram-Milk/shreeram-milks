import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { getCatalogProduct, getCatalogProducts, getCategories } from "../services/catalogService";
import { getProductDelivery, PIN_CODE } from "../services/deliveryAvailabilityService";
import { queryKeys } from "../services/queryKeys";
import type { CatalogProduct } from "../types/catalog";

const PRODUCT_STALE_MS = 60 * 1000;

/** The shelves (categories) the admin has switched on. */
export function useCatalogCategories() {
  return useQuery({ queryKey: queryKeys.catalogCategories, queryFn: getCategories, staleTime: 60 * 1000 });
}

/**
 * The shop's products for a shelf and a search. The server does the filtering. While another shelf loads, the previous
 * products stay on screen (isPlaceholderData tells the screen to dim them) instead of the list going blank.
 */
export function useCatalogProducts(categoryId: string | null, search = "") {
  return useQuery({ queryKey: queryKeys.catalogProducts(categoryId, search), queryFn: () => getCatalogProducts({ categoryId, search }), staleTime: PRODUCT_STALE_MS, placeholderData: keepPreviousData });
}

/**
 * Each product's picture by product id, from the whole-shop list Home and Products already load (no extra request when it is
 * in memory). Orders do not carry pictures, so My Orders looks them up here; a product no longer sold simply has none.
 */
export function useProductImages(): ReadonlyMap<string, string> {
  const { data } = useCatalogProducts(null);
  return useMemo(() => new Map((data ?? []).filter((product) => product.imageUrl).map((product) => [product.id, product.imageUrl as string])), [data]);
}

export function useCatalogProduct(id: string | undefined) {
  return useQuery({ queryKey: queryKeys.catalogProduct(id ?? ""), queryFn: () => getCatalogProduct(id ?? ""), enabled: Boolean(id), staleTime: PRODUCT_STALE_MS });
}

/** The list entry for a product, already in memory from Home or Products, so its page can show the photo, name and price at once. */
export function useCatalogProductPreview(id: string | undefined): CatalogProduct | undefined {
  const client = useQueryClient();
  return useMemo(() => {
    if (!id) return undefined;
    for (const [, products] of client.getQueriesData<CatalogProduct[]>({ queryKey: ["catalog-products"] })) {
      const found = products?.find((product) => product.id === id);
      if (found) return found;
    }
    return undefined;
  }, [client, id]);
}

/**
 * A product's photo for places that only know its id (plan cards, the manage page). It reads the full catalogue list, which
 * Home has usually loaded and the phone has saved, so many cards share one answer instead of one request each.
 */
export function useCatalogProductImage(productId: string | undefined) {
  const { data } = useQuery({
    queryKey: queryKeys.catalogProducts(null, ""),
    queryFn: () => getCatalogProducts({ categoryId: null, search: "" }),
    staleTime: PRODUCT_STALE_MS,
    enabled: Boolean(productId),
    select: (products) => products.find((product) => product.id === productId)?.imageUrl ?? null,
  });
  return data ?? null;
}

/** Starts loading a product page as soon as a finger touches its card, so it is usually ready when the page opens. */
export function usePrefetchCatalogProduct() {
  const client = useQueryClient();
  return useCallback(
    (id: string) => void client.prefetchQuery({ queryKey: queryKeys.catalogProduct(id), queryFn: () => getCatalogProduct(id), staleTime: PRODUCT_STALE_MS }),
    [client],
  );
}

/** Whether a product can be delivered to the customer's PIN code, and from when. Waits for a full PIN code. */
export function useProductDelivery(pin: string, productId: string | null) {
  return useQuery({
    queryKey: queryKeys.productDelivery(pin, productId ?? ""),
    queryFn: () => getProductDelivery(pin, productId),
    enabled: PIN_CODE.test(pin),
    // The earliest date depends on the time of day, so an old answer is not reused for long.
    staleTime: 60 * 1000,
  });
}
