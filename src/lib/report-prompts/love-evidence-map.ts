export interface LoveGuidePacketInput {
  gender: string;
  lifePalace: string;
  shenGong: string;
  spousePalace: string;
  fortunePalace: string;
  childrenPalace: string;
  migrationPalace: string;
  networkPalace: string;
  parentsPalace: string;
  loveTags: string;
  monthlyFlow: string;
  taggedEvidence: string;
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

const describeGenderPerspective = (gender: string): string => {
  if (gender === "M") {
    return "남성 리포트: 여성이 체감하는 매력과 관계 반응으로 번역한다.";
  }

  if (gender === "F") {
    return "여성 리포트: 남성이 체감하는 매력과 관계 반응으로 번역한다.";
  }

  return "성별 데이터가 불명확하면 상대 이성이 체감하는 매력과 관계 반응으로 번역한다.";
};

export const formatLoveGuidePackets = (input: LoveGuidePacketInput): string => `
[GUIDE_TRANSLATION_PACKET]
- 목적: docs/love-reading-interpretation-guide.md의 섹션 구조를 그대로 번역한 중간 패킷이다.
- 사용 규칙: 아래 패킷은 조언 생성용이 아니라 자기이해형 해석 근거다.
- 금지: 가이드에 없는 섹션을 새로 만들지 않는다. 3번 섹션이 아니라 1, 2-1~2-4, 4만 사용한다.

[1. 나의 기본 성향과 인간관계]
- 핵심 근거: 명궁 + 복덕궁 + 천이궁 + 부처궁
- 명궁: ${input.lifePalace}
- 복덕궁: ${input.fortunePalace}
- 천이궁: ${input.migrationPalace}
- 부처궁/부부궁: ${input.spousePalace}
- 번역 방향: 타고난 첫 반응, 혼자 있을 때의 감정 습관, 밖에서 보이는 인상, 관계에서 원하는 방식을 생활 언어로 설명한다.

[2-1. 분위기와 첫인상 매력]
- 핵심 근거: 명궁 + 천이궁
- 명궁: ${input.lifePalace}
- 천이궁: ${input.migrationPalace}
- 연애 태그: ${input.loveTags}
- 번역 방향: 처음 만났을 때 보이는 표정, 시선, 말의 첫 온도, 거리감 같은 첫인상 매력을 묘사한다.

[2-2. 정서적 매력 — 잠재력과 기르는 법]
- 핵심 근거: 복덕궁 + 부처궁
- 복덕궁: ${input.fortunePalace}
- 부처궁/부부궁: ${input.spousePalace}
- 성별 시선: ${describeGenderPerspective(input.gender)}
- 번역 방향: 가까워질수록 드러나는 정서적 안정감, 감정 반응 방식, 상대가 느끼는 편안함과 거리감을 설명한다.

[2-3. 외적 매력 — 잠재력과 기르는 법]
- 핵심 근거: 자녀궁 + 명궁
- 자녀궁/자식궁: ${input.childrenPalace}
- 명궁: ${input.lifePalace}
- 성별 시선: ${describeGenderPerspective(input.gender)}
- 번역 방향: 이성에게 비춰지는 표현, 몸의 사용, 분위기, 성적 에너지의 방향을 구체적으로 묘사한다.

[2-4. 이성과 만날 때 매력 활용 스토리]
- 핵심 근거: 2-1~2-3 + 인연 유입 경로
- 인연 유입 근거: ${input.migrationPalace} / ${input.networkPalace} / ${input.parentsPalace} / ${input.shenGong}
- 번역 방향: 어떤 만남 자리에서 어떤 매력이 더 잘 보이는지, 실제 장면 하나로 이어서 서술한다.

[4. 인연이 들어오기 쉬운 방식]
- 핵심 근거: 천이궁 + 노복궁/형제궁 + 부모궁 + 신궁 + 유년 흐름
- 천이궁: ${input.migrationPalace}
- 노복궁/형제궁: ${input.networkPalace}
- 부모궁: ${input.parentsPalace}
- 신궁: ${input.shenGong}
- 번역 방향: 막연한 행동 처방이 아니라, 어떤 공간/관계 맥락/만남 방식에서 인연이 들어오고 관계가 편해지는지 설명한다.

[MONTHLY_LIUYUE_FLOW]
- 작성 범위: 올해 관계 흐름은 예언이 아니라 감정이 활성화되는 흐름으로만 설명한다.
${input.monthlyFlow || "- 유월 데이터 없음"}

[섹션 보강 근거]
- 태그별 보강 근거는 섹션 1~4의 설명을 보강하는 원자료로만 사용한다.
${input.taggedEvidence || "태그별 보강 근거 없음"}
`;

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
  - 흐름 단서: ${item.actionHint}`).join("\n")}
`;
};
