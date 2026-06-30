import type { ExtractedPalace, StarWithSiHua } from "@/lib/ziwei-extractor";

export type CharmRuleScope =
  | "major_star"
  | "lucky_star"
  | "star_combo"
  | "palace_star"
  | "sihua"
  | "malefic";

export type CharmAxis =
  | "latent_charm"
  | "felt_by_others"
  | "sexual_pull"
  | "weakening_moment"
  | "cultivation";

export interface CharmActionRule {
  id: string;
  scope: CharmRuleScope;
  palacePriority: Array<"children" | "life" | "spouse" | "fortune" | "migration">;
  stars: string[];
  charmAxis: CharmAxis;
  evidence: string;
  interpretation: string;
  actionGuide?: string;
  priority: number;
}

export interface MatchedCharmActionRule extends CharmActionRule {
  matchedPalace: string;
}

const majorRule = (star: string, interpretation: string, actionGuide: string): CharmActionRule => ({
  id: `major-${star}-cultivation`,
  scope: "major_star",
  palacePriority: ["children", "life"],
  stars: [star],
  charmAxis: "cultivation",
  evidence: `${star}은 실제 명반에 있는 주성의 성질을 매력 훈련으로 변환하는 근거입니다.`,
  interpretation,
  actionGuide,
  priority: 3,
});

