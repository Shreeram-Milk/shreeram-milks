import policies from "../mock-data/policies.json";
import type { PolicyDocument, PolicyType } from "../types/content";
import { apiGet, hasApi } from "./apiClient";

const TYPES: readonly PolicyType[] = ["privacy", "terms", "refund", "cancellation", "subscription", "delivery"];
const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** Checks one policy from the server. A malformed policy is dropped, so a bad record can never break the screen. */
export function parsePolicy(raw: unknown): PolicyDocument | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const id = text(item.id);
  const titleEn = text(item.titleEn).trim();
  const bodyEn = text(item.bodyEn).trim();
  if (!id || !TYPES.includes(item.type as PolicyType) || !titleEn || !bodyEn) return null;
  return { id, type: item.type as PolicyType, titleEn, titleGu: text(item.titleGu), bodyEn, bodyGu: text(item.bodyGu), version: text(item.version), effectiveDate: text(item.effectiveDate) };
}

/**
 * The one published version of each policy. A policy with no published version is simply absent. With a backend
 * address set they come from the admin through the API; without one the bundled sample is used.
 */
export async function getPolicies(): Promise<PolicyDocument[]> {
  if (!hasApi()) return policies as PolicyDocument[];
  const body = await apiGet<{ policies?: unknown }>("/public/policies");
  if (!Array.isArray(body.policies)) return [];
  return body.policies.map(parsePolicy).filter((policy): policy is PolicyDocument => policy !== null);
}

export async function getPolicy(type: PolicyType): Promise<PolicyDocument | undefined> {
  return (await getPolicies()).find((policy) => policy.type === type);
}
