import faqs from "../mock-data/faqs.json";
import supportCategories from "../mock-data/support-categories.json";
import type { FaqItem, SupportCategory, SupportCategoryId } from "../types/content";
import { apiGet, hasApi } from "./apiClient";

export interface HelpContent {
  faqs: FaqItem[];
  topics: SupportCategory[];
}

const TOPIC_IDS: readonly SupportCategoryId[] = ["delivery_missing", "late_delivery", "wrong_product", "quality_issue", "payment_issue", "subscription_issue", "address_issue", "other"];
const isTopicId = (value: unknown): value is SupportCategoryId => TOPIC_IDS.includes(value as SupportCategoryId);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const number = (value: unknown): number => (typeof value === "number" ? value : 0);

/** Checks one topic from the server. A malformed topic is dropped, so a bad record can never break the Help screen. */
export function parseTopic(raw: unknown): SupportCategory | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const labelEn = text(item.labelEn).trim();
  if (!isTopicId(item.id) || !labelEn) return null;
  return { id: item.id, labelEn, labelGu: text(item.labelGu), iconKey: text(item.iconKey), sortOrder: number(item.sortOrder) };
}

/** Checks one question from the server. A malformed question is dropped. */
export function parseFaq(raw: unknown): FaqItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const id = text(item.id);
  const questionEn = text(item.questionEn).trim();
  const answerEn = text(item.answerEn).trim();
  if (!id || !isTopicId(item.topic) || !questionEn || !answerEn) return null;
  return {
    id,
    topic: item.topic,
    questionEn,
    questionGu: text(item.questionGu),
    answerEn,
    answerGu: text(item.answerGu),
    searchKeywords: Array.isArray(item.searchKeywords) ? item.searchKeywords.filter((word): word is string => typeof word === "string") : [],
    featured: item.featured === true,
    sortOrder: number(item.sortOrder),
  };
}

const bySortOrder = <T extends { sortOrder: number }>(items: T[]) => items.slice().sort((a, b) => a.sortOrder - b.sortOrder);

/**
 * The Help screen's topics and questions, in one request. With a backend address set they come from the admin through
 * the API (only published questions); without one the bundled sample is used.
 */
export async function getHelpContent(): Promise<HelpContent> {
  if (!hasApi()) return { topics: bySortOrder(supportCategories as SupportCategory[]), faqs: bySortOrder(faqs as FaqItem[]) };
  const body = await apiGet<{ faqs?: unknown; topics?: unknown }>("/public/help");
  const topics = Array.isArray(body.topics) ? body.topics.map(parseTopic).filter((topic): topic is SupportCategory => topic !== null) : [];
  const questions = Array.isArray(body.faqs) ? body.faqs.map(parseFaq).filter((faq): faq is FaqItem => faq !== null) : [];
  // The server already orders questions by topic, then by their own order; the topics keep the admin's order.
  return { topics: bySortOrder(topics), faqs: questions };
}
