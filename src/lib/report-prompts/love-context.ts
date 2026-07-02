import type { ExtractedPalace, StarWithSiHua } from "@/lib/ziwei-extractor";
import type { LoveKnowledgeBase, LovePalaceRole, LovePalaceSnapshot, LoveStarSignal } from "./types";

interface FormatLoveReportContextInput {
  lifePalace: ExtractedPalace | null | undefined;
  spousePalace: ExtractedPalace | null | undefined;
  fortunePalace: ExtractedPalace | null | undefined;
  childrenPalace: ExtractedPalace | null | undefined;
  migrationPalace: ExtractedPalace | null | undefined;
  careerPalace: ExtractedPalace | null | undefined;
  friendsPalace: ExtractedPalace | null | undefined;
  parentsPalace: ExtractedPalace | null | undefined;
  siblingsPalace: ExtractedPalace | null | undefined;
  liuNianLovePalaces: ExtractedPalace[];
  periodicPalacesInfo: string;
  knowledgeBase: LoveKnowledgeBase;
}

const SECTION_GUIDE = [
  {
    title: "1. 연애 한 줄 정의",
    data: "명궁, 부처궁, 복덕궁, 자녀궁",
    point: "연애에서의 기본 반응, 사랑에 빠졌을 때의 모습, 관계의 첫 인상, 가까워졌을 때의 분위기",
  },
  {
    title: "2. 내가 끌리는 사람 유형",
    data: "부처궁, 관록궁, 부처궁 삼방사정(복덕궁/천이궁/관록궁), 부처궁 14주성 해석, 도화성",
    point: "어떤 사랑의 결에 끌리는지, 편안한 관계와 끌리는 관계의 차이, 상대 타입",
  },
  {
    title: "3. 나의 매력 자산",
    data: "명궁, 자녀궁, 복덕궁, 천이궁, 도화성, 염정/천량/탐랑/파군/문곡/홍란",
    point: "첫인상 매력, 본능적 플러팅, 가까워질수록 드러나는 매력, 숨은 도화 자산",
  },
  {
    title: "4. 연애 관점으로 본 나의 문제",
    data: "부처궁 약함 기준, 화기, 살성, 복덕궁, 인간관계 분석, 부처궁 화성 자료",
    point: "감정 과몰입, 확인 욕구, 집착, 관계 리듬 문제, 외부 인연 꼬임, 반복되는 패턴",
  },
  {
    title: "5. 애정운",
    data: "부처궁, 소한, 유년, 홍란, 천희, 도화, 중첩궁(관록/노복/천이/부모·형제), 살성/화기",
    point: "올해 애정 흐름, 인연이 들어오는 시기와 환경, 관계가 꼬이는 신호",
  },
] as const;

const ROLE_MEANING: Record<LovePalaceRole, string> = {
  life: "기본 기질, 첫 반응, 첫인상, 관계에 들어가기 전의 디폴트 톤",
  spouse: "연애관, 감정 처리 방식, 끌리는 관계의 결, 관계에서 예민해지는 지점",
  fortune: "혼자 있을 때의 감정 습관, 정서 만족 기준, 불안/안정의 바탕",
  children: "가까워졌을 때 드러나는 본능적 매력, 플러팅, 친밀감과 감각적 분위기",
  migration: "밖에서 보이는 이미지, 대외 반응, 인연 유입 환경",
  career: "상대에게 기대하는 조건, 관계에 투영하는 기준, 현실 조건의 압력",
  friends: "친구·지인 네트워크, 소개 경로, 주변 관계 패턴",
  parents: "연장자·가족·선배 연결, 보호자적 인연 경로",
  siblings: "가까운 사람과 맺는 기본 습관, 친구 소개 경로",
  timing: "유년·소한·중첩궁 기반 올해 애정 흐름과 활성화 신호",
};

