import type { ExtractedPalace, LoveTagData, StarWithSiHua } from "@/lib/ziwei-extractor";
import type { LoveTraitFinding } from "./types";

export interface ExtractLoveTraitsInput {
  gender: string;
  lifePalace?: ExtractedPalace | null;
  spousePalace?: ExtractedPalace | null;
  careerPalace?: ExtractedPalace | null;
  fortunePalace?: ExtractedPalace | null;
  childrenPalace?: ExtractedPalace | null;
  migrationPalace?: ExtractedPalace | null;
  loveTagData: LoveTagData | null;
}

const UNLUCKY_STARS = ["화성", "영성", "경양", "타라", "지공", "지겁"];
const PEACH_BLOSSOM_STARS = ["탐랑", "염정", "문창", "문곡", "홍란", "천희", "함지"];

const collectStarNames = (palace?: ExtractedPalace | null): string[] => {
  if (!palace) return [];
  return [
    ...(palace.majorStars || []),
    ...(palace.luckyStars || []),
    ...(palace.unluckyStars || []),
  ].flatMap((star: StarWithSiHua) => [star.name, star.sihua].filter(Boolean) as string[]);
};

const formatPalaceEvidence = (label: string, palace?: ExtractedPalace | null): string => {
  if (!palace) return `${label}: 데이터 없음`;

  const names = collectStarNames(palace);
  const borrowed = palace.borrowed ? " / 차성안궁" : "";
  return `${label}: ${names.length > 0 ? names.join(", ") : "비어있음"}${borrowed}`;
};

const hasAny = (values: string[], targets: string[]): boolean => targets.some((target) => values.includes(target));

const addFinding = (findings: LoveTraitFinding[], finding: LoveTraitFinding): void => {
  if (!finding.finding.trim()) return;
  findings.push(finding);
};

