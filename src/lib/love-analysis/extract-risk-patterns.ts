import type { LoveRiskType } from "@/lib/love-advice/types";
import type { LoveRiskPattern, LoveTraitFinding } from "./types";

const KEYWORD_RISK_MAP: Array<{ keywords: string[]; riskType: LoveRiskType }> = [
  { keywords: ["확인", "갈구", "집착", "서운"], riskType: "confirmation_seeking" },
  { keywords: ["연락", "답장", "스마트폰"], riskType: "contact_anxiety" },
  { keywords: ["속도", "올라오는", "늦춰"], riskType: "pace_control" },
  { keywords: ["공간", "혼자", "분리"], riskType: "boundary_failure" },
  { keywords: ["외로움", "공허", "이별"], riskType: "loneliness_based_choice" },
  { keywords: ["끌리는 유형", "조건", "기준"], riskType: "ideal_type_confusion" },
  { keywords: ["강한 끌림", "위험 신호", "호감"], riskType: "unstable_attraction" },
  { keywords: ["대화", "감정", "갈등"], riskType: "conflict_expression" },
  { keywords: ["루틴", "관계 밖"], riskType: "self_routine" },
  { keywords: ["공간", "역할", "노출"], riskType: "encounter_action" },
  { keywords: ["올해", "월별", "시기"], riskType: "timing_response" },
  { keywords: ["매력", "첫인상", "분위기"], riskType: "charm_operation" },
];

const inferRisksFromText = (text: string): LoveRiskType[] => {
  const inferred = KEYWORD_RISK_MAP
    .filter((entry) => entry.keywords.some((keyword) => text.includes(keyword)))
    .map((entry) => entry.riskType);

  return Array.from(new Set(inferred));
};

const severityFromFinding = (finding: LoveTraitFinding): "high" | "medium" | "low" => {
  if (finding.confidence === "high" && finding.riskHints.length >= 2) return "high";
  if (finding.confidence === "low") return "low";
  return "medium";
};

export const extractRiskPatterns = (findings: LoveTraitFinding[]): LoveRiskPattern[] => {
  const seen = new Set<string>();
  const risks: LoveRiskPattern[] = [];

  for (const finding of findings) {
    const inferredRisks = inferRisksFromText(`${finding.finding} ${finding.evidence.join(" ")}`);
    const riskTypes = Array.from(new Set([...finding.riskHints, ...inferredRisks]));

    for (const riskType of riskTypes) {
      const key = `${finding.section}:${riskType}`;
      if (seen.has(key)) continue;
      seen.add(key);

      risks.push({
        riskId: `risk-${finding.section}-${riskType}`,
        relatedSection: finding.section,
        riskType,
        description: `${finding.finding} 이 패턴은 ${riskType} 리스크로 번역해 조언 rule을 선택한다.`,
        evidence: finding.evidence,
        severity: severityFromFinding(finding),
      });
    }
  }

  return risks
    .sort((left, right) => {
      const severityScore = { high: 0, medium: 1, low: 2 };
      const severityGap = severityScore[left.severity] - severityScore[right.severity];
      if (severityGap !== 0) return severityGap;
      return left.relatedSection - right.relatedSection;
    })
    .slice(0, 8);
};

export const formatLoveRiskPatterns = (risks: LoveRiskPattern[]): string => {
  if (risks.length === 0) return "[RISK_PATTERNS]\n- 추출된 연애 문제점 없음";

  return `
[RISK_PATTERNS]
- 역할: 아래 내용은 기질 요약이 연애에서 만들 수 있는 문제점만 정리한 것이다. 이 단계에서는 행동 조언을 직접 만들지 않는다.
${risks.map((risk, index) => `${index + 1}. ${risk.riskId}
   - 섹션: ${risk.relatedSection}
   - risk_type: ${risk.riskType}
   - 문제점: ${risk.description}
   - 근거: ${risk.evidence.join(" / ")}
   - severity: ${risk.severity}`).join("\n")}
`;
};