const SIHUA_MEANING: Record<string, Record<string, string>> = {
  화록: {
    default: "호감, 여유, 받아들이는 힘, 좋은 반응이 들어오는 지점",
    spouse: "정서적 보상과 편안한 반응을 원하고, 좋은 반응이 오면 마음이 열린다.",
    children: "가까워질수록 표현 매력과 감각적 호감이 쉽게 흐른다.",
    fortune: "혼자 있을 때도 감정 회복 자원이 있어 관계를 부드럽게 만든다.",
  },
  화권: {
    default: "주도권, 선명함, 자기 확신, 관계를 끌고 가려는 힘",
    spouse: "확실한 반응과 관계의 선명함을 원한다.",
    children: "친밀한 순간에 텐션, 존재감, 은근한 장악력이 강해진다.",
    career: "상대의 태도와 조건을 분명하게 확인하려 한다.",
  },
  화과: {
    default: "정돈됨, 품위, 예의, 말의 결, 깔끔한 인상",
    spouse: "예의, 명분, 깔끔한 소통을 통해 감정을 정리하려 한다.",
    children: "세련된 표현, 말의 결, 정돈된 분위기가 가까운 매력으로 드러난다.",
  },
  화기: {
    default: "결핍, 확인 욕구, 집착, 쉽게 놓지 못하는 관계 집중 포인트",
    life: "관계가 자존감 문제로 연결되기 쉽다.",
    spouse: "불확실성이 길어질수록 특정 반응을 계속 확인하고 싶어진다.",
    fortune: "혼자 있을 때 불안과 공허가 커져 관계에 기대기 쉽다.",
    children: "친밀해진 뒤 감정이 깊게 걸리고 매력 표현이 부담으로 뒤집힐 수 있다.",
  },
};

const STAR_SIGNAL_MEANING: Record<string, string> = {
  좌보: "상대를 받쳐주고 맞춰주는 협조성",
  우필: "부드럽게 조율하고 리듬을 맞추는 힘",
  문창: "정돈된 말투, 표현의 정확성, 지적인 인상",
  문곡: "감성적 표현, 말의 여운, 분위기 감각",
  천괴: "귀하게 보이는 인상과 도움을 끌어오는 흐름",
  천월: "단정함, 보호감, 좋은 타이밍의 인연 보조",
  녹존: "안정감, 오래 가는 신뢰, 머물고 싶은 감각",
  록존: "안정감, 오래 가는 신뢰, 머물고 싶은 감각",
  천마: "변화 욕구, 이동성, 활동적인 매력",
  화성: "빠른 감정 점화, 즉흥성, 강한 텐션",
  영성: "겉은 조용하지만 오래 타는 긴장감과 계산",
  경양: "단호함, 직진성, 선명한 거리 좁힘",
  타라: "망설임, 오래 붙잡는 힘, 긴 여운",
  지공: "묘한 거리감, 비어 있는 듯한 독특한 분위기",
  지겁: "극단적 몰입, 소모감, 강한 상실감",
  홍란: "인연 활성화, 감정 접점 증가, 호감이 붙는 신호",
  천희: "기쁜 만남, 관계 이벤트, 생활권 밖의 연결 신호",
};

const CHARM_MAJOR_STAR_MEANING: Record<string, string> = {
  염정: "정신적 카리스마, 자기 통제력, 깔끔하게 꾸미는 힘, 강한 존재감",
  염정성: "정신적 카리스마, 자기 통제력, 깔끔하게 꾸미는 힘, 강한 존재감",
  천량: "신뢰감, 보호자적 안정감, 여유와 무게감",
  천량성: "신뢰감, 보호자적 안정감, 여유와 무게감",
  탐랑: "욕망, 호기심, 다재다능함, 감각적 매력과 도화",
  탐랑성: "욕망, 호기심, 다재다능함, 감각적 매력과 도화",
  파군: "낭만, 대담함, 새로움, 예측 불가능한 반전 매력",
  파군성: "낭만, 대담함, 새로움, 예측 불가능한 반전 매력",
  문곡: "재주, 정서적 여운, 말과 분위기의 매력",
  문곡성: "재주, 정서적 여운, 말과 분위기의 매력",
  홍란: "인연 활성화, 감정 접점 증가, 호감이 붙는 흐름",
};

