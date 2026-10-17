import type { AppLanguage } from "./models";

/**
 * Business-editable content the admin CMS will serve. Each text field arrives in both languages so the app can
 * switch language without another request; Gujarati may be empty, in which case English is shown.
 * These shapes mirror the admin app's content models. Keep them in step when the API contract is written.
 */

export type SupportCategoryId =
  | "delivery_missing"
  | "late_delivery"
  | "wrong_product"
  | "quality_issue"
  | "payment_issue"
  | "subscription_issue"
  | "address_issue"
  | "other";

export interface SupportCategory {
  id: SupportCategoryId;
  labelEn: string;
  labelGu: string;
  iconKey: string;
  sortOrder: number;
}

export interface FaqItem {
  id: string;
  topic: SupportCategoryId;
  questionEn: string;
  questionGu: string;
  answerEn: string;
  answerGu: string;
  searchKeywords: string[];
  featured: boolean;
  sortOrder: number;
}

export type BannerType = "promotion" | "warning" | "maintenance" | "informational";
export type BannerCtaType = "none" | "product" | "category" | "offers";

export interface BannerContent {
  id: string;
  type: BannerType;
  titleEn: string;
  titleGu: string;
  messageEn: string;
  messageGu: string;
  /** An optional short tag on the card, such as "SEASONAL OFFER". Empty shows nothing. */
  labelEn: string;
  labelGu: string;
  imageUrl: string | null;
  ctaType: BannerCtaType;
  ctaTarget: string;
  sortOrder: number;
}

export interface OnboardingSlide {
  id: string;
  imageUrl: string | null;
  titleEn: string;
  titleGu: string;
  descriptionEn: string;
  descriptionGu: string;
  sortOrder: number;
}

export type PolicyType = "privacy" | "terms" | "refund" | "cancellation" | "subscription" | "delivery";

export interface PolicyDocument {
  id: string;
  type: PolicyType;
  titleEn: string;
  titleGu: string;
  bodyEn: string;
  bodyGu: string;
  version: string;
  effectiveDate: string;
}

/** Switches for features the installed app already has. They show or hide; they never add new native behaviour. */
export interface FeatureFlags {
  showTrials: boolean;
  showSubscriptions: boolean;
  showOffers: boolean;
  showQualityReports: boolean;
  showSeasonalBanner: boolean;
}

export interface AppConfig {
  supportPhone: string;
  supportEmail: string;
  supportWhatsApp: string;
  callEnabled: boolean;
  chatEnabled: boolean;
  whatsappEnabled: boolean;
  supportHoursEn: string;
  supportHoursGu: string;
  afterHoursMessageEn: string;
  afterHoursMessageGu: string;
  deliveryPromiseEn: string;
  deliveryPromiseGu: string;
  minimumAppVersion: string;
  maintenanceMode: boolean;
  maintenanceMessageEn: string;
  maintenanceMessageGu: string;
  showMaintenanceContact: boolean;
  flags: FeatureFlags;
}

export type LocalizedPair = { en: string; gu: string };
export type { AppLanguage };
