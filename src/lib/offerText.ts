import type { TFunction } from "i18next";

import type { Offer } from "../types/offers";
import { formatRupees } from "./catalogCart";

/** "20% off, up to ₹100", "₹100 off" or "Free gift": what an offer gives, in the customer's language. */
export function offerValueText(offer: Pick<Offer, "kind" | "percent" | "flatPaise" | "maxDiscountPaise">, t: TFunction): string {
  if (offer.kind === "percent") {
    const base = t("offers.percentOff", { percent: offer.percent ?? 0 });
    return offer.maxDiscountPaise ? `${base}, ${t("offers.upTo", { amount: formatRupees(offer.maxDiscountPaise) })}` : base;
  }
  if (offer.kind === "flat") return t("offers.flatOff", { amount: formatRupees(offer.flatPaise ?? 0) });
  return t("offers.freeGift");
}

/** Where an offer works, for example "One-time orders · Subscriptions". */
export function offerWorksForText(offer: Pick<Offer, "appliesOneTime" | "appliesTrial" | "appliesSubscription" | "minPlanDays">, t: TFunction): string {
  const parts = [
    offer.appliesOneTime ? t("offers.oneTime") : null,
    offer.appliesTrial ? t("offers.trials") : null,
    offer.appliesSubscription ? (offer.minPlanDays ? `${t("offers.subscriptions")} (${t("offers.planDays", { days: offer.minPlanDays })})` : t("offers.subscriptions")) : null,
  ];
  return parts.filter(Boolean).join(" · ");
}