const PARTNER_MAJOR_STAR_MEANING: Record<string, string> = {
  천기: "새로운 유형, 대화와 변화가 있는 상대",
  천기성: "새로운 유형, 대화와 변화가 있는 상대",
  거문: "확실한 말과 진심 확인이 중요한 상대",
  거문성: "확실한 말과 진심 확인이 중요한 상대",
  무곡: "일·현실 감각이 강한 상대",
  무곡성: "일·현실 감각이 강한 상대",
  칠살: "직장·목표·승부욕이 강한 상대",
  칠살성: "직장·목표·승부욕이 강한 상대",
  천부: "업무 관련, 안정적이고 관리력이 있는 상대",
  천부성: "업무 관련, 안정적이고 관리력이 있는 상대",
  자미: "사회적 존재감이나 인맥이 있는 상대",
  자미성: "사회적 존재감이나 인맥이 있는 상대",
  탐랑: "인맥이 좋고 감각적 끌림이 강한 상대",
  탐랑성: "인맥이 좋고 감각적 끌림이 강한 상대",
  태양: "선배·오래 알던 사람·책임감 있는 상대",
  태양성: "선배·오래 알던 사람·책임감 있는 상대",
  천량: "선배·오래 알던 사람·보호감 있는 상대",
  천량성: "선배·오래 알던 사람·보호감 있는 상대",
  천동: "오래 알던 사람, 옛 인연, 편안한 상대",
  천동성: "오래 알던 사람, 옛 인연, 편안한 상대",
  태음: "가족 소개, 사적인 생활권, 부드러운 상대",
  태음성: "가족 소개, 사적인 생활권, 부드러운 상대",
};

