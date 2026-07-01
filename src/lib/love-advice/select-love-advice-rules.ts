import type { LoveRiskPattern } from "@/lib/love-analysis/types";
import { LOVE_ADVICE_RULES } from "./love-advice-rules";
import type { LoveAdviceRule, LoveReportSectionId, MatchedLoveAdviceRule } from "./types";

export interface SelectLoveAdviceRulesInput {
  riskPatterns: LoveRiskPattern[];
  reportSection?: LoveReportSectionId;
  maxRules?: number;
}

const DEFAULT_MAX_RULES = 6;
const DEFAULT_SECTION_LIMIT = 2;
const PREPARATION_SECTION_LIMIT = 3;

const sectionLimit = (section: LoveReportSectionId): number => section === 6 ? PREPARATION_SECTION_LIMIT : DEFAULT_SECTION_LIMIT;

const hasMatchingRisk = (rule: LoveAdviceRule, riskType: string): boolean => rule.matchTags.includes(riskType as LoveAdviceRule["matchTags"][number]);

const scoreRule = (rule: LoveAdviceRule, riskPatterns: LoveRiskPattern[], reportSection?: LoveReportSectionId): number => {
  const matchedRisks = riskPatterns.filter((risk) => hasMatchingRisk(rule, risk.riskType));
  if (matchedRisks.length === 0) return -1;

  const severityScore = matchedRisks.reduce((sum, risk) => {
    if (risk.severity === "high") return sum + 5;
    if (risk.severity === "medium") return sum + 3;
    return sum + 1;
  }, 0);
  const sectionScore = reportSection && rule.obitSections.includes(reportSection) ? 4 : 0;
  const riskSectionScore = matchedRisks.some((risk) => rule.obitSections.includes(risk.relatedSection)) ? 3 : 0;
  const axisScore = rule.axisMain ? 2 : 0;

  return severityScore + sectionScore + riskSectionScore + axisScore;
};

export const selectLoveAdviceRules = (input: SelectLoveAdviceRulesInput): MatchedLoveAdviceRule[] => {
  const maxRules = input.maxRules ?? DEFAULT_MAX_RULES;
  const rules: readonly LoveAdviceRule[] = LOVE_ADVICE_RULES;
  const scoredRules = rules
    .map((rule) => ({
      rule,
      score: scoreRule(rule, input.riskPatterns, input.reportSection),
      matchedRiskTypes: input.riskPatterns
        .filter((risk) => hasMatchingRisk(rule, risk.riskType))
        .map((risk) => risk.riskType),
      matchedSections: input.riskPatterns
        .filter((risk) => hasMatchingRisk(rule, risk.riskType))
        .map((risk) => risk.relatedSection),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.rule.priority - right.rule.priority;
    });

  const selected: MatchedLoveAdviceRule[] = [];
  const sectionCounts = new Map<LoveReportSectionId, number>();
  const axisCounts = new Map<string, number>();

  for (const item of scoredRules) {
    if (selected.length >= maxRules) break;

    const primarySection = item.rule.obitSections[0];
    const currentSectionCount = sectionCounts.get(primarySection) ?? 0;
    const currentAxisCount = axisCounts.get(item.rule.axisName) ?? 0;

    if (currentSectionCount >= sectionLimit(primarySection)) continue;
    if (currentAxisCount >= 3) continue;

    selected.push({
      rule: item.rule,
      matchedRiskTypes: Array.from(new Set(item.matchedRiskTypes)),
      matchedSections: Array.from(new Set(item.matchedSections)),
    });
    sectionCounts.set(primarySection, currentSectionCount + 1);
    axisCounts.set(item.rule.axisName, currentAxisCount + 1);
  }

  return selected;
};
