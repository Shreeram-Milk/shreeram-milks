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
  /** Our own delivery (with windows) or courier. A courier product is bought once only. */
  deliveryMethod: "local_delivery" | "shipping" | null;
  trialPlans: { id: string; name: string; durationDays: number }[];
  /** `lengthOptions`: how many deliveries the customer may choose (for example 15 or 30). */
  /** `minDays`/`maxDays`: the shortest and longest plan, in days from the first to the last delivery day. */
  subscriptionRules: { id: string; name: string; systemType: "daily" | "alternate_days" | "custom_weekdays"; lengthOptions: number[]; minDays: number; maxDays: number }[];
}
