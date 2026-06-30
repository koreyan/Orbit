import type { LoveSectionEvidence } from "./types";

export interface LoveEvidenceMapInput {
  gender: string;
  lifePalace: string;
  shenGong: string;
  spousePalace: string;
  careerPalace: string;
  wealthPalace: string;
  fortunePalace: string;
  childrenPalace: string;
  migrationPalace: string;
  networkPalace: string;
  loveTags: string;
  monthlyFlow: string;
}

export interface MonthlyLiuyueEvidence {
  month: number;
  centerPalace: string;
  majorStars: string;
  affectionSignals: string[];
  cautionSignals: string[];
  evidenceReason: string;
  expectedSituation: string;
  actionHint: string;
}

const LOVE_SECTION_EVIDENCE: LoveSectionEvidence[] = [
  {
    section: "1. 나의 기본 성향과 인간관계",
    primaryPalaces: ["명궁", "복덕궁", "천이궁", "부처궁/부부궁", "관록궁", "부처궁 삼방사정"],
    directEvidenceLimit: 8,
    requiredTags: ["solo_blocker", "action_guide"],
    writingInstruction: "love-reading-interpretation-guide.md 기준만 사용한다. 명궁은 타고난 기질과 첫 반응, 복덕궁은 혼자 있을 때의 감정 습관과 정서적 만족 기준, 천이궁은 외부 환경의 태도와 대인관계 이미지, 부처궁은 감정 태도와 연애관, 부처궁-관록궁 차이는 내면 욕구와 상대 조건의 혼란으로 읽는다.",
  },
  {
    section: "2. 내가 끌리는 사람 vs 실제로 잘 맞는 사람",
    primaryPalaces: ["부처궁/부부궁", "관록궁", "천이궁", "도화성", "복덕궁", "살성"],
    directEvidenceLimit: 8,
    requiredTags: ["attraction_pattern", "compatible_partner", "conflict_pattern"],
    writingInstruction: "love-reading-interpretation-guide.md 기준만 사용한다. 부처궁은 내면적 감정 욕구와 끌리는 유형, 관록궁은 상대에게 요구하는 조건과 사회적 기준으로 읽고, 두 궁의 성향 차이가 클 때 끌리는 사람과 실제 편안한 사람이 달라지는 구조를 설명한다. 도화의 길흉은 살성 유무와 복덕궁 강약으로 판단한다.",
  },
  {
    section: "3-1. 분위기와 첫인상 매력",
    primaryPalaces: ["명궁", "명궁 궁위", "도화성", "천이궁"],
    directEvidenceLimit: 8,
    requiredTags: ["charm_asset", "attraction_pattern"],
    writingInstruction: "love-reading-interpretation-guide.md 기준만 사용한다. 명궁 주성과 궁위로 첫인상과 분위기를 읽고, 도화성이 명궁에 있으면 외모나 성격이 호감을 살 가능성으로 읽으며, 천이궁 주성으로 밖에서 드러나는 대외 반응과 이미지를 읽는다.",
  },
  {
    section: "3-2. 정서적 매력 — 잠재력과 기르는 법",
    primaryPalaces: ["복덕궁", "부처궁/부부궁", "성별", "염정", "천량", "탐랑", "파군", "문곡", "홍란"],
    directEvidenceLimit: 8,
    requiredTags: ["charm_asset", "attraction_pattern", "compatible_partner", "solo_blocker"],
    writingInstruction: "love-reading-interpretation-guide.md 기준만 사용한다. 복덕궁 주성으로 정서적 매력 잠재력을 읽고, 부처궁 주성으로 감정 작동 방식을 읽는다. 남성 리포트면 여성이 느끼는 매력 중심, 여성 리포트면 남성이 느끼는 매력 중심으로 쓴다. 지금 잠재해 있는 이유는 복덕궁 구조에서 파악한다.",
  },
  {
    section: "3-3. 외적 매력 — 잠재력과 기르는 법",
    primaryPalaces: ["자녀궁/자식궁", "성별", "주요 매력·도화 별"],
    directEvidenceLimit: 8,
    requiredTags: ["charm_asset", "attraction_pattern"],
    writingInstruction: "love-reading-interpretation-guide.md 기준만 사용한다. 자녀궁 주성으로 이성에게 비춰지는 표현·육체적 매력을 읽고, 자녀궁은 육체적 사랑의 질과 성적 에너지를 담당하는 근거로 사용한다. 남성 리포트면 여성 시선, 여성 리포트면 남성 시선에서 느껴지는 매력으로 쓴다.",
  },
  {
    section: "3-4. 이성과 만날 때 매력 활용 스토리",
    primaryPalaces: ["3-1 결과", "3-2 결과", "3-3 결과", "중첩궁", "명궁", "자녀궁", "복덕궁"],
    directEvidenceLimit: 8,
    requiredTags: ["encounter_path", "charm_asset", "action_guide"],
    writingInstruction: "love-reading-interpretation-guide.md 기준만 사용한다. 3-1, 3-2, 3-3에서 도출된 매력을 실제 만남에서 어떻게 쓰는지 구성한다. 중첩궁이 관록궁이면 직장·업무, 노복궁이면 소개팅·친구 모임·지인 연결, 천이궁이면 동호회·클래스·외부 정기 모임, 부모궁·형제궁이면 가족 지인·선배·연장자 주선 자리로 설정한다.",
  },
  {
    section: "4. 인연이 들어오기 쉬운 방식",
    primaryPalaces: ["중첩궁", "소한 명궁 아래 중첩궁"],
    directEvidenceLimit: 8,
    requiredTags: ["encounter_path", "action_guide"],
    writingInstruction: "love-reading-interpretation-guide.md 기준만 사용한다. 중첩궁으로 만남의 경로를 파악한다. 관록궁이면 직장·업무, 노복궁이면 친구 소개, 천이궁이면 외출·여행, 부모궁·형제궁이면 연장자 소개로 쓰고, 소한 명궁 아래 중첩궁으로 인연이 들어오는 공간을 특정한다.",
  },
  {
    section: "5. 올해 인연 기회",
    primaryPalaces: ["유년 명궁", "유년 부처궁", "사화성", "탐랑+화록", "살성", "홍란·천희", "유년 1~12월"],
    directEvidenceLimit: 12,
    requiredTags: ["timing_signal"],
    writingInstruction: "love-reading-interpretation-guide.md 기준만 사용한다. 유년 명궁으로 올해 주제를 보고, 유년 부처궁의 별 조합을 확인한다. 화록은 인연 기회, 화기는 감정적 장애로 읽는다. 유년 데이터로 1~12월별 흐름을 작성한다.",
  },
  {
    section: "6. 지금 당장 해야 할 연애 준비",
    primaryPalaces: ["3번 매력 섹션 결과", "부처궁 화기", "부처궁 살성"],
    directEvidenceLimit: 8,
    requiredTags: ["action_guide", "solo_blocker"],
    writingInstruction: "love-reading-interpretation-guide.md 기준만 사용한다. 3번 매력 섹션에서 도출된 잠재 매력과 기르는 법을 기반으로 실행 행동을 작성한다. 부처궁 화기의 끊임없는 갈구, 확인 욕구, 집착에서 반복 실수를 줄이는 행동을 포함하고, 부처궁 살성의 감정 리듬별 교정 행동을 포함한다.",
  },
];

