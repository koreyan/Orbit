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
    primaryPalaces: ["명궁", "신궁", "복덕궁", "천이궁", "노복궁/형제궁"],
    directEvidenceLimit: 8,
    requiredTags: ["solo_blocker", "action_guide"],
    writingInstruction: "성격 라벨이 아니라 사람 앞에서 반복되는 반응, 감정 처리 방식, 관계 습관으로 쓴다.",
  },
  {
    section: "2. 내가 끌리는 사람 vs 실제로 잘 맞는 사람",
    primaryPalaces: ["부처궁/부부궁", "관록궁", "도화성", "천희/홍란"],
    directEvidenceLimit: 8,
    requiredTags: ["attraction_pattern", "compatible_partner", "conflict_pattern"],
    writingInstruction: "끌림과 장기 적합성을 비교하고, 부처궁 공궁이면 관록궁 대궁 보정을 반드시 쓴다.",
  },
  {
    section: "3-1. 분위기와 첫인상 매력",
    primaryPalaces: ["명궁", "천이궁", "도화성"],
    directEvidenceLimit: 8,
    requiredTags: ["charm_asset", "attraction_pattern"],
    writingInstruction: "첫인상, 분위기, 말투, 표정, 거리감, 반응 속도를 쓴다. 공허한 칭찬 금지.",
  },
  {
    section: "3-2. 잠재된 이성적 매력",
    primaryPalaces: ["자녀궁/자식궁", "명궁", "도화성", "부처궁/부부궁", "복덕궁", "화기/살성"],
    directEvidenceLimit: 10,
    requiredTags: ["charm_asset", "attraction_pattern", "compatible_partner", "solo_blocker"],
    writingInstruction: "어떤 매력이 잠재되어 있는가, 이성이 어떤 매력을 느끼는가, 성적 끌림을 하게 하는 나의 매력 포인트, 매력이 약해지는 순간, 매력을 기르는 방법 순서로 쓴다. 성적 끌림 포인트는 [CHARM_ACTION_RULES]의 신체 매력 단서, 분위기 매력 단서, 성적 끌림 근거를 우선 사용하고 정서적 안정감으로 대체하지 않는다. 입술, 피부, 눈, 눈빛, 골격, 체형, 상체, 어깨, 엉덩이, 몸매, 실루엣, 도화, 욕망, 자기장, 반전 매력 중 실제 매칭 근거가 있는 항목만 쓴다. 관록궁/재백궁은 이 섹션 핵심 근거로 쓰지 않는다. 천이궁은 외부 반응 보조만 사용한다.",
  },
  {
    section: "4. 인연이 들어오기 쉬운 방식",
    primaryPalaces: ["성별", "천이궁", "명궁", "관록궁", "재백궁", "도화성", "노복궁/형제궁"],
    directEvidenceLimit: 8,
    requiredTags: ["encounter_path", "charm_asset", "action_guide"],
    writingInstruction: "소개/모임/일/취미/온라인 같은 일반 채널 나열을 금지하고, 이성 비율이 높은 환경 + 사용자가 잘할 수 있는 역할 + 첫 행동으로 쓴다.",
  },
  {
    section: "5. 올해 인연 기회",
    primaryPalaces: ["유년", "유월 12개월", "대한", "천희/홍란", "도화성"],
    directEvidenceLimit: 12,
    requiredTags: ["timing_signal"],
    writingInstruction: "유월 데이터가 있으면 표가 아니라 올해운 아래 1월부터 12월까지 항목형 서술로 작성한다. 각 월은 중심 궁위, 주요 별, 호감/주의 신호, 예상 상황, 행동 힌트 중 최소 1개를 생활 언어로 녹인다.",
  },
  {
    section: "6. 지금 당장 해야 할 연애 준비",
    primaryPalaces: ["명궁", "부처궁/부부궁", "복덕궁", "천이궁", "재백궁"],
    directEvidenceLimit: 8,
    requiredTags: ["action_guide", "solo_blocker"],
    writingInstruction: "추상 조언을 금지하고 말투, 첫 대화, 스타일링, 기준 설정을 실행 행동으로 쓴다.",
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
