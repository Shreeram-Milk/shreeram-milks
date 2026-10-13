import onboarding from "../mock-data/onboarding.json";
import type { OnboardingSlide } from "../types/content";
import { apiGet, hasApi } from "./apiClient";

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** Checks one slide from the server. A malformed slide is dropped, so a bad record can never break the introduction. */
export function parseOnboardingSlide(raw: unknown): OnboardingSlide | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const id = text(item.id);
  const titleEn = text(item.titleEn).trim();
  if (!id || !titleEn) return null;
  return {
    id,
    imageUrl: typeof item.imageUrl === "string" && item.imageUrl.startsWith("https://") ? item.imageUrl : null,
    titleEn,
    titleGu: text(item.titleGu),
    descriptionEn: text(item.descriptionEn),
    descriptionGu: text(item.descriptionGu),
    sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : 0,
  };
}

/**
 * First-run introduction slides. With a backend address set they come from the admin through the API; without one the
 * bundled sample is used. The screen keeps its built-in introduction as a fallback for no slides or a failed request.
 */
export async function getOnboardingSlides(): Promise<OnboardingSlide[]> {
  if (!hasApi()) return (onboarding as OnboardingSlide[]).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const body = await apiGet<{ slides?: unknown }>("/public/onboarding");
  if (!Array.isArray(body.slides)) return [];
  return body.slides.map(parseOnboardingSlide).filter((slide): slide is OnboardingSlide => slide !== null).sort((a, b) => a.sortOrder - b.sortOrder);
}