export const LOVE_CHARM_ACTION_RULES: CharmActionRule[] = [
  majorRule("자미", "중심감과 품위가 매력으로 보입니다.", "말을 많이 하기보다 기준이 분명한 한 문장으로 의견을 정리하는 연습을 합니다."),
  majorRule("천기", "지적 호기심과 기획력이 매력으로 보입니다.", "상대의 말을 듣고 질문 1개와 정리 1개로 대화를 이어가는 훈련을 합니다."),
  majorRule("태양", "밝은 반응과 챙김이 매력으로 보입니다.", "상대의 장점을 구체적으로 칭찬하고 먼저 가볍게 반응을 여는 연습을 합니다."),
  majorRule("무곡", "책임감과 신뢰감이 매력으로 보입니다.", "약속 시간, 말한 내용, 작은 실행을 지키며 말보다 행동으로 안정감을 보여줍니다."),
  majorRule("천동", "편안함과 순한 분위기가 매력으로 보입니다.", "긴 설명보다 가벼운 농담과 편한 질문으로 대화의 압박을 낮추는 연습을 합니다."),
  majorRule("염정", "깔끔한 인상과 선명한 자기관리가 매력으로 보입니다.", "옷차림과 말투를 정돈하고, 관계 초반부터 과한 통제나 판단을 줄이는 연습을 합니다."),
  majorRule("천부", "포용력과 안정적인 관리감이 매력으로 보입니다.", "상대를 챙기되 대신 결정해주려 하지 말고, 선택지를 정리해주는 방식으로 안정감을 줍니다."),
  majorRule("태음", "감성, 낭만, 섬세한 배려가 매력으로 보입니다.", "음악, 사진, 공간 취향처럼 감각적 취향을 정리해 대화 소재로 자연스럽게 꺼냅니다."),
  majorRule("탐랑", "호기심, 다재다능함, 본능적 끌림이 매력으로 보입니다.", "새로운 경험과 대화 주제를 늘리되, 과한 자기중심적 어필은 줄이는 훈련을 합니다."),
  majorRule("거문", "말과 분석력, 깊이 파고드는 태도가 매력으로 보입니다.", "비판보다 질문으로 시작하고, 메시지를 보내기 전 날카로운 표현을 한 번 부드럽게 바꿉니다."),
  majorRule("천상", "배려와 조율 능력이 매력으로 보입니다.", "상대가 편해지는 선택지를 제안하고, 대화 중간에 상대의 입장을 한 번 요약해줍니다."),
  majorRule("천량", "성숙함과 보호감이 매력으로 보입니다.", "조언을 바로 하기보다 먼저 믿음을 표현하고, 잔소리처럼 들릴 수 있는 말을 줄입니다."),
  majorRule("칠살", "결단력과 강한 추진력이 매력으로 보입니다.", "호감이 생기면 다음 약속이나 행동을 명확히 제안하되, 상대의 속도 확인을 함께 합니다."),
  majorRule("파군", "새로움과 독창성이 매력으로 보입니다.", "뻔한 대화보다 새로운 장소나 경험을 제안하고, 급격한 변화 제안은 단계적으로 꺼냅니다."),
  {
    id: "wenchang-expression-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life"],
    stars: ["문창"],
    charmAxis: "cultivation",
    evidence: "문창은 표현력, 창조력, 자기어필, 센스가 있다.",
    interpretation: "말과 글에서 세련된 인상을 만들 수 있습니다.",
    actionGuide: "독서와 글쓰기로 어휘를 늘리되, 긴 설명보다 짧고 선명한 문장으로 표현하는 훈련을 합니다.",
    priority: 1,
  },
  {
    id: "wenqu-writing-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life"],
    stars: ["문곡"],
    charmAxis: "cultivation",
    evidence: "문곡은 글, 공부, 문장 감각을 보강하는 길성입니다.",
    interpretation: "감정 표현을 글로 정리할 때 매력이 선명해집니다.",
    actionGuide: "메시지나 프로필 문장을 바로 보내지 말고 한 번 줄여서 다듬는 습관을 만듭니다.",
    priority: 1,
  },
  {
    id: "zuofu-youbi-support-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life"],
    stars: ["좌보", "우필"],
    charmAxis: "cultivation",
    evidence: "좌보와 우필은 도움, 지지, 환경의 유리함을 뜻합니다.",
    interpretation: "혼자 튀기보다 함께 있을 때 신뢰와 호감이 살아납니다.",
    actionGuide: "모임에서 한 사람을 돕거나 흐름을 정리하는 역할을 맡아 자연스럽게 존재감을 만듭니다.",
    priority: 2,
  },
  {
    id: "tiankui-tianyue-noble-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life"],
    stars: ["천괴", "천월"],
    charmAxis: "cultivation",
    evidence: "천괴와 천월은 선택, 좋은 인연, 환경적 도움을 뜻합니다.",
    interpretation: "좋은 사람에게 발견되는 방식의 매력이 있습니다.",
    actionGuide: "무작정 넓히기보다 검증된 커뮤니티에서 소개자와 신뢰 관계를 먼저 만드는 편이 좋습니다.",
    priority: 2,
  },
  {
    id: "lucun-resource-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life"],
    stars: ["녹존", "록존"],
    charmAxis: "cultivation",
    evidence: "녹존은 안정된 자원과 복록을 뜻합니다.",
    interpretation: "현실적 안정감이 매력으로 전달됩니다.",
    actionGuide: "과시보다 일정, 비용, 약속을 안정적으로 관리하는 모습으로 신뢰를 보여줍니다.",
    priority: 2,
  },
  {
    id: "tianma-movement-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life", "migration"],
    stars: ["천마"],
    charmAxis: "cultivation",
    evidence: "천마는 이동과 활동성을 뜻합니다.",
    interpretation: "움직임이 있는 상황에서 매력이 살아납니다.",
    actionGuide: "앉아서 긴 대화를 하기보다 산책, 전시, 짧은 이동이 있는 만남을 제안합니다.",
    priority: 2,
  },
  {
    id: "ziwei-tanlang-combo",
    scope: "star_combo",
    palacePriority: ["children", "life"],
    stars: ["자미", "탐랑"],
    charmAxis: "sexual_pull",
    evidence: "자미탐랑 조합은 중심감과 욕망/도화가 함께 작동하는 조합입니다.",
    interpretation: "품위와 호기심이 동시에 보여 묘한 끌림을 만들 수 있습니다.",
    actionGuide: "고급스러운 기준은 유지하되, 상대가 접근할 여지를 남기는 가벼운 반응을 연습합니다.",
    priority: 1,
  },
  {
    id: "lianzhen-tanlang-combo",
    scope: "star_combo",
    palacePriority: ["children", "life"],
    stars: ["염정", "탐랑"],
    charmAxis: "sexual_pull",
    evidence: "염정과 탐랑은 도화성과 욕망의 성질이 강한 조합입니다.",
    interpretation: "깔끔한 자기관리와 호기심이 결합해 본능적 긴장감을 만듭니다.",
    actionGuide: "선명한 인상은 살리되, 초반부터 상대를 시험하거나 통제하려는 말은 줄입니다.",
    priority: 1,
  },
  {
    id: "malefic-weakening-moment",
    scope: "malefic",
    palacePriority: ["spouse", "fortune", "children", "life"],
    stars: ["화성", "영성", "경양", "타라"],
    charmAxis: "weakening_moment",
    evidence: "살성은 감정이 급해지거나 날카로워지는 리듬을 만들 수 있습니다.",
    interpretation: "매력이 급함, 예민함, 확인 욕구로 흐려질 수 있습니다.",
    actionGuide: "감정이 올라온 순간에는 고백이나 추궁보다 하루 뒤 짧은 문장으로 정리해 말합니다.",
    priority: 1,
  },
  {
    id: "huaji-weakening-moment",
    scope: "sihua",
    palacePriority: ["spouse", "fortune", "children", "life"],
    stars: ["화기"],
    charmAxis: "weakening_moment",
    evidence: "화기는 결핍, 확인 욕구, 집착이 생기는 영역입니다.",
    interpretation: "확인받고 싶은 마음이 강해질수록 매력이 압박으로 바뀔 수 있습니다.",
    actionGuide: "상대에게 바로 확인받기보다 내가 원하는 감정을 먼저 한 문장으로 적어봅니다.",
    priority: 1,
  },
];

