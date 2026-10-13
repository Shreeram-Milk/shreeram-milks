/** A shelf in the shop (Milk, Curd, Ghee…), as the admin set it up. */
export interface CatalogCategory {
  id: string;
  name: string;
  nameGu: string;
}

/** One size of a product with its price. Money is whole paise (₹70.00 = 7000), never decimals. */
export interface CatalogVariant {
  id: string;
  name: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  displayUnit: string;
  displayQuantity: number;
}

export type PurchaseMethod = "buy_once" | "trial" | "subscription";

/** A product on a list. */
export interface CatalogProduct {
  id: string;
  name: string;
  nameGu: string;
  categoryId: string;
  categoryName: string;
  categoryNameGu: string;
  shortDescriptionEn: string;
  shortDescriptionGu: string;
  badges: string[];
  purchaseMethods: PurchaseMethod[];
  /** The delivery rules this product follows. The server uses it to say where and when it can be delivered. */
  fulfilmentProfileId: string | null;
  imageUrl: string | null;
  priceFromPaise: number;
  variants: CatalogVariant[];
}

/** A product page: the list data plus the long text, pictures, and the trial plans and subscription rules on offer. */
export interface CatalogProductDetail extends CatalogProduct {
  longDescriptionEn: string;
  longDescriptionGu: string;
  nutritionEn: string;
  nutritionGu: string;
  highlightsEn: string[];
  highlightsGu: string[];
  galleryUrls: string[];
  trialPlans: { id: string; name: string; durationDays: number }[];
  subscriptionRules: { id: string; name: string; systemType: string }[];
}