export const extractLoveTraits = (input: ExtractLoveTraitsInput): LoveTraitFinding[] => {
  const findings: LoveTraitFinding[] = [];
  const spouseStars = collectStarNames(input.spousePalace);
  const careerStars = collectStarNames(input.careerPalace);
  const childrenStars = collectStarNames(input.childrenPalace);
  const migrationStars = collectStarNames(input.migrationPalace);

  const spouseUnluckyCount = spouseStars.filter((star) => UNLUCKY_STARS.includes(star)).length;
  const hasSpouseHwaGi = spouseStars.includes("화기");
  const hasUnstableAttraction = hasAny([...spouseStars, ...childrenStars, ...migrationStars], PEACH_BLOSSOM_STARS)
    && hasAny([...spouseStars, ...childrenStars], UNLUCKY_STARS);
  const hasDifferentNeedAndCondition = spouseStars.join("|") !== careerStars.join("|") && spouseStars.length > 0 && careerStars.length > 0;
  const genderLabel = input.gender === "M" ? "여성이 느끼는 매력" : input.gender === "F" ? "남성이 느끼는 매력" : "상대 이성이 느끼는 매력";

  addFinding(findings, {
    id: "trait-section-1-basic-relationship",
    section: 1,
    source: "chart",
    finding: "타고난 첫 반응, 혼자 있을 때의 감정 습관, 외부에서 보이는 태도, 관계 기대치가 서로 어떻게 맞물리는지 먼저 읽어야 한다.",
    evidence: [
      formatPalaceEvidence("명궁", input.lifePalace),
      formatPalaceEvidence("복덕궁", input.fortunePalace),
      formatPalaceEvidence("천이궁", input.migrationPalace),
      formatPalaceEvidence("부처궁", input.spousePalace),
    ],
    riskHints: hasSpouseHwaGi ? ["confirmation_seeking", "pace_control"] : ["self_routine"],
    confidence: "high",
  });

  if (hasDifferentNeedAndCondition) {
    addFinding(findings, {
      id: "trait-section-2-attraction-fit-gap",
      section: 2,
      source: "chart",
      finding: "내면에서 끌리는 유형과 현실에서 조건으로 요구하는 기준이 달라질 수 있다.",
      evidence: [formatPalaceEvidence("부처궁", input.spousePalace), formatPalaceEvidence("관록궁", input.careerPalace)],
      riskHints: ["ideal_type_confusion", "condition_overload"],
      confidence: "high",
    });
  }

  if (hasUnstableAttraction || spouseUnluckyCount > 0) {
    addFinding(findings, {
      id: "trait-section-2-unstable-attraction",
      section: 2,
      source: "chart",
      finding: "강한 끌림이 생길 때 호감과 위험 신호가 같이 들어올 수 있어 초반 판별이 필요하다.",
      evidence: [formatPalaceEvidence("부처궁", input.spousePalace), formatPalaceEvidence("자녀궁", input.childrenPalace)],
      riskHints: ["unstable_attraction", "projection", "words_over_actions"],
      confidence: hasUnstableAttraction ? "high" : "medium",
    });
  }

  addFinding(findings, {
    id: "trait-section-3-charm-asset",
    section: 3,
    source: "chart",
    finding: `${genderLabel}은 현재 어떤 정서적 매력, 외적·표현 매력, 성적 끌림의 분위기로 전달되는지 먼저 설명해야 한다. 조언은 매력 묘사 뒤에 붙는 보조 정보다.`,
    evidence: [
      formatPalaceEvidence("명궁", input.lifePalace),
      formatPalaceEvidence("복덕궁", input.fortunePalace),
      formatPalaceEvidence("자녀궁", input.childrenPalace),
      formatPalaceEvidence("천이궁", input.migrationPalace),
    ],
    riskHints: ["charm_operation"],
    confidence: "medium",
  });

  if (input.loveTagData?.encounter_path) {
    addFinding(findings, {
      id: "trait-section-4-encounter-path",
      section: 4,
      source: "love_tag",
      finding: "인연 유입은 막연한 기다림보다 반복적으로 노출되는 공간과 역할에서 만들어질 가능성이 높다.",
      evidence: [input.loveTagData.encounter_path],
      riskHints: ["encounter_action", "fantasy_idealization"],
      confidence: "medium",
    });
  }

  if (input.loveTagData?.timing_signal) {
    addFinding(findings, {
      id: "trait-section-5-timing",
      section: 5,
      source: "love_tag",
      finding: "올해 흐름은 월별 신호를 보되, 강한 감정이 올라오는 시기일수록 행동 속도를 늦춰야 한다.",
      evidence: [input.loveTagData.timing_signal.slice(0, 240)],
      riskHints: ["timing_response", "pace_control"],
      confidence: "medium",
    });
  }

  addFinding(findings, {
    id: "trait-section-6-immediate-preparation",
    section: 6,
    source: "chart",
    finding: "지금 당장 해야 할 준비는 감정 확인 루프를 줄이고, 관계 밖 루틴과 실제 만남의 질을 정비하는 쪽이 우선이다.",
    evidence: [
      input.loveTagData?.action_guide || "연애 준비 행동 데이터 없음",
      formatPalaceEvidence("부처궁", input.spousePalace),
      formatPalaceEvidence("복덕궁", input.fortunePalace),
    ],
    riskHints: ["confirmation_seeking", "contact_anxiety", "self_routine"],
    confidence: "high",
  });

  return findings;
};

export const formatLoveTraitFindings = (findings: LoveTraitFinding[]): string => {
  if (findings.length === 0) return "[TRAIT_FINDINGS]\n- 생성된 기질 요약 없음";

  return `
[TRAIT_FINDINGS]
- 역할: 아래 내용은 자미두수 명반 데이터와 love-reading-interpretation-guide.md 기준으로만 만든 기질 요약이다. 연애 조언 rule은 이 단계에서 사용하지 않는다.
${findings.map((finding, index) => `${index + 1}. ${finding.id}
   - 섹션: ${finding.section}
   - 기질 요약: ${finding.finding}
   - 근거: ${finding.evidence.join(" / ")}
   - 리스크 힌트: ${finding.riskHints.join(", ")}
   - 신뢰도: ${finding.confidence}`).join("\n")}
`;
};