const palaceLabels: Record<string, string> = {
  children: "자녀궁",
  life: "명궁",
  spouse: "부처궁",
  fortune: "복덕궁",
  migration: "천이궁",
};

const collectPalaceTerms = (palace?: ExtractedPalace | null): string[] => {
  if (!palace) return [];
  const stars = [
    ...(palace.majorStars || []),
    ...(palace.luckyStars || []),
    ...(palace.unluckyStars || []),
  ] as StarWithSiHua[];

  return stars.flatMap((star) => [star.name, star.sihua].filter(Boolean) as string[]);
};

export const matchCharmActionRules = (input: {
  childrenPalace?: ExtractedPalace | null;
  lifePalace?: ExtractedPalace | null;
  spousePalace?: ExtractedPalace | null;
  fortunePalace?: ExtractedPalace | null;
  migrationPalace?: ExtractedPalace | null;
}): MatchedCharmActionRule[] => {
  const palaceTerms: Record<string, string[]> = {
    children: collectPalaceTerms(input.childrenPalace),
    life: collectPalaceTerms(input.lifePalace),
    spouse: collectPalaceTerms(input.spousePalace),
    fortune: collectPalaceTerms(input.fortunePalace),
    migration: collectPalaceTerms(input.migrationPalace),
  };

  const matched: MatchedCharmActionRule[] = [];
  const seen = new Set<string>();

  for (const rule of [...LOVE_CHARM_ACTION_RULES].sort((a, b) => a.priority - b.priority)) {
    for (const palaceKey of rule.palacePriority) {
      const terms = palaceTerms[palaceKey] || [];
      const isMatched = rule.scope === "star_combo"
        ? rule.stars.every((star) => terms.includes(star))
        : rule.stars.some((star) => terms.includes(star));

      if (!isMatched) continue;
      const key = `${rule.id}:${palaceKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matched.push({ ...rule, matchedPalace: palaceLabels[palaceKey] || palaceKey });
      break;
    }
  }

  return matched.slice(0, 8);
};

export const formatCharmActionRules = (rules: MatchedCharmActionRule[]): string => {
  if (rules.length === 0) {
    return `[CHARM_ACTION_RULES]\n- 매칭된 자녀궁/명궁 기반 매력 룰 없음\n- 근거: 실제 자녀궁/명궁 별과 길성 조합을 추가 확인해야 합니다.\n- 행동: 매칭 룰이 없으면 보편 조언을 쓰지 말고, 사용자의 실제 명반 데이터에서 확인되는 표현 방식만 짧게 설명합니다.`;
  }

  return `
[CHARM_ACTION_RULES]
${rules.map((rule) => `- 매칭 궁: ${rule.matchedPalace}
  - 매칭 별/조합: ${rule.stars.join(", ")}
  - 축: ${rule.charmAxis === "cultivation" ? "매력을 기르는 방법" : rule.charmAxis}
  - 근거: ${rule.evidence}
  - 해석: ${rule.interpretation}
  - 행동: ${rule.actionGuide || "해당 매력의 좋은 작동 방식을 구체 행동으로 바꿔 서술합니다."}`).join("\n")}
`;
};