const describeGenderEnvironment = (gender: string): string => {
  if (gender === "M") {
    return "남성 리포트: 여성 비율이 높은 환경에서, 사용자의 명궁/관록궁/재백궁/천이궁 강점으로 맡을 수 있는 역할을 제안한다.";
  }

  if (gender === "F") {
    return "여성 리포트: 남성 비율이 높은 환경에서, 사용자의 명궁/관록궁/재백궁/천이궁 강점으로 맡을 수 있는 역할을 제안한다.";
  }

  return "성별 데이터가 불명확하면 이성 비율이 높은 환경이라는 표현은 유지하되, 특정 성별 비율 단정은 피한다.";
};

export const formatLoveSectionEvidenceMap = (input: LoveEvidenceMapInput): string => {
  const sectionBlocks = LOVE_SECTION_EVIDENCE.map((section) => `
[${section.section}]
- 주요 궁/데이터: ${section.primaryPalaces.join(", ")}
- 직접 명반 근거 상한: ${section.directEvidenceLimit}개
- 태그별 보강 근거: ${section.requiredTags.join(", ")}
- 작성 지시: ${section.writingInstruction}
`).join("\n");

  return `
[SECTION_EVIDENCE_MAP]
- 근거 우선순위: 실제 명반 직접 근거 > 예외 처리 필수 근거 > 섹션별 태그 보강 근거 > 일반 총론
- ${describeGenderEnvironment(input.gender)}

[직접 명반 요약]
- 명궁: ${input.lifePalace}
- 신궁: ${input.shenGong}
- 부처궁/부부궁: ${input.spousePalace}
- 관록궁: ${input.careerPalace}
- 재백궁: ${input.wealthPalace}
- 복덕궁: ${input.fortunePalace}
- 자녀궁/자식궁: ${input.childrenPalace}
- 천이궁: ${input.migrationPalace}
- 노복궁/형제궁: ${input.networkPalace}

[연애 태그 요약]
${input.loveTags}

${sectionBlocks}
`;
};

export const formatMonthlyLiuyueFlow = (monthlyItems: MonthlyLiuyueEvidence[]): string => {
  if (monthlyItems.length === 0) {
    return "[MONTHLY_LIUYUE_FLOW]\n- 유월 데이터 없음";
  }

  return `
[MONTHLY_LIUYUE_FLOW]
${monthlyItems.map((item) => `- ${item.month}월
  - 월별 중심 궁위: ${item.centerPalace}
  - 주요 별: ${item.majorStars}
  - 호감/인연 신호: ${item.affectionSignals.length > 0 ? item.affectionSignals.join(", ") : "강한 신호 없음"}
  - 주의 신호: ${item.cautionSignals.length > 0 ? item.cautionSignals.join(", ") : "강한 주의 신호 없음"}
  - 해석 근거: ${item.evidenceReason}
  - 예상 상황: ${item.expectedSituation}
  - 행동 힌트: ${item.actionHint}`).join("\n")}
`;
};
