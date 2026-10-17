import sampleProducts from "../mock-data/products.json";
import type { CatalogCategory, CatalogProduct, CatalogProductDetail, CatalogVariant, PurchaseMethod } from "../types/catalog";
import { apiGet, hasApi } from "./apiClient";

const METHODS: readonly PurchaseMethod[] = ["buy_once", "trial", "subscription"];

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
const httpsUrl = (value: unknown): string | null => (typeof value === "string" && value.startsWith("https://") ? value : null);
const record = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);

export function parseCategory(raw: unknown): CatalogCategory | null {
  const item = record(raw);
  const id = text(item?.id);
  const name = text(item?.name).trim();
  return item && id && name ? { id, name, nameGu: text(item.nameGu) } : null;
}

function parseVariant(raw: unknown): CatalogVariant | null {
  const item = record(raw);
  if (!item || !text(item.id) || typeof item.pricePaise !== "number" || !Number.isSafeInteger(item.pricePaise) || item.pricePaise < 0) return null;
  return {
    id: text(item.id),
    name: text(item.name),
    pricePaise: item.pricePaise,
    compareAtPricePaise: typeof item.compareAtPricePaise === "number" ? item.compareAtPricePaise : null,
    displayUnit: text(item.displayUnit),
    displayQuantity: typeof item.displayQuantity === "number" ? item.displayQuantity : 1,
  };
}

/**
 * Checks one product from the server and keeps only what the app shows. A product with no usable price is dropped,
 * so a bad record in the admin can never crash a screen or show a wrong price.
 */
export function parseProduct(raw: unknown): CatalogProduct | null {
  const item = record(raw);
  if (!item) return null;
  const variants = Array.isArray(item.variants) ? item.variants.map(parseVariant).filter((variant): variant is CatalogVariant => variant !== null) : [];
  const id = text(item.id);
  const name = text(item.name).trim();
  if (!id || !name || variants.length === 0) return null;
  return {
    id,
    name,
    nameGu: text(item.nameGu),
    categoryId: text(item.categoryId),
    categoryName: text(item.categoryName),
    categoryNameGu: text(item.categoryNameGu),
    shortDescriptionEn: text(item.shortDescriptionEn),
    shortDescriptionGu: text(item.shortDescriptionGu),
    badges: strings(item.badges),
    purchaseMethods: strings(item.purchaseMethods).filter((method): method is PurchaseMethod => METHODS.includes(method as PurchaseMethod)),
    imageUrl: httpsUrl(item.imageUrl),
    priceFromPaise: Math.min(...variants.map((variant) => variant.pricePaise)),
    variants,
  };
}

export function parseProductDetail(raw: unknown): CatalogProductDetail | null {
  const base = parseProduct(raw);
  const item = record(raw);
  if (!base || !item) return null;
  const trialPlans = Array.isArray(item.trialPlans) ? item.trialPlans.flatMap((plan) => { const entry = record(plan); return entry && text(entry.id) && typeof entry.durationDays === "number" ? [{ id: text(entry.id), name: text(entry.name), durationDays: entry.durationDays }] : []; }) : [];
  const subscriptionRules = Array.isArray(item.subscriptionRules) ? item.subscriptionRules.flatMap((rule) => { const entry = record(rule); const systemType: "daily" | "alternate_days" | "custom_weekdays" = entry?.systemType === "alternate_days" ? "alternate_days" : entry?.systemType === "custom_weekdays" ? "custom_weekdays" : "daily"; const lengthOptions = Array.isArray(entry?.lengthOptions) ? entry.lengthOptions.filter((value): value is number => typeof value === "number" && value > 0) : []; const minDays = typeof entry?.minDays === "number" && entry.minDays >= 1 ? Math.trunc(entry.minDays) : 5; const maxDays = typeof entry?.maxDays === "number" && entry.maxDays >= minDays ? Math.trunc(entry.maxDays) : Math.max(180, minDays); return entry && text(entry.id) && lengthOptions.length > 0 ? [{ id: text(entry.id), name: text(entry.name), systemType, lengthOptions, minDays, maxDays }] : []; }) : [];
  return {
    ...base,
    longDescriptionEn: text(item.longDescriptionEn),
    longDescriptionGu: text(item.longDescriptionGu),
    nutritionEn: text(item.nutritionEn),
    nutritionGu: text(item.nutritionGu),
    highlightsEn: strings(item.highlightsEn),
    highlightsGu: strings(item.highlightsGu),
    galleryUrls: strings(item.galleryUrls).filter((url) => url.startsWith("https://")),
    deliveryMethod: item.deliveryMethod === "shipping" || item.deliveryMethod === "local_delivery" ? item.deliveryMethod : null,
    trialPlans,
    subscriptionRules,
  };
}

