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

export type CharmEvidenceKind = "physical" | "atmosphere" | "dohwa" | "cultivation" | "caution";

export interface CharmActionRule {
  id: string;
  scope: CharmRuleScope;
  palacePriority: Array<"children" | "life" | "spouse" | "fortune" | "migration">;
  stars: string[];
  charmAxis: CharmAxis;
  evidence: string;
  interpretation: string;
  actionGuide?: string;
  physicalCharm?: string[];
  atmosphereCharm?: string[];
  sexualPullSource?: string[];
  cultivationHints?: string[];
  evidenceKind?: CharmEvidenceKind;
  priority: number;
}

export interface MatchedCharmActionRule extends CharmActionRule {
  matchedPalace: string;
}

const cultivationRule = (
  star: string,
  interpretation: string,
  cultivationHints: string[],
): CharmActionRule => ({
  id: `major-${star}-cultivation`,
  scope: "major_star",
  palacePriority: ["children", "life"],
  stars: [star],
  charmAxis: "cultivation",
  evidenceKind: "cultivation",
  evidence: `${star}은 실제 명반에 있는 주성의 성질을 매력 훈련으로 변환하는 근거입니다.`,
  interpretation,
  cultivationHints,
  priority: 5,
});

export const LOVE_CHARM_ACTION_RULES: CharmActionRule[] = [
  {
    id: "ziwei-balanced-dignity",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["자미"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["기품 있는 외모", "균형 잡힌 체격", "좋은 피부", "맑은 눈"],
    atmosphereCharm: ["품위", "중심감", "쉽게 흐트러지지 않는 분위기"],
    sexualPullSource: ["정돈된 실루엣", "기준이 분명해 보이는 태도"],
    evidence: "자미성은 기품 있는 외모, 균형 잡힌 체격, 좋은 피부, 맑은 눈의 특징으로 설명됩니다.",
    interpretation: "과하게 드러내기보다 몸의 균형과 태도의 품위가 가까운 거리에서 매력으로 남습니다.",
    priority: 1,
  },
  {
    id: "tianfu-elegant-presence",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["천부"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["기품 있는 외모", "화려하고 우아한 인상", "넓은 이마와 턱선"],
    atmosphereCharm: ["우아함", "안정감", "관리된 분위기"],
    sexualPullSource: ["차분하게 관리된 몸의 분위기", "고급스럽게 정돈된 인상"],
    evidence: "천부성은 기품 있는 외모와 화려하고 우아한 외모로 설명됩니다.",
    interpretation: "튀는 매력보다 안정적으로 정돈된 분위기와 우아한 인상이 끌림을 만듭니다.",
    priority: 1,
  },
  {
    id: "tianji-clear-slim-line",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["천기"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["높은 이마", "뾰족한 턱", "날씬한 체형", "하얗고 맑은 피부"],
    atmosphereCharm: ["지적인 인상", "가볍고 민첩한 분위기"],
    sexualPullSource: ["날렵한 선", "맑고 정리된 얼굴 분위기"],
    evidence: "천기성은 이마가 높고 턱이 뾰족하며, 날씬한 체형과 하얗고 맑은 피부로 설명됩니다.",
    interpretation: "강한 압박감보다 지적이고 날렵한 선이 가까워질수록 선명하게 보입니다.",
    priority: 1,
  },
  {
    id: "tianliang-mature-bone-frame",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["천량"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["큰 키", "굵은 뼈대", "성숙한 인상"],
    atmosphereCharm: ["어른스러운 분위기", "보호감", "차분한 무게감"],
    sexualPullSource: ["성숙한 체격감", "쉽게 흔들리지 않는 몸의 존재감"],
    evidence: "천량성은 키가 크고 뼈가 굵은 특징으로 설명됩니다.",
    interpretation: "가볍게 눈에 띄기보다 성숙한 체격감과 차분한 무게감이 끌림으로 작동합니다.",
    priority: 1,
  },
  {
    id: "tiantong-soft-face-lips",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["천동"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["붉은 입술", "하얀 치아", "좋은 피부", "동안 인상", "동그란 눈"],
    atmosphereCharm: ["부드러운 얼굴 분위기", "순한 인상", "편하게 다가오게 하는 느낌"],
    sexualPullSource: ["가까이 있을 때 남는 입가와 피부의 부드러움"],
    evidence: "천동성은 입술이 붉고 치아가 하얗고 피부가 좋으며, 젊어 보이고 동그란 눈의 인상으로 설명됩니다.",
    interpretation: "가까운 거리에서 입가와 피부의 부드러운 인상이 먼저 남는 타입입니다.",
    priority: 1,
  },
  {
    id: "taiyang-bright-eye-upper-body",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["태양"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["큰 눈", "하얀 피부", "큰 키", "큰 뼈대", "발달한 상체"],
    atmosphereCharm: ["밝은 얼굴", "건강한 활력", "열린 표정"],
    sexualPullSource: ["상체의 건강한 느낌", "크고 밝은 눈이 주는 개방감"],
    evidence: "태양성은 큰 눈, 하얀 피부, 큰 키와 뼈대, 발달한 상체의 특징으로 설명됩니다.",
    interpretation: "밝은 얼굴과 건강해 보이는 상체의 활력이 이성에게 먼저 각인됩니다.",
    priority: 1,
  },
  {
    id: "taiyin-soft-curve-silhouette",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["태음"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["여성스럽고 예쁜 외모", "엉덩이", "부드러운 곡선", "하체 실루엣"],
    atmosphereCharm: ["은근함", "섬세함", "조용한 감성"],
    sexualPullSource: ["몸의 곡선이 부드럽게 남는 인상", "은근하게 시선이 머무는 분위기"],
    evidence: "태음성은 여성스럽고 예쁜 외모와 엉덩이 특징으로 설명됩니다.",
    interpretation: "노골적인 표현보다 부드러운 곡선과 은근한 분위기가 가까워질수록 매력으로 살아납니다.",
    priority: 1,
  },
  {
    id: "tianxiang-long-model-line",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["천상"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["모델처럼 길쭉한 체형", "긴 실루엣", "단정한 자세"],
    atmosphereCharm: ["정돈됨", "조율된 분위기", "깔끔한 인상"],
    sexualPullSource: ["길게 떨어지는 실루엣", "자세에서 나오는 단정한 긴장감"],
    evidence: "천상성은 모델처럼 길쭉한 체형으로 설명됩니다.",
    interpretation: "길고 단정한 실루엣과 자세가 관계 초반의 시각적 매력으로 작동합니다.",
    priority: 1,
  },
  {
    id: "qisha-sharp-nose-cold-beauty",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["칠살"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["높은 코", "날카로운 외모", "보조개", "좁은 어깨"],
    atmosphereCharm: ["차갑고 강한 인상", "독립적 분위기", "접근하기 어려운 긴장감"],
    sexualPullSource: ["날카로운 얼굴선", "차갑게 선명한 첫인상"],
    evidence: "칠살성은 코가 높고 날카로운 외모, 보조개와 좁은 어깨의 특징으로 설명됩니다.",
    interpretation: "부드럽게 풀어지는 매력보다 차갑고 선명한 인상이 강한 끌림을 만듭니다.",
    priority: 1,
  },
  {
    id: "pojun-beauty-round-eyes-change",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["파군"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["미남미녀형 외모", "크고 동그란 눈", "수려한 인상"],
    atmosphereCharm: ["자유로운 분위기", "낭만", "변화감", "예측 불가능함"],
    sexualPullSource: ["눈이 먼저 남는 인상", "자유롭고 변화감 있는 분위기"],
    evidence: "파군성은 미남미녀를 상징하고 눈이 크고 동그란 특징으로 설명됩니다.",
    interpretation: "정해진 틀보다 자유롭고 변화감 있는 분위기가 눈의 인상과 함께 끌림을 만듭니다.",
    priority: 1,
  },
  {
    id: "tanlang-lips-dohwa-desire",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["탐랑"],
    charmAxis: "sexual_pull",
    evidenceKind: "dohwa",
    physicalCharm: ["두꺼운 입술", "벌어진 눈", "건강한 피부", "귀여운 인상", "몸의 털"],
    atmosphereCharm: ["도화", "욕망", "친근한 거리감", "경험하고 싶게 만드는 분위기"],
    sexualPullSource: ["입술과 거리감 없는 태도", "본능적으로 가까워지고 싶게 하는 분위기"],
    evidence: "탐랑성은 욕망과 욕구, 도화의 성질이 강하며 두꺼운 입술, 벌어진 눈, 건강한 피부, 귀여운 인상으로 설명됩니다.",
    interpretation: "외모 하나보다 입술과 거리감 없는 친근함이 합쳐져 본능적인 호기심을 만듭니다.",
    priority: 1,
  },
  {
    id: "jumen-jaw-mouth-line",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["거문"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["넓은 턱", "입매", "말할 때 드러나는 얼굴선"],
    atmosphereCharm: ["깊이 파고드는 말", "어둡고 진중한 분위기"],
    sexualPullSource: ["말할 때 남는 입매와 턱선", "쉽게 가볍지 않은 분위기"],
    evidence: "거문성은 턱이 넓은 특징과 말/표현의 성질로 설명됩니다.",
    interpretation: "화려한 외모보다 말할 때 드러나는 입매와 진중한 분위기가 매력으로 남습니다.",
    priority: 1,
  },
  {
    id: "lianzhen-magnetic-exotic-atmosphere",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["염정"],
    charmAxis: "sexual_pull",
    evidenceKind: "atmosphere",
    physicalCharm: ["턱뼈", "하얀 피부", "이국적 외모", "미남미녀형 인상"],
    atmosphereCharm: ["차도화", "정신적 도화", "자기장", "카리스마", "영향력"],
    sexualPullSource: ["단정함 안에 압축된 긴장감", "쉽게 벗어나기 어려운 분위기"],
    evidence: "염정성은 차도화, 정신적 도화, 자기장과 영향력, 턱뼈와 하얀 피부, 이국적 외모로 설명됩니다.",
    interpretation: "노골적으로 드러내지 않아도 사람을 붙잡아두는 자기장과 이국적 분위기가 생깁니다.",
    priority: 1,
  },
  {
    id: "wugok-strong-gaze-bone",
    scope: "major_star",
    palacePriority: ["children", "life"],
    stars: ["무곡"],
    charmAxis: "sexual_pull",
    evidenceKind: "physical",
    physicalCharm: ["강렬한 눈빛", "굵은 뼈대", "높은 광대뼈", "단단한 인상"],
    atmosphereCharm: ["흔들리지 않는 시선", "현실적이고 강한 분위기"],
    sexualPullSource: ["눈빛과 골격의 단단함", "몸의 선이 정돈되어 보이는 느낌"],
    evidence: "무곡성은 뼈대가 굵고 광대뼈가 높으며 눈빛이 강렬하고 단단한 인상으로 설명됩니다.",
    interpretation: "부드럽게 꾸미는 매력보다 눈빛과 골격의 단단함이 먼저 각인됩니다.",
    priority: 1,
  },
  {
    id: "lianzhen-tanlang-combo-strong-pull",
    scope: "star_combo",
    palacePriority: ["children", "life"],
    stars: ["염정", "탐랑"],
    charmAxis: "sexual_pull",
    evidenceKind: "dohwa",
    physicalCharm: ["감각적 인상", "입술", "피부", "자기관리된 외모"],
    atmosphereCharm: ["도화의 증폭", "욕망", "강한 자기장"],
    sexualPullSource: ["육체적 매력과 정신적 끌림이 함께 강해지는 조합"],
    evidence: "염정과 탐랑 조합은 탐랑의 감각적 매력과 염정의 정신적 도화가 결합해 육체적·정신적으로 강한 매력을 만든다고 설명됩니다.",
    interpretation: "감각적인 끌림과 심리적으로 붙잡는 힘이 동시에 강해지는 조합입니다.",
    priority: 0,
  },
  {
    id: "lianzhen-tianxiang-reversal-charm",
    scope: "star_combo",
    palacePriority: ["children", "life"],
    stars: ["염정", "천상"],
    charmAxis: "sexual_pull",
    evidenceKind: "atmosphere",
    physicalCharm: ["단정한 실루엣", "우아한 인상"],
    atmosphereCharm: ["우아함 속 반전 매력", "규범적 겉모습과 다른 안쪽의 섹시함"],
    sexualPullSource: ["단정함과 반전 분위기의 대비"],
    evidence: "염정-천상 조합은 겉으로는 우아하지만 안쪽에 섹시한 반전 매력이 있다고 설명됩니다.",
    interpretation: "겉으로 단정해 보이는 분위기 안에 예상 밖의 반전이 있어 시선이 오래 머뭅니다.",
    priority: 0,
  },
  {
    id: "lianzhen-pojun-free-reversal",
    scope: "star_combo",
    palacePriority: ["children", "life"],
    stars: ["염정", "파군"],
    charmAxis: "sexual_pull",
    evidenceKind: "atmosphere",
    physicalCharm: ["단정한 겉모습", "아름다운 전문직 인상"],
    atmosphereCharm: ["자유분방함", "독립성", "강한 개성"],
    sexualPullSource: ["단정한 외형과 자유로운 본질의 대비"],
    evidence: "염정-파군 조합은 겉모습은 단정하지만 본질은 자유분방하고 독립적이며, 능력 있고 아름다운 인상으로 설명됩니다.",
    interpretation: "단정해 보이는 첫인상 뒤에 자유롭고 독립적인 긴장감이 숨어 있습니다.",
    priority: 0,
  },
  {
    id: "lianzhen-qisha-charisma",
    scope: "star_combo",
    palacePriority: ["children", "life"],
    stars: ["염정", "칠살"],
    charmAxis: "sexual_pull",
    evidenceKind: "atmosphere",
    physicalCharm: ["날카로운 인상", "선명한 얼굴선"],
    atmosphereCharm: ["카리스마", "리더십", "냉철한 판단력"],
    sexualPullSource: ["강인함과 사교성이 같이 보이는 긴장감"],
    evidence: "염정-칠살 조합은 사교성을 갖춘 강력한 카리스마와 리더십의 매력으로 설명됩니다.",
    interpretation: "강하고 선명한 분위기가 부담이 아니라 끌림으로 작동할 수 있는 조합입니다.",
    priority: 0,
  },
  cultivationRule("자미", "중심감과 품위가 매력으로 보입니다.", ["의견을 길게 설명하기보다 기준을 짧게 말하기", "자세와 옷의 선을 정돈해 품위가 흐트러지지 않게 하기"]),
  cultivationRule("천기", "지적 호기심과 날렵한 인상이 매력으로 보입니다.", ["상대의 말을 질문 1개와 정리 1개로 이어가기", "복잡한 설명을 줄이고 핵심만 남기기"]),
  cultivationRule("태양", "밝은 얼굴과 건강한 활력이 매력으로 보입니다.", ["먼저 가볍게 반응을 열기", "상체와 표정이 닫혀 보이지 않게 자세를 펴기"]),
  cultivationRule("무곡", "눈빛과 골격의 단단함이 매력으로 보입니다.", ["약속과 작은 실행을 지켜 신뢰감을 만들기", "시선이 날카롭게만 보이지 않도록 첫 반응을 부드럽게 열기"]),
  cultivationRule("천동", "입가와 피부의 부드러운 인상이 매력으로 보입니다.", ["편한 질문으로 대화 압박을 낮추기", "웃는 타이밍과 입가의 긴장을 자연스럽게 풀기"]),
  cultivationRule("염정", "이국적 분위기와 자기장이 매력으로 보입니다.", ["단정한 외형은 유지하되 초반 통제감을 줄이기", "선명한 인상을 살리는 색감과 실루엣 정리하기"]),
  cultivationRule("천부", "우아하고 안정적인 분위기가 매력으로 보입니다.", ["상대를 챙기되 대신 결정하지 않기", "옷차림과 공간 선택에서 안정된 취향을 보여주기"]),
  cultivationRule("태음", "부드러운 곡선과 은근한 분위기가 매력으로 보입니다.", ["감각적 취향을 대화 소재로 자연스럽게 꺼내기", "몸의 곡선이 과장되지 않게 실루엣을 정돈하기"]),
  cultivationRule("탐랑", "입술과 친근한 거리감, 도화 분위기가 매력으로 보입니다.", ["새로운 경험과 대화 주제를 늘리기", "호감 표현은 살리되 과한 자기중심적 어필 줄이기"]),
  cultivationRule("거문", "입매와 깊이 있는 말이 매력으로 보입니다.", ["비판보다 질문으로 시작하기", "메시지의 날카로운 표현을 한 번 부드럽게 바꾸기"]),
  cultivationRule("천상", "긴 실루엣과 조율된 분위기가 매력으로 보입니다.", ["상대가 편해지는 선택지를 제안하기", "자세와 말투의 균형을 일정하게 유지하기"]),
  cultivationRule("천량", "성숙한 체격감과 보호감이 매력으로 보입니다.", ["조언보다 믿음을 먼저 표현하기", "잔소리처럼 들리는 말을 줄이고 여유를 보여주기"]),
  cultivationRule("칠살", "날카로운 인상과 추진력이 매력으로 보입니다.", ["다음 약속이나 행동을 명확히 제안하기", "강한 속도를 내기 전 상대의 템포를 확인하기"]),
  cultivationRule("파군", "눈의 인상과 자유로운 분위기가 매력으로 보입니다.", ["새로운 장소나 경험을 제안하기", "급격한 변화 제안은 단계적으로 꺼내기"]),
  {
    id: "wenchang-expression-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life"],
    stars: ["문창"],
    charmAxis: "cultivation",
    evidenceKind: "cultivation",
    evidence: "문창은 표현력, 창조력, 자기어필, 센스가 있다.",
    interpretation: "말과 글에서 세련된 인상을 만들 수 있습니다.",
    cultivationHints: ["자기소개 첫 문장 다듬기", "상대에게 보내는 첫 메시지의 설명을 줄이기", "좋았던 장면을 한 문장으로 표현하기"],
    priority: 2,
  },
  {
    id: "wenqu-writing-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life"],
    stars: ["문곡"],
    charmAxis: "cultivation",
    evidenceKind: "cultivation",
    evidence: "문곡은 글, 공부, 문장 감각을 보강하는 길성입니다.",
    interpretation: "감정 표현을 글로 정리할 때 매력이 선명해집니다.",
    cultivationHints: ["프로필 문장 한 줄 줄이기", "감정 단어를 하나만 골라 명확히 표현하기", "메시지를 보내기 전 부담스러운 표현 덜어내기"],
    priority: 2,
  },
  {
    id: "zuofu-youbi-support-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life"],
    stars: ["좌보", "우필"],
    charmAxis: "cultivation",
    evidenceKind: "cultivation",
    evidence: "좌보와 우필은 도움, 지지, 환경의 유리함을 뜻합니다.",
    interpretation: "혼자 튀기보다 함께 있을 때 신뢰와 호감이 살아납니다.",
    cultivationHints: ["모임에서 한 사람을 구체적으로 돕기", "흐름을 정리하는 작은 역할 맡기"],
    priority: 3,
  },
  {
    id: "tiankui-tianyue-noble-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life"],
    stars: ["천괴", "천월"],
    charmAxis: "cultivation",
    evidenceKind: "cultivation",
    evidence: "천괴와 천월은 선택, 좋은 인연, 환경적 도움을 뜻합니다.",
    interpretation: "좋은 사람에게 발견되는 방식의 매력이 있습니다.",
    cultivationHints: ["검증된 커뮤니티에서 활동하기", "소개자와 신뢰 관계를 먼저 만들기"],
    priority: 3,
  },
  {
    id: "lucun-resource-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life"],
    stars: ["녹존", "록존"],
    charmAxis: "cultivation",
    evidenceKind: "cultivation",
    evidence: "녹존은 안정된 자원과 복록을 뜻합니다.",
    interpretation: "현실적 안정감이 매력으로 전달됩니다.",
    cultivationHints: ["과시보다 일정과 비용을 안정적으로 관리하기", "말한 약속을 작은 단위로 지키기"],
    priority: 3,
  },
  {
    id: "tianma-movement-cultivation",
    scope: "lucky_star",
    palacePriority: ["children", "life", "migration"],
    stars: ["천마"],
    charmAxis: "cultivation",
    evidenceKind: "cultivation",
    evidence: "천마는 이동과 활동성을 뜻합니다.",
    interpretation: "움직임이 있는 상황에서 매력이 살아납니다.",
    cultivationHints: ["산책이나 전시처럼 이동이 있는 만남 제안하기", "앉아서 긴 대화만 하기보다 몸의 리듬을 살리는 코스 선택하기"],
    priority: 3,
  },
  {
    id: "malefic-weakening-moment",
    scope: "malefic",
    palacePriority: ["spouse", "fortune", "children", "life"],
    stars: ["화성", "영성", "경양", "타라"],
    charmAxis: "weakening_moment",
    evidenceKind: "caution",
    evidence: "살성은 감정이 급해지거나 날카로워지는 리듬을 만들 수 있습니다.",
    interpretation: "매력이 급함, 예민함, 확인 욕구로 흐려질 수 있습니다.",
    cultivationHints: ["감정이 올라온 순간에는 고백이나 추궁을 하루 미루기", "짧은 문장으로 감정을 정리한 뒤 말하기"],
    priority: 2,
  },
  {
    id: "huaji-weakening-moment",
    scope: "sihua",
    palacePriority: ["spouse", "fortune", "children", "life"],
    stars: ["화기"],
    charmAxis: "weakening_moment",
    evidenceKind: "caution",
    evidence: "화기는 결핍, 확인 욕구, 집착이 생기는 영역입니다.",
    interpretation: "확인받고 싶은 마음이 강해질수록 매력이 압박으로 바뀔 수 있습니다.",
    cultivationHints: ["상대에게 바로 확인받기보다 내가 원하는 감정을 먼저 적기", "질문을 반복하기 전 한 번 쉬고 핵심만 말하기"],
    priority: 2,
  },
];

const palaceLabels: Record<string, string> = {
  children: "자녀궁",
  life: "명궁",
  spouse: "부처궁",
  fortune: "복덕궁",
  migration: "천이궁",
};

const axisLabels: Record<CharmAxis, string> = {
  latent_charm: "잠재 매력",
  felt_by_others: "이성이 느끼는 매력",
  sexual_pull: "성적 끌림 포인트",
  weakening_moment: "매력이 약해지는 순간",
  cultivation: "매력을 기르는 방법",
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

  return matched.slice(0, 12);
};

const formatList = (items?: string[]): string => items && items.length > 0 ? items.join(", ") : "해당 없음";

export const formatCharmActionRules = (rules: MatchedCharmActionRule[]): string => {
  if (rules.length === 0) {
    return `[CHARM_ACTION_RULES]\n- 매칭된 자녀궁/명궁 기반 매력 룰 없음\n  - 근거: 실제 자녀궁/명궁 별과 길성 조합을 추가 확인해야 합니다.\n  - 신체 매력 단서: 해당 없음\n  - 분위기 매력 단서: 해당 없음\n  - 성적 끌림 근거: 해당 없음\n  - 행동 힌트: 보편 조언을 쓰지 말고, 사용자의 실제 명반 데이터에서 확인되는 표현 방식만 짧게 설명합니다.`;
  }

  return `
[CHARM_ACTION_RULES]
${rules.map((rule) => `- 매칭 궁: ${rule.matchedPalace}
  - 매칭 별/조합: ${rule.stars.join(", ")}
  - 축: ${axisLabels[rule.charmAxis]}
  - 근거 유형: ${rule.evidenceKind || "cultivation"}
  - 신체 매력 단서: ${formatList(rule.physicalCharm)}
  - 분위기 매력 단서: ${formatList(rule.atmosphereCharm)}
  - 성적 끌림 근거: ${formatList(rule.sexualPullSource)}
  - 근거: ${rule.evidence}
  - 해석: ${rule.interpretation}
  - 행동 힌트: ${formatList(rule.cultivationHints || (rule.actionGuide ? [rule.actionGuide] : undefined))}`).join("\n")}
`;
};