const PALACE_PATH_MEANING: Record<string, string> = {
  관록궁: "직장·업무 관련 만남, 회식, 네트워킹, 프로젝트 접점",
  노복궁: "친구 소개, 지인 연결, 모임에서 이어지는 인연",
  천이궁: "외출, 여행, 클래스, 동호회, 생활권 밖 활동",
  부모궁: "연장자, 가족 지인, 선배가 이어주는 인연",
  형제궁: "친한 사람, 형제 같은 친구, 가까운 네트워크의 소개",
  복덕궁: "예술, 취미, 문화 활동, 혼자 좋아하는 영역에서 생기는 접점",
  재백궁: "고객, 거래, 사업 파트너, 돈이 오가는 현실 접점",
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

const collectStarSignals = (snapshot: LovePalaceSnapshot): LoveStarSignal[] => [
  ...snapshot.majorStars,
  ...snapshot.luckyStars,
  ...snapshot.unluckyStars,
];

const collectNames = (snapshot: LovePalaceSnapshot): string[] => (
  collectStarSignals(snapshot).flatMap((star) => star.sihua ? [star.name, star.sihua] : [star.name])
);

const formatSihuaSignals = (snapshot: LovePalaceSnapshot): string => {
  const signals = collectStarSignals(snapshot)
    .filter((star) => star.sihua)
    .map((star) => {
      const meaningMap = SIHUA_MEANING[star.sihua ?? ""];
      return `- ${star.name}[${star.sihua}]: ${meaningMap?.[snapshot.role] ?? meaningMap?.default ?? "관계에서 강조점이나 결핍 신호로 보조 해석"}`;
    });

  return signals.length > 0 ? signals.join("\n") : "- 강한 사화 신호 없음";
};

const formatAuxiliarySignals = (snapshot: LovePalaceSnapshot): string => {
  const lucky = snapshot.luckyStars.map((star) => `- ${star.name}: ${STAR_SIGNAL_MEANING[star.name] ?? "호감과 안정감을 보조하는 길성"}`);
  const unlucky = snapshot.unluckyStars.map((star) => `- ${star.name}: ${STAR_SIGNAL_MEANING[star.name] ?? "긴장과 과발현을 만드는 살성"}`);

  return [
    "[사화 신호]",
    formatSihuaSignals(snapshot),
    "[길성/도화 신호]",
    lucky.length > 0 ? lucky.join("\n") : "- 길성/도화 신호 없음",
    "[살성 신호]",
    unlucky.length > 0 ? unlucky.join("\n") : "- 살성 신호 없음",
  ].join("\n");
};

const formatPalaceBlock = (snapshot: LovePalaceSnapshot): string => `
[${snapshot.label}]
- 역할: ${ROLE_MEANING[snapshot.role]}
- 주성: ${formatStarList(snapshot.majorStars)}
- 길성/도화: ${formatStarList(snapshot.luckyStars)}
- 살성: ${formatStarList(snapshot.unluckyStars)}
- 차성안궁: ${snapshot.borrowed ? "예" : "아니오"}
${formatAuxiliarySignals(snapshot)}
`;

const countUnluckyStars = (snapshots: LovePalaceSnapshot[]): number => (
  snapshots.reduce((total, snapshot) => total + snapshot.unluckyStars.length, 0)
);

const hasPair = (snapshots: LovePalaceSnapshot[], pair: [string, string]): boolean => {
  const names = new Set(snapshots.flatMap((snapshot) => snapshot.unluckyStars.map((star) => star.name)));
  return pair.every((name) => names.has(name));
};

const hasHwagie = (snapshots: LovePalaceSnapshot[]): boolean => (
  snapshots.some((snapshot) => collectStarSignals(snapshot).some((star) => star.sihua === "화기"))
);

const formatProblemSignals = (spouseTriad: LovePalaceSnapshot[]): string => {
  const unluckyCount = countUnluckyStars(spouseTriad);
  const pairs = [
    hasPair(spouseTriad, ["화성", "영성"]) ? "화성-영성" : null,
    hasPair(spouseTriad, ["경양", "타라"]) ? "경양-타라" : null,
  ].filter(Boolean).join(", ") || "없음";

  return `
[LOVE_PROBLEM_SIGNALS]
- 부처궁 삼방사정 살성 수: ${unluckyCount}개
- 짝성 조합: ${pairs}
- 화기 존재: ${hasHwagie(spouseTriad) ? "있음" : "없음"}
- 해석 규칙: 살성 1~2개나 화기 1개만으로 문제라고 단정하지 말고, 살성 4개 이상·짝성 조합·화기 중첩일 때 관계 유지 난도와 반복 패턴을 강하게 본다.
- 번역 방향: 감정 과몰입, 확인 욕구, 집착, 관계 리듬 문제, 외부 인연 꼬임, 반복되는 패턴으로 풀어쓴다.
`;
};

const formatSpecialStarEvidence = (snapshots: LovePalaceSnapshot[], meaningMap: Record<string, string>): string => {
  const entries = snapshots.flatMap((snapshot) => (
    collectStarSignals(snapshot)
      .map((star) => {
        const meaning = meaningMap[star.name];
        return meaning ? `- ${snapshot.label} ${star.name}: ${meaning}` : null;
      })
      .filter((entry): entry is string => Boolean(entry))
  ));

  return entries.length > 0 ? entries.join("\n") : "- 해당 특화 별 신호 없음";
};

const formatPathHints = (snapshots: LovePalaceSnapshot[]): string => {
  const entries = snapshots
    .filter((snapshot) => PALACE_PATH_MEANING[snapshot.label])
    .map((snapshot) => `- ${snapshot.label}: ${PALACE_PATH_MEANING[snapshot.label]} / 현재 별: ${formatStarList([...snapshot.majorStars, ...snapshot.luckyStars, ...snapshot.unluckyStars])}`);

  return entries.length > 0 ? entries.join("\n") : "- 중첩궁 경로 후보 없음";
};

const formatKnowledgeEvidence = (knowledgeBase: LoveKnowledgeBase, starNames: string[]): string => {
  const entries = Array.from(new Set(starNames))
    .map((starName) => {
      const entry = knowledgeBase[starName];
      if (!entry) return null;
      return `- ${starName}: ${entry.love_insight || entry.core_trait || "연애 근거 없음"}`;
    })
    .filter((entry): entry is string => Boolean(entry));

  return entries.length > 0 ? entries.join("\n") : "- 매칭된 별 지식베이스 없음";
};

const formatStrategyContract = (): string => `
[LOVE_DATA_STRATEGY]
1. 유저 명반 데이터 추출: orders.saju_data.extracted_stars에서 12궁을 읽고, 명궁/부처궁/복덕궁/자녀궁/천이궁/관록궁/노복궁/부모궁/형제궁을 연애 테마 축으로 분리한다.
2. 참고 데이터 정규화: 각 궁의 주성·길성·살성·사화를 palace snapshot으로 압축하고, 부처궁 삼방사정·도화/매력 별·화기/살성·유년 흐름을 별도 패킷으로 만든다.
3. AI 전달: 시스템 프롬프트는 5개 섹션 출력 계약만 통제하고, 실제 해석 근거는 이 user context의 [SECTION_REFERENCE_GUIDE], [LOVE_PALACE_DATA], [LOVE_PROBLEM_SIGNALS], [LOVE_TIMING_DATA]를 우선 사용한다.
4. 최종 번역: 자미두수 용어는 근거용으로만 사용하고, 최종 리포트는 관계 심리·첫인상·끌림·반복 패턴·올해 흐름 언어로 변환한다.
`;

export const formatLoveReportContext = (input: FormatLoveReportContextInput): string => {
  const snapshots = [
    toSnapshot("명궁", "life", input.lifePalace),
    toSnapshot("부처궁", "spouse", input.spousePalace),
    toSnapshot("복덕궁", "fortune", input.fortunePalace),
    toSnapshot("자녀궁", "children", input.childrenPalace),
    toSnapshot("천이궁", "migration", input.migrationPalace),
    toSnapshot("관록궁", "career", input.careerPalace),
    toSnapshot("노복궁", "friends", input.friendsPalace),
    toSnapshot("부모궁", "parents", input.parentsPalace),
    toSnapshot("형제궁", "siblings", input.siblingsPalace),
  ];
  const spouseTriad = [
    snapshots[1],
    snapshots[2],
    snapshots[4],
    snapshots[5],
  ];
  const timingSnapshots = input.liuNianLovePalaces.map((palace) => toSnapshot(`${palace.name} 유년/대한`, "timing", palace));
  const allSnapshots = [...snapshots, ...timingSnapshots];
  const starNames = allSnapshots.flatMap(collectNames);

  return `
선택한 테마: love
${formatStrategyContract()}
[LOVE_REPORT_DATA_RULE]
- 아래 데이터는 새 연애 테마 기획 기준으로 재생성한 정규화 데이터다.
- 추천 우선순위는 부처궁 → 자녀궁 → 복덕궁 → 명궁 → 천이궁 → 관록궁 → 도화/화기/살성 → 소한/유년/중첩궁 순서다.
- 섹션별 참고 데이터는 고정 공식이 아니라 우선순위다. 실제 명반에서 더 강한 신호가 있으면 그 신호를 우선한다.
- 주성만 보지 말고 사화·길성·살성이 만드는 감정 속도, 끌림, 과발현을 함께 해석한다.
- 최종 출력에는 별 이름과 궁 이름을 직접 노출하지 말고 생활 언어로 번역한다.

[SECTION_REFERENCE_GUIDE]
${SECTION_GUIDE.map((section) => `- ${section.title}\n  - AI가 참고할 데이터: ${section.data}\n  - 해석 포인트: ${section.point}`).join("\n")}

[LOVE_PALACE_DATA]
${snapshots.map(formatPalaceBlock).join("\n")}

[SPOUSE_TRIAD_STRUCTURE]
- 부처궁 중심: ${formatStarList([...snapshots[1].majorStars, ...snapshots[1].luckyStars, ...snapshots[1].unluckyStars])}
- 삼방사정 보조축: 복덕궁(정서 습관), 천이궁(외부 접점), 관록궁(상대 조건)
- 편안한 관계와 끌리는 관계가 다르면 부처궁과 관록궁의 차이로 설명한다.

[PARTNER_TYPE_REFERENCE]
${formatSpecialStarEvidence([snapshots[1], snapshots[5], ...spouseTriad], PARTNER_MAJOR_STAR_MEANING)}

[CHARM_ASSET_REFERENCE]
${formatSpecialStarEvidence([snapshots[0], snapshots[2], snapshots[3], snapshots[4]], CHARM_MAJOR_STAR_MEANING)}

${formatProblemSignals(spouseTriad)}
[ENCOUNTER_PATH_REFERENCE]
${formatPathHints([snapshots[2], snapshots[4], snapshots[5], snapshots[6], snapshots[7], snapshots[8]])}

[LOVE_TIMING_DATA]
- 유년/대한 연애 관련 궁 데이터:
${timingSnapshots.length > 0 ? timingSnapshots.map(formatPalaceBlock).join("\n") : "- 별도 유년/대한 연애 궁 데이터 없음"}
- 10년 흐름 원문:
${input.periodicPalacesInfo || "- 별도 10년 흐름 데이터 없음"}
- 해석 규칙: 애정운은 예언이 아니라 올해 어떤 감정 주제가 활성화되고, 어떤 환경에서 인연 접점이 늘어나며, 어떤 신호에서 관계가 꼬이는지로 쓴다.

[LOVE_STAR_EVIDENCE]
${formatKnowledgeEvidence(input.knowledgeBase, starNames)}
`;
};
