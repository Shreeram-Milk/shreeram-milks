import type { Product } from "../types/models";

export function getLocalizedProductName(
  product: Pick<Product, "name" | "nameGujarati">,
  language: string,
) {
  return language.startsWith("gu") && product.nameGujarati
    ? product.nameGujarati
    : product.name;
}
