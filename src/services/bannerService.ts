import banners from "../mock-data/banners.json";
import type { BannerContent, BannerCtaType, BannerType } from "../types/content";
import { apiGet, hasApi } from "./apiClient";

const TYPES: readonly BannerType[] = ["promotion", "warning", "maintenance", "informational"];
const CTA_TYPES: readonly BannerCtaType[] = ["none", "product", "category", "offers"];

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/**
 * Checks one banner from the server and keeps only what the app needs. A malformed banner is dropped, so a bad
 * record in the admin can never crash the home screen.
 */
export function parseBanner(raw: unknown): BannerContent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const id = text(item.id);
  const titleEn = text(item.titleEn).trim();
  if (!id || !titleEn || !TYPES.includes(item.type as BannerType)) return null;
  return {
    id,
    type: item.type as BannerType,
    titleEn,
    titleGu: text(item.titleGu),
    messageEn: text(item.messageEn),
    messageGu: text(item.messageGu),
    labelEn: text(item.labelEn).trim(),
    labelGu: text(item.labelGu).trim(),
    imageUrl: typeof item.imageUrl === "string" && item.imageUrl.startsWith("https://") ? item.imageUrl : null,
    ctaType: CTA_TYPES.includes(item.ctaType as BannerCtaType) ? (item.ctaType as BannerCtaType) : "none",
    ctaTarget: text(item.ctaTarget),
    sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : 0,
  };
}

/**
 * Home-screen banners and notices. With a backend address set, they come from the admin through the API (the server
 * has already chosen which apply today and to whom). Without one, the bundled sample data is used.
 */
export async function getBanners(): Promise<BannerContent[]> {
  if (!hasApi()) return (banners as BannerContent[]).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const body = await apiGet<{ banners?: unknown }>("/public/banners");
  if (!Array.isArray(body.banners)) return [];
  return body.banners.map(parseBanner).filter((banner): banner is BannerContent => banner !== null).sort((a, b) => a.sortOrder - b.sortOrder);
}
