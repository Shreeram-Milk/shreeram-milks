import reports from "../mock-data/quality-reports.json";
import type { QualityReport } from "../types/content";

/** Published lab reports and certificates, newest first. The API version returns only published, current ones. */
export async function getQualityReports(): Promise<QualityReport[]> {
  return (reports as QualityReport[]).slice().sort((a, b) => b.reportDate.localeCompare(a.reportDate));
}
