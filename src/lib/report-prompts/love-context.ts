import type { ExtractedPalace, StarWithSiHua } from "@/lib/ziwei-extractor";
import type { LoveKnowledgeBase, LovePalaceRole, LovePalaceSnapshot, LoveStarSignal } from "./types";

interface FormatLoveReportContextInput {
  lifePalace: ExtractedPalace | null | undefined;
  spousePalace: ExtractedPalace | null | undefined;
  childrenPalace: ExtractedPalace | null | undefined;
  knowledgeBase: LoveKnowledgeBase;
}

const SECTION_GUIDE = [
  "1. 좋아하면 내가 달라지는 방식 → 우선 참고: 명궁, 부처궁 / 보조: 사화, 살성",
  "2. 나는 어떤 사랑에 약한가 → 우선 참고: 부처궁 / 보조: 명궁, 길성, 살성, 사화",
  "3. 관계에서 은근히 기대하는 것 → 우선 참고: 부처궁, 명궁 / 보조: 사화, 길성",
  "4. 나도 모르게 사람을 홀리는 방식 → 우선 참고: 자녀궁 / 보조: 명궁, 길성, 살성, 사화",
  "5. 친해질수록 진짜 매력이 나오는 지점 → 우선 참고: 자녀궁, 명궁 / 보조: 길성, 사화",
  "6. 가까워질수록 조심해야 하는 내 그림자 → 우선 참고: 명궁, 부처궁, 자녀궁 / 보조: 살성, 화기, 강한 사화",
] as const;

const ROLE_MEANING: Record<LovePalaceRole, string> = {
  life: "기본 성향, 첫 반응, 기본 인상, 관계에 들어가기 전의 디폴트 기질",
  spouse: "사랑에 빠졌을 때의 감정 반응, 끌리는 사랑의 결, 관계 기대치, 예민해지는 포인트",
  children: "본능적 매력, 플러팅 방식, 가까워질수록 드러나는 친밀감, 육체적·감각적 분위기",
};

const SIHUA_MEANING: Record<string, Record<LovePalaceRole, string>> = {
  화록: {
    life: "호감·여유·받아들이는 힘이 기본 인상에 붙는다.",
    spouse: "정서적 보상과 편안한 반응을 원하고, 좋은 반응이 오면 마음이 열린다.",
    children: "가까워질수록 표현 매력과 감각적 호감이 쉽게 흐른다.",
  },
  화권: {
    life: "주도권과 자기 확신이 기본 태도에 붙는다.",
    spouse: "확실한 반응과 관계의 선명함을 원한다.",
    children: "친밀한 순간에 텐션, 존재감, 은근한 장악력이 강해진다.",
  },
  화과: {
    life: "정돈됨, 품위, 이성적 매력이 첫인상에 붙는다.",
    spouse: "예의, 명분, 깔끔한 소통을 통해 감정을 정리하려 한다.",
    children: "세련된 표현, 말의 결, 정돈된 분위기가 가까운 매력으로 드러난다.",
  },
  화기: {
    life: "결핍감과 확인 욕구가 관계 속 자존감 문제로 연결되기 쉽다.",
    spouse: "불확실성이 길어질수록 특정 반응을 계속 확인하고 싶어진다.",
    children: "친밀해진 뒤 감정이 깊게 걸리고 매력 표현이 부담으로 뒤집힐 수 있다.",
  },
};

const LUCKY_MEANING: Record<string, string> = {
  좌보: "상대를 받쳐주고 맞춰주는 협조성",
  우필: "부드럽게 조율하고 리듬을 맞추는 힘",
  문창: "정돈된 말투, 표현의 정확성, 지적인 인상",
  문곡: "감성적 표현, 말의 여운, 분위기 감각",
  천괴: "귀하게 보이는 인상과 도움을 끌어오는 흐름",
  천월: "단정함, 보호감, 좋은 타이밍의 인연 보조",
  녹존: "안정감, 오래 가는 신뢰, 머물고 싶은 감각",
  록존: "안정감, 오래 가는 신뢰, 머물고 싶은 감각",
  천마: "변화 욕구, 이동성, 활동적인 매력",
};

const UNLUCKY_MEANING: Record<string, string> = {
  화성: "빠른 감정 점화, 즉흥성, 강한 텐션",
  영성: "겉은 조용하지만 오래 타는 긴장감과 계산",
  경양: "단호함, 직진성, 선명한 거리 좁힘",
  타라: "망설임, 오래 붙잡는 힘, 긴 여운",
  지공: "묘한 거리감, 비어 있는 듯한 독특한 분위기",
  지겁: "극단적 몰입, 소모감, 강한 상실감",
};