interface Sample { id: string; category: string; name: string; nameGujarati: string; description: string; price: number; unit: string; imageUrl: string | null; isAvailable: boolean }

/** Without a backend address the bundled sample products stand in, one size each, so the app still works while developing. */
function sampleCatalog(): CatalogProductDetail[] {
  return (sampleProducts as Sample[]).filter((product) => product.isAvailable).map((product) => ({
    id: product.id,
    name: product.name,
    nameGu: product.nameGujarati,
    categoryId: product.category.toLowerCase(),
    categoryName: product.category,
    categoryNameGu: "",
    shortDescriptionEn: product.description,
    shortDescriptionGu: "",
    badges: [],
    purchaseMethods: ["buy_once", "trial", "subscription"],
    imageUrl: product.imageUrl,
    priceFromPaise: product.price * 100,
    variants: [{ id: `${product.id}-default`, name: product.unit, pricePaise: product.price * 100, compareAtPricePaise: null, displayUnit: product.unit, displayQuantity: 1 }],
    longDescriptionEn: product.description,
    longDescriptionGu: "",
    nutritionEn: "",
    nutritionGu: "",
    highlightsEn: [],
    highlightsGu: [],
    galleryUrls: [],
    deliveryMethod: "local_delivery" as const,
    trialPlans: [{ id: "sample-trial-3", name: "3-day trial", durationDays: 3 }, { id: "sample-trial-7", name: "7-day trial", durationDays: 7 }],
    subscriptionRules: [],
  }));
}

export async function getCategories(): Promise<CatalogCategory[]> {
  if (!hasApi()) {
    const seen = new Map<string, CatalogCategory>();
    for (const product of sampleCatalog()) seen.set(product.categoryId, { id: product.categoryId, name: product.categoryName, nameGu: "" });
    return [...seen.values()];
  }
  const body = await apiGet<{ categories?: unknown }>("/public/categories");
  return Array.isArray(body.categories) ? body.categories.map(parseCategory).filter((category): category is CatalogCategory => category !== null) : [];
}

export interface CatalogQuery { categoryId: string | null; search: string }

/** The shop's products, filtered by shelf and search on the server. A catalogue is small, so one page of up to 100 is shown. */
export async function getCatalogProducts({ categoryId, search }: CatalogQuery): Promise<CatalogProduct[]> {
  if (!hasApi()) {
    const needle = search.trim().toLowerCase();
    return sampleCatalog().filter((product) => (!categoryId || product.categoryId === categoryId) && (!needle || `${product.name} ${product.nameGu}`.toLowerCase().includes(needle)));
  }
  const query = new URLSearchParams({ pageSize: "100" });
  if (categoryId) query.set("category", categoryId);
  if (search.trim()) query.set("search", search.trim());
  const body = await apiGet<{ products?: unknown }>(`/public/products?${query}`);
  return Array.isArray(body.products) ? body.products.map(parseProduct).filter((product): product is CatalogProduct => product !== null) : [];
}

export async function getCatalogProduct(id: string): Promise<CatalogProductDetail | null> {
  if (!hasApi()) return sampleCatalog().find((product) => product.id === id) ?? null;
  const body = await apiGet<{ product?: unknown }>(`/public/products/${encodeURIComponent(id)}`);
  return parseProductDetail(body.product);
}
