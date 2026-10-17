import { useQuery } from "@tanstack/react-query";

import { defaultFeatureFlags, getAppConfig } from "../services/appSettingsService";
import { getBanners } from "../services/bannerService";
import { getHelpContent, type HelpContent } from "../services/helpService";
import { getOffers } from "../services/offerService";
import { getOnboardingSlides } from "../services/onboardingContentService";
import { getPolicies } from "../services/policyService";
import { queryKeys } from "../services/queryKeys";

/** Admin-editable content. It changes rarely, so it is cached for a few minutes. */
const BANNER_STALE_MS = 30 * 1000;
const CONTENT_STALE_MS = 5 * 60 * 1000;

/** Settings can switch the app off for maintenance, so they are re-checked sooner than other content, and when the app is reopened. */
export const useAppConfig = () => useQuery({ queryKey: queryKeys.appConfig, queryFn: getAppConfig, staleTime: BANNER_STALE_MS * 2, refetchOnWindowFocus: true });
/** The admin's feature switches. All on until the settings arrive, so a slow connection never hides a feature by mistake. */
export const useFeatureFlags = () => useAppConfig().data?.flags ?? defaultFeatureFlags;
export const useOffers = () => useQuery({ queryKey: queryKeys.offers, queryFn: getOffers, staleTime: BANNER_STALE_MS, refetchOnWindowFocus: true });
export const useBanners = () => useQuery({ queryKey: queryKeys.banners, queryFn: getBanners, staleTime: BANNER_STALE_MS, refetchOnWindowFocus: true });
// Topics and questions arrive in one request; both hooks share it, so opening Help or Report costs one call, not two.
const selectFaqs = (content: HelpContent) => content.faqs;
const selectTopics = (content: HelpContent) => content.topics;
const useHelpContent = <T,>(select: (content: HelpContent) => T) => useQuery({ queryKey: queryKeys.help, queryFn: getHelpContent, staleTime: CONTENT_STALE_MS, select });
export const useFaqs = () => useHelpContent(selectFaqs);
export const useSupportCategories = () => useHelpContent(selectTopics);
export const usePolicies = () => useQuery({ queryKey: queryKeys.policies, queryFn: getPolicies, staleTime: CONTENT_STALE_MS });
export const useOnboardingSlides = () => useQuery({ queryKey: queryKeys.onboardingSlides, queryFn: getOnboardingSlides, staleTime: CONTENT_STALE_MS });
