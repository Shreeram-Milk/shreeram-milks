import { useQuery } from "@tanstack/react-query";

import { getCatalogProduct, getCatalogProducts, getCategories } from "../services/catalogService";
import { getProductDelivery, PIN_CODE } from "../services/deliveryAvailabilityService";
import { queryKeys } from "../services/queryKeys";

/** The shelves (categories) the admin has switched on. */
export function useCatalogCategories() {
  return useQuery({ queryKey: queryKeys.catalogCategories, queryFn: getCategories, staleTime: 5 * 60 * 1000 });
}

/** The shop's products for a shelf and a search. The server does the filtering. */
export function useCatalogProducts(categoryId: string | null, search = "") {
  return useQuery({ queryKey: queryKeys.catalogProducts(categoryId, search), queryFn: () => getCatalogProducts({ categoryId, search }), staleTime: 60 * 1000 });
}

export function useCatalogProduct(id: string | undefined) {
  return useQuery({ queryKey: queryKeys.catalogProduct(id ?? ""), queryFn: () => getCatalogProduct(id ?? ""), enabled: Boolean(id), staleTime: 60 * 1000 });
}

/** Whether a product can be delivered to the customer's PIN code, and from when. Waits for a full PIN code. */
export function useProductDelivery(pin: string, profileId: string | null) {
  return useQuery({
    queryKey: queryKeys.productDelivery(pin, profileId ?? ""),
    queryFn: () => getProductDelivery(pin, profileId),
    enabled: PIN_CODE.test(pin),
    // The earliest date depends on the time of day, so an old answer is not reused for long.
    staleTime: 60 * 1000,
  });
}