const normalizeStars = (stars: StarWithSiHua[] = []): LoveStarSignal[] => (
  stars.map((star) => ({ name: star.name, sihua: star.sihua ?? null }))
);

const toSnapshot = (label: string, role: LovePalaceRole, palace?: ExtractedPalace | null): LovePalaceSnapshot => ({
  label,
  role,
  majorStars: normalizeStars(palace?.majorStars),
  luckyStars: normalizeStars(palace?.luckyStars),
  unluckyStars: normalizeStars(palace?.unluckyStars),
  borrowed: palace?.borrowed,
});

const formatStarList = (stars: LoveStarSignal[]): string => {
  if (stars.length === 0) return "없음";
  return stars.map((star) => `${star.name}${star.sihua ? `[${star.sihua}]` : ""}`).join(", ");
};

const collectNames = (snapshot: LovePalaceSnapshot): string[] => [
  ...snapshot.majorStars,
  ...snapshot.luckyStars,
  ...snapshot.unluckyStars,
].flatMap((star) => star.sihua ? [star.name, star.sihua] : [star.name]);

const formatSihuaSignals = (snapshot: LovePalaceSnapshot): string => {
  const signals = [...snapshot.majorStars, ...snapshot.luckyStars, ...snapshot.unluckyStars]
    .filter((star) => star.sihua)
    .map((star) => `- ${star.name}[${star.sihua}]: ${SIHUA_MEANING[star.sihua ?? ""]?.[snapshot.role] ?? "관계에서 강조점이나 결핍 신호로 보조 해석"}`);

  return signals.length > 0 ? signals.join("\n") : "- 강한 사화 신호 없음";
};

const formatAuxiliarySignals = (snapshot: LovePalaceSnapshot): string => {
  const lucky = snapshot.luckyStars.map((star) => `- ${star.name}: ${LUCKY_MEANING[star.name] ?? "호감과 안정감을 보조하는 길성"}`);
  const unlucky = snapshot.unluckyStars.map((star) => `- ${star.name}: ${UNLUCKY_MEANING[star.name] ?? "긴장과 과발현을 만드는 살성"}`);

  return [
    "[사화 신호]",
    formatSihuaSignals(snapshot),
    "[길성 신호]",
    lucky.length > 0 ? lucky.join("\n") : "- 길성 신호 없음",
    "[살성 신호]",
    unlucky.length > 0 ? unlucky.join("\n") : "- 살성 신호 없음",
  ].join("\n");
};

const formatPalaceBlock = (snapshot: LovePalaceSnapshot): string => `
[${snapshot.label}]
- 역할: ${ROLE_MEANING[snapshot.role]}
- 주성: ${formatStarList(snapshot.majorStars)}
- 길성: ${formatStarList(snapshot.luckyStars)}
- 살성: ${formatStarList(snapshot.unluckyStars)}
- 차성안궁: ${snapshot.borrowed ? "예" : "아니오"}
${formatAuxiliarySignals(snapshot)}
`;

const formatKnowledgeEvidence = (knowledgeBase: LoveKnowledgeBase, starNames: string[]): string => {
  const entries = Array.from(new Set(starNames))
    .map((starName) => {
      const entry = knowledgeBase[starName];
      if (!entry) return null;
      return `- ${starName}: ${entry.love_insight || entry.core_trait || "연애 근거 없음"}`;
    })
    .filter(Boolean);

  return entries.length > 0 ? entries.join("\n") : "- 매칭된 별 지식베이스 없음";
};

export const formatLoveReportContext = (input: FormatLoveReportContextInput): string => {
  const snapshots = [
    toSnapshot("명궁", "life", input.lifePalace),
    toSnapshot("부처궁", "spouse", input.spousePalace),
    toSnapshot("자녀궁", "children", input.childrenPalace),
  ];
  const starNames = snapshots.flatMap(collectNames);

  return `
선택한 테마: love

[LOVE_REPORT_DATA_RULE]
- 아래 데이터는 연애테마 전용 정규화 데이터다.
- 섹션별 참고 데이터는 가이드이며, 실제 명반에서 더 강한 신호가 있으면 그 신호를 우선한다.
- 주성만 보지 말고 사화·길성·살성이 만드는 감정 속도, 끌림, 과발현을 함께 해석한다.
- 자미두수 용어는 최종 출력에 직접 노출하지 말고 관계 언어로 번역한다.

[SECTION_REFERENCE_GUIDE]
${SECTION_GUIDE.map((line) => `- ${line}`).join("\n")}

[LOVE_PALACE_DATA]
${snapshots.map(formatPalaceBlock).join("\n")}

[LOVE_STAR_EVIDENCE]
${formatKnowledgeEvidence(input.knowledgeBase, starNames)}
`;
};
