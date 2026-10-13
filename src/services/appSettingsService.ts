import appConfigData from "../mock-data/app-config.json";
import type { AppConfig, FeatureFlags } from "../types/content";
import { apiGet, hasApi } from "./apiClient";

const defaults = appConfigData as AppConfig;
/** Every feature on: what the app shows until the settings arrive, or if they cannot be read. */
export const defaultFeatureFlags: FeatureFlags = defaults.flags;
const text = (value: unknown, fallback: string): string => (typeof value === "string" ? value : fallback);
// A missing or malformed switch falls back to its safe default: features stay on, and the app is never put into maintenance by mistake.
const flag = (value: unknown, fallback: boolean): boolean => (typeof value === "boolean" ? value : fallback);

/** Checks the settings from the server and keeps only what the app uses; anything missing or malformed gets its safe default. */
export function parseAppConfig(raw: unknown): AppConfig {
  const item = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const flagsRaw = (typeof item.flags === "object" && item.flags !== null ? item.flags : {}) as Record<string, unknown>;
  const flags: FeatureFlags = {
    showTrials: flag(flagsRaw.showTrials, defaults.flags.showTrials),
    showSubscriptions: flag(flagsRaw.showSubscriptions, defaults.flags.showSubscriptions),
    showOffers: flag(flagsRaw.showOffers, defaults.flags.showOffers),
    showQualityReports: flag(flagsRaw.showQualityReports, defaults.flags.showQualityReports),
    showSeasonalBanner: flag(flagsRaw.showSeasonalBanner, defaults.flags.showSeasonalBanner),
  };
  const version = text(item.minimumAppVersion, defaults.minimumAppVersion);
  return {
    supportPhone: text(item.supportPhone, defaults.supportPhone),
    supportEmail: text(item.supportEmail, defaults.supportEmail),
    supportWhatsApp: text(item.supportWhatsApp, defaults.supportWhatsApp),
    callEnabled: flag(item.callEnabled, defaults.callEnabled),
    chatEnabled: flag(item.chatEnabled, defaults.chatEnabled),
    whatsappEnabled: flag(item.whatsappEnabled, defaults.whatsappEnabled),
    supportHoursEn: text(item.supportHoursEn, defaults.supportHoursEn),
    supportHoursGu: text(item.supportHoursGu, defaults.supportHoursGu),
    afterHoursMessageEn: text(item.afterHoursMessageEn, defaults.afterHoursMessageEn),
    afterHoursMessageGu: text(item.afterHoursMessageGu, defaults.afterHoursMessageGu),
    deliveryPromiseEn: text(item.deliveryPromiseEn, defaults.deliveryPromiseEn),
    deliveryPromiseGu: text(item.deliveryPromiseGu, defaults.deliveryPromiseGu),
    minimumAppVersion: /^\d+\.\d+\.\d+$/.test(version) ? version : defaults.minimumAppVersion,
    maintenanceMode: flag(item.maintenanceMode, false),
    maintenanceMessageEn: text(item.maintenanceMessageEn, defaults.maintenanceMessageEn),
    maintenanceMessageGu: text(item.maintenanceMessageGu, defaults.maintenanceMessageGu),
    showMaintenanceContact: flag(item.showMaintenanceContact, defaults.showMaintenanceContact),
    flags,
  };
}

/**
 * Support details, feature switches and availability, read at start-up. With a backend address set they come from the
 * admin through the API; without one the bundled defaults are used.
 */
export async function getAppConfig(): Promise<AppConfig> {
  if (!hasApi()) return defaults;
  const body = await apiGet<{ settings?: unknown }>("/public/app-settings");
  return parseAppConfig(body.settings);
}
