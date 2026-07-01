import type { LoveReportSectionId, LoveRiskType } from "@/lib/love-advice/types";

export interface LoveTraitFinding {
  id: string;
  section: LoveReportSectionId;
  source: "chart" | "db_evidence" | "section_evidence_map" | "love_tag";
  finding: string;
  evidence: string[];
  riskHints: LoveRiskType[];
  confidence: "high" | "medium" | "low";
}

export interface LoveRiskPattern {
  riskId: string;
  relatedSection: LoveReportSectionId;
  riskType: LoveRiskType;
  description: string;
  evidence: string[];
  severity: "high" | "medium" | "low";
}
