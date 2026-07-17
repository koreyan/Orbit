import type { ExtractedChart, ExtractedPalace } from "@/lib/ziwei-extractor";
import { getCurrentKoreanMonth, getMonthlyFlowMonths, getMonthlyFlowRequiredMonths } from "./love-month-flow";

// JSON 데이터베이스 로드
import type { SupabaseClient } from '@supabase/supabase-js';

type LoveConfigData = Record<string, unknown>;

export interface LoveConfigs {
  idealTypesDb: LoveConfigData;
  relationshipStylesDb: LoveConfigData;
  charmAssetsDb: LoveConfigData;
  relationshipProblemsDb: LoveConfigData;
  loveLuckDb: LoveConfigData;
}

export async function loadLoveConfigs(supabase: SupabaseClient): Promise<LoveConfigs> {
  const { data, error } = await supabase.from('z_love_configs').select('id, config_data').in('id', ['ideal_types', 'relationship_styles', 'charm_assets', 'relationship_problems', 'love_luck']);
  if (error) throw error;
  
  const map = data.reduce((acc, row) => {
    acc[row.id] = row.config_data;
    return acc;
  }, {} as Record<string, LoveConfigData>);

  return {
    idealTypesDb: map['ideal_types'] || {},
    relationshipStylesDb: map['relationship_styles'] || {},
    charmAssetsDb: map['charm_assets'] || {},
    relationshipProblemsDb: map['relationship_problems'] || {},
    loveLuckDb: map['love_luck'] || {},
  };
}

import { translatePalace, translateStar, translateSihua, sanitizeTerminology } from "./term-translator";

// 천간 정의
const YEAR_STEMS = ["경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"];

// ==========================================
// Strict Type Definitions (Strict Type)
// ==========================================

export interface RuntimeLiuYueData {
  month: number;
  mingGongZhi: string;
  natalPalaceName: string;
}

export interface RuntimeLiunianData {
  year?: number;
  age?: number;
  daxianPalaceName: string;
  daxianAgeStart: number;
  daxianAgeEnd: number;
  palaces: Record<string, string>;
  liuyue: RuntimeLiuYueData[];
}

export interface IdealStarMatch {
  starName: string;
  basicTrait: string;
  gilSeongEffect: string;
  salSeongEffect: string;
}

export interface PolarityContradiction {
  key: string;
  title: string;
  clashPattern: string;
  advice: string;
}

export interface PalaceContradiction {
  title: string;
  innerDesire: string;
  outerExpectation: string;
  fallbackAdvice: string;
}

export interface GongGungRule {
  palace: string;
  rule: {
    oppositePalace: string;
    clashPattern: string;
    advice: string;
  };
}

export interface BirthStemMatch {
  stem: string;
  targetPalace: string;
  targetStar: string;
  attractionMechanism: string;
}

export interface IdealTypesMatchResult {
  idealStars: IdealStarMatch[];
  polarityContradiction: PolarityContradiction | null;
  palaceContradiction: PalaceContradiction | null;
  gongGungRules: GongGungRule[];
  birthStemMatch: BirthStemMatch | null;
}

export interface RelationshipMotive {
  starNames: string[];
  styleName: string;
  description: string;
  behaviorInLove: string;
}

export interface SihuaEffect {
  starName: string;
  sihua: string;
}

export interface RelationshipStylesMatchResult {
  motive: RelationshipMotive | null;
  doubleStarSynthesis: { type: string; text: string } | null;
  gilSeongModifiers: string[];
  sihuaEffects: SihuaEffect[];
  expectations: { starName: string; expectation: string }[];
}

export interface CharmMatch {
  palaceLabel: string;
  starName: string;
  title: string;
  description: string;
}

export interface YeomjeongComboMatch {
  key: string;
  title: string;
  coreAura: string;
  flirtingBehavior: string;
}

export interface DohwaCharmMatch {
  starName: string;
  charmType: string;
  coreAttraction: string;
}

export interface CharmAssetsMatchResult {
  charms: CharmMatch[];
  yeomjeongCombo: YeomjeongComboMatch | null;
  dohwaCharms: DohwaCharmMatch[];
}

export interface SalSeongTempoMatch {
  palaceLabel: string;
  starName: string;
  tempoType: string;
  pattern: string;
  solution: string;
}

export interface GongMangEffectMatch {
  palaceLabel: string;
  starName: string;
  effect: string;
}

export interface HwaGiDeficiencyMatch {
  palaceLabel: string;
  starName: string;
  key: string;
  deficiencyType: string;
  behavior: string;
  selfAche: string;
}

export interface SynergyMatch {
  palaceLabel: string;
  key: string;
  title: string;
  patternEffect: string;
  advice: string;
}

export interface RelationshipProblemsMatchResult {
  tempos: SalSeongTempoMatch[];
  gongMangs: GongMangEffectMatch[];
  hwaGis: HwaGiDeficiencyMatch[];
  synergies: SynergyMatch[];
  flyOutProblem: { phenomenon: string; mechanism: string; solution: string } | null;
}

export interface DohwaActivationMatch {
  starName: string;
  opportunity: string;
  warning: string;
}

export interface MonthlyFlowEntry {
  month: number;
  palaceLabel: string;
  stars: string[];
  dohwaActivation: DohwaActivationMatch | null;
  blocker: { starName: string; effect: string } | null;
  encounterPath: { pathDescription: string } | null;
}

export interface UnconsciousNeedMatch {
  palaceLabel: string;
  deficiencyType: string;
  innerChildDescription: string;
  solution: string;
}

export interface LoveLuckMatchResult {
  dohwaActivation: DohwaActivationMatch | null;
  blocker: { starName: string; effect: string } | null;
  encounterPath: { pathDescription: string } | null;
  pregnancyCelebration: { condition: string; manifestation: string } | null;
  monthlyFlowStartMonth: number;
  requiredMonthlyFlowMonths: number[];
  monthlyFlow: MonthlyFlowEntry[];
  unconsciousNeeds: UnconsciousNeedMatch | null;
}

export interface DatingDatabaseMatches {
  idealTypes: IdealTypesMatchResult;
  relationshipStyles: RelationshipStylesMatchResult;
  charmAssets: CharmAssetsMatchResult;
  relationshipProblems: RelationshipProblemsMatchResult;
  loveLuck: LoveLuckMatchResult;
}

// ==========================================
// Helper Functions
// ==========================================

const getStarNames = (palace?: ExtractedPalace): string[] => {
  if (!palace) return [];
  return [
    ...(palace.majorStars || []),
    ...(palace.luckyStars || []),
    ...(palace.unluckyStars || []),
  ].map((s) => s.name);
};

const hasStar = (palace: ExtractedPalace | undefined, starName: string): boolean => {
  if (!palace) return false;
  return getStarNames(palace).includes(starName);
};

// ==========================================
// Extraction Implementation
// ==========================================

/** 1. 이상형 데이터 추출 (idealTypes) */
function extractIdealTypes(configs: LoveConfigs, extractedStars: ExtractedChart, birthDate: string | null): IdealTypesMatchResult {
  const { idealTypesDb } = configs;
  const spousePalace = extractedStars["夫妻"];
  const careerPalace = extractedStars["官祿"];

  // 1-1. spousePalaceStars 추출
  const idealStars: IdealStarMatch[] = [];
  if (spousePalace && spousePalace.majorStars.length > 0) {
    spousePalace.majorStars.forEach((star) => {
      const dbEntry = (idealTypesDb.spousePalaceStars as Record<string, Omit<IdealStarMatch, "starName">>)[star.name];
      if (dbEntry) {
        idealStars.push({
          starName: star.name,
          basicTrait: dbEntry.basicTrait,
          gilSeongEffect: dbEntry.gilSeongEffect,
          salSeongEffect: dbEntry.salSeongEffect,
        });
      }
    });
  }

  // 1-2. polarityContradictions (음양 모순) 추출
  let polarityContradiction: PolarityContradiction | null = null;
  if (spousePalace && careerPalace && spousePalace.majorStars.length > 0 && careerPalace.majorStars.length > 0) {
    const spouseStarName = spousePalace.majorStars[0].name;
    const careerStarName = careerPalace.majorStars[0].name;

    const spousePolarityEntry = (idealTypesDb.starPolarities as Record<string, { polarity: string; innerDesireText: string; outerExpectationText: string; dissatisfactionText: string }>)[spouseStarName];
    const careerPolarityEntry = (idealTypesDb.starPolarities as Record<string, { polarity: string; innerDesireText: string; outerExpectationText: string; dissatisfactionText: string }>)[careerStarName];

    if (spousePolarityEntry && careerPolarityEntry) {
      const spousePolarity = spousePolarityEntry.polarity;
      const careerPolarity = careerPolarityEntry.polarity;
      const key = `${spousePolarity}_${careerPolarity}`;

      const contradictionTemplate = (idealTypesDb.polarityContradictions as Record<string, { titleTemplate: string; clashPatternTemplate: string; adviceTemplate: string }>)[key];
      if (contradictionTemplate) {
        const title = contradictionTemplate.titleTemplate;
        const clashPattern = contradictionTemplate.clashPatternTemplate
          .replace("[innerDesireText]", spousePolarityEntry.innerDesireText)
          .replace("[outerExpectationText]", careerPolarityEntry.outerExpectationText)
          .replace("[dissatisfactionText]", spousePolarityEntry.dissatisfactionText);
        const advice = contradictionTemplate.adviceTemplate;

        polarityContradiction = { key, title, clashPattern, advice };
      }
    }
  }

  // 1-3. palaceContradictions (궁 간 특정 모순) 추출
  let palaceContradiction: PalaceContradiction | null = null;
  if (spousePalace && careerPalace && spousePalace.majorStars.length > 0 && careerPalace.majorStars.length > 0) {
    const spouseStarName = spousePalace.majorStars[0].name;
    const careerStarName = careerPalace.majorStars[0].name;

    const key = `${spouseStarName}_${careerStarName}`;
    let matched = (idealTypesDb.palaceContradictions as Record<string, PalaceContradiction>)[key];
    if (!matched) {
      const reverseKey = `${careerStarName}_${spouseStarName}`;
      matched = (idealTypesDb.palaceContradictions as Record<string, PalaceContradiction>)[reverseKey];
    }

    if (matched) {
      palaceContradiction = {
        title: matched.title,
        innerDesire: matched.innerDesire,
        outerExpectation: matched.outerExpectation,
        fallbackAdvice: matched.fallbackAdvice,
      };
    }
  }

  // 1-4. 공궁 규칙 (gongGungRules)
  const gongGungRules: GongGungRule[] = [];
  const gongGungRulesSource = idealTypesDb.gongGungRules as Record<string, GongGungRule["rule"]>;
  if (spousePalace?.borrowed) {
    gongGungRules.push({
      palace: "부처궁",
      rule: gongGungRulesSource["부처궁_공궁"],
    });
  }
  if (careerPalace?.borrowed) {
    gongGungRules.push({
      palace: "관록궁",
      rule: gongGungRulesSource["관록궁_공궁"],
    });
  }

  // 1-5. 출생년 천간 매칭 (birthStemMatch)
  let birthStemMatch: BirthStemMatch | null = null;
  if (birthDate) {
    try {
      const year = new Date(birthDate).getFullYear();
      if (!isNaN(year)) {
        const stem = YEAR_STEMS[year % 10];
        const match = (idealTypesDb.birthStemMatch as Record<string, Omit<BirthStemMatch, "stem">>)[stem];
        if (match) {
          birthStemMatch = { stem, ...match };
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    idealStars,
    polarityContradiction,
    palaceContradiction,
    gongGungRules,
    birthStemMatch,
  };
}

/** 2. 연애 성향 데이터 추출 (relationshipStyles) */
function extractRelationshipStyles(configs: LoveConfigs, extractedStars: ExtractedChart): RelationshipStylesMatchResult {
  const { relationshipStylesDb, idealTypesDb } = configs;
  const spousePalace = extractedStars["夫妻"];
  let motive: RelationshipMotive | null = null;
  let doubleStarSynthesis: { type: string; text: string } | null = null;
  const gilSeongModifiers: string[] = [];

  if (spousePalace && spousePalace.majorStars.length > 0) {
    const starNames = spousePalace.majorStars.map((s) => s.name);

    if (starNames.length >= 2) {
      const key1 = `${starNames[0]}_${starNames[1]}`;
      const key2 = `${starNames[1]}_${starNames[0]}`;
      const matchedMotive = (relationshipStylesDb.emotionalMotives as Record<string, Omit<RelationshipMotive, "starNames">>)[key1] || 
                            (relationshipStylesDb.emotionalMotives as Record<string, Omit<RelationshipMotive, "starNames">>)[key2];

      if (matchedMotive) {
        motive = {
          starNames: [starNames[0], starNames[1]],
          styleName: matchedMotive.styleName,
          description: matchedMotive.description,
          behaviorInLove: matchedMotive.behaviorInLove,
        };
      } else {
        const fallbackMotive = (relationshipStylesDb.emotionalMotives as Record<string, Omit<RelationshipMotive, "starNames">>)[starNames[0]];
        if (fallbackMotive) {
          motive = {
            starNames: [starNames[0]],
            styleName: fallbackMotive.styleName,
            description: fallbackMotive.description,
            behaviorInLove: fallbackMotive.behaviorInLove,
          };
        }
      }

      const star1Polarity = (idealTypesDb.starPolarities as Record<string, { polarity: string }>)[starNames[0]]?.polarity;
      const star2Polarity = (idealTypesDb.starPolarities as Record<string, { polarity: string }>)[starNames[1]]?.polarity;
      const doubleStarSynthesisSource = relationshipStylesDb.doubleStarSynthesis as { synergy: string; clash: string };
      if (star1Polarity && star2Polarity) {
        if (star1Polarity === star2Polarity) {
          doubleStarSynthesis = { type: "synergy", text: doubleStarSynthesisSource.synergy };
        } else {
          doubleStarSynthesis = { type: "clash", text: doubleStarSynthesisSource.clash };
        }
      }
    } else {
      const starName = starNames[0];
      const matchedMotive = (relationshipStylesDb.emotionalMotives as Record<string, Omit<RelationshipMotive, "starNames">>)[starName];
      if (matchedMotive) {
        motive = {
          starNames: [starName],
          styleName: matchedMotive.styleName,
          description: matchedMotive.description,
          behaviorInLove: matchedMotive.behaviorInLove,
        };
      }
    }

    const gilSeongs = getStarNames(spousePalace);

    // 부처궁 실제 주성의 gilSeongModifier를 사용 (쌍성일 경우 첫 번째 주성 기준)
    const primaryStarName = spousePalace.majorStars[0]?.name;
    const primaryMotiveEntry = primaryStarName
      ? (relationshipStylesDb.emotionalMotives as Record<string, { gilSeongModifier?: Record<string, string> }>)[primaryStarName]
      : null;
    const gilEntry = primaryMotiveEntry?.gilSeongModifier;

    if (gilEntry) {
      if (gilSeongs.includes("좌보") || gilSeongs.includes("우필")) {
        gilSeongModifiers.push(gilEntry["좌보_우필"]);
      }
      if (gilSeongs.includes("문창") || gilSeongs.includes("문곡")) {
        gilSeongModifiers.push(gilEntry["문창_문곡"]);
      }
      if (gilSeongs.includes("천괴") || gilSeongs.includes("천월")) {
        gilSeongModifiers.push(gilEntry["천괴_천월"]);
      }
      if (gilSeongs.includes("록존") || gilSeongs.includes("녹존")) {
        gilSeongModifiers.push(gilEntry["록존"]);
      }
      if (gilSeongs.includes("천마")) {
        gilSeongModifiers.push(gilEntry["천마"]);
      }
    }
  }

  const expectations: { starName: string; expectation: string }[] = [];
  if (spousePalace && spousePalace.majorStars.length > 0) {
    spousePalace.majorStars.forEach((star) => {
      const entry = (relationshipStylesDb.emotionalExpectations as Record<string, { expectation: string }>)[star.name];
      if (entry) {
        expectations.push({ starName: star.name, expectation: entry.expectation });
      }
    });
  }

  // 부처궁 사화(四化) 효과 추출
  const sihuaEffects: SihuaEffect[] = [];
  if (spousePalace) {
    const allStars = [
      ...(spousePalace.majorStars || []),
      ...(spousePalace.luckyStars || []),
      ...(spousePalace.unluckyStars || []),
    ];
    allStars.forEach((star) => {
      if (star.sihua) {
        sihuaEffects.push({ starName: star.name, sihua: star.sihua });
      }
    });
  }

  return {
    motive,
    doubleStarSynthesis,
    gilSeongModifiers,
    sihuaEffects,
    expectations,
  };
}

/** 3. 매력 자산 데이터 추출 (charmAssets) */
function extractCharmAssets(configs: LoveConfigs, extractedStars: ExtractedChart): CharmAssetsMatchResult {
  const { charmAssetsDb } = configs;
  const palacesToCheck = [
    { key: "命宮", label: "명궁" },
    { key: "遷移", label: "천이궁" },
    { key: "子女", label: "자녀궁" },
    { key: "福德", label: "복덕궁" },
  ];

  const charms: CharmMatch[] = [];
  palacesToCheck.forEach(({ key, label }) => {
    const palace = extractedStars[key];
    if (palace && palace.majorStars.length > 0) {
      palace.majorStars.forEach((star) => {
        const dbEntry = (charmAssetsDb.palaceCharms as Record<string, Record<string, { title: string; description: string }>>)[label]?.[star.name];
        if (dbEntry) {
          charms.push({
            palaceLabel: label,
            starName: star.name,
            title: dbEntry.title,
            description: dbEntry.description,
          });
        }
      });
    }
  });

  let yeomjeongCombo: YeomjeongComboMatch | null = null;
  const lifePalace = extractedStars["命宮"];
  if (lifePalace && hasStar(lifePalace, "염정")) {
    const starNames = getStarNames(lifePalace);
    let matchedKey = "";
    if (starNames.includes("탐랑")) matchedKey = "염정_탐랑";
    else if (starNames.includes("천상")) matchedKey = "염정_천상";
    else if (starNames.includes("파군")) matchedKey = "염정_파군";
    else if (starNames.includes("칠살")) matchedKey = "염정_칠살";

    if (matchedKey) {
      const dbEntry = (charmAssetsDb.yeomjeongCombos as Record<string, Omit<YeomjeongComboMatch, "key">>)[matchedKey];
      if (dbEntry) {
        yeomjeongCombo = {
          key: matchedKey,
          title: dbEntry.title,
          coreAura: dbEntry.coreAura,
          flirtingBehavior: dbEntry.flirtingBehavior,
        };
      }
    }
  }

  const dohwaCharms: DohwaCharmMatch[] = [];
  const scannedDohwa = new Set<string>();
  Object.values(extractedStars).forEach((palace) => {
    if (!palace) return;
    const starNames = getStarNames(palace);
    starNames.forEach((starName) => {
      const dbEntry = (charmAssetsDb.dohwaStarCharms as Record<string, Omit<DohwaCharmMatch, "starName">>)[starName];
      if (dbEntry && !scannedDohwa.has(starName)) {
        dohwaCharms.push({
          starName,
          charmType: dbEntry.charmType,
          coreAttraction: dbEntry.coreAttraction,
        });
        scannedDohwa.add(starName);
      }
    });
  });

  return {
    charms,
    yeomjeongCombo,
    dohwaCharms,
  };
}

/** 4. 연애 문제 데이터 추출 (relationshipProblems) */
function extractRelationshipProblems(configs: LoveConfigs, extractedStars: ExtractedChart): RelationshipProblemsMatchResult {
  const { relationshipProblemsDb } = configs;
  const spousePalace = extractedStars["夫妻"];
  const fortunePalace = extractedStars["福德"];

  const tempos: SalSeongTempoMatch[] = [];
  const gongMangs: GongMangEffectMatch[] = [];
  const hwaGis: HwaGiDeficiencyMatch[] = [];
  const synergiesList: SynergyMatch[] = [];
  let flyOutProblem: { phenomenon: string; mechanism: string; solution: string } | null = null;
  const hwaGiFallback = relationshipProblemsDb.commonHwaGiFallback as { definition: string };
  const flyOutProblems = relationshipProblemsDb.flyOutProblems as Record<string, { phenomenon: string; mechanism: string; solution: string }>;

  const palacesToScan = [
    { palace: spousePalace, label: "부처궁" },
    { palace: fortunePalace, label: "복덕궁" },
  ];

  palacesToScan.forEach(({ palace, label }) => {
    if (!palace) return;
    const stars = getStarNames(palace);

    ["화성", "영성", "경양", "타라"].forEach((sal) => {
      if (stars.includes(sal)) {
        const dbEntry = (relationshipProblemsDb.salSeongTempo as Record<string, { tempoType: string; pattern: string; solution: string }>)[sal];
        if (dbEntry) {
          tempos.push({ palaceLabel: label, starName: sal, ...dbEntry });
        }
      }
    });

    ["지공", "지겁"].forEach((gong) => {
      if (stars.includes(gong)) {
        const dbEntry = (relationshipProblemsDb.gongMangEffect as Record<string, { effect: string }>)[gong];
        if (dbEntry) {
          gongMangs.push({ palaceLabel: label, starName: gong, ...dbEntry });
        }
      }
    });

    const allStars = [
      ...(palace.majorStars || []),
      ...(palace.luckyStars || []),
      ...(palace.unluckyStars || []),
    ];
    allStars.forEach((s) => {
      if (s.sihua === "화기") {
        const key = `${s.name}화기`;
        const dbEntry = (relationshipProblemsDb.hwaGiDeficiency as Record<string, { deficiencyType: string; behavior: string; selfAche: string }>)[key];
        if (dbEntry) {
          hwaGis.push({ palaceLabel: label, starName: s.name, key, ...dbEntry });
        } else {
          hwaGis.push({
            palaceLabel: label,
            starName: s.name,
            key,
            deficiencyType: "공통 화기 결핍",
            behavior: `${s.name}의 고유 기질에 화기의 결핍 작용이 발생합니다.`,
            selfAche: hwaGiFallback.definition,
          });
        }

        ["화성", "영성", "경양", "타라"].forEach((sal) => {
          if (stars.includes(sal)) {
            const synKey = `화기_${sal}`;
            const synEntry = (relationshipProblemsDb.synergies as Record<string, { title: string; patternEffect: string; advice: string }>)[synKey];
            if (synEntry) {
              synergiesList.push({ palaceLabel: label, key: synKey, ...synEntry });
            }
          }
        });
      }
    });
  });

  const noboPalace = extractedStars["交友"];
  if (noboPalace && spousePalace) {
    const hasSpouseHwaGi = spousePalace.majorStars.some((s) => s.sihua === "화기");
    if (hasSpouseHwaGi) {
      flyOutProblem = flyOutProblems["노복궁_화기_입_부처궁"];
    }
  }

  return {
    tempos,
    gongMangs,
    hwaGis,
    synergies: synergiesList,
    flyOutProblem,
  };
}

// 유월 궁위명(한자) → 한글 라벨 매핑
const PALACE_NAME_TO_LABEL: Record<string, string> = {
  "命宮": "명궁",
  "兄弟": "형제궁",
  "夫妻": "부처궁",
  "子女": "자녀궁",
  "財帛": "재백궁",
  "疾厄": "질액궁",
  "遷移": "천이궁",
  "交友": "노복궁",
  "官祿": "관록궁",
  "田宅": "전택궁",
  "福德": "복덕궁",
  "父母": "부모궁",
};

/** 5. 애정운 데이터 추출 (loveLuck) */
function extractLoveLuck(configs: LoveConfigs,
  extractedStars: ExtractedChart,
  liunian: RuntimeLiunianData | null
): LoveLuckMatchResult {
  const { loveLuckDb } = configs;
  let dohwaActivation: DohwaActivationMatch | null = null;
  let blocker: { starName: string; effect: string } | null = null;
  let encounterPath: { pathDescription: string } | null = null;
  let pregnancyCelebration: { condition: string; manifestation: string } | null = null;
  const monthlyFlow: MonthlyFlowEntry[] = [];
  
  let unconsciousNeeds: UnconsciousNeedMatch | null = null;

  const dohwaActivationSource = loveLuckDb.dohwaActivation as Record<string, Omit<DohwaActivationMatch, "starName">>;
  const encounterPathsSource = loveLuckDb.encounterPaths as Record<string, { pathDescription: string }>;
  const pregnancyCelebrationSource = loveLuckDb.pregnancyCelebration as { condition: string; manifestation: string };
  const dohwaStars = ["홍란", "천희", "천요", "함지", "대모", "소모", "태음", "탐랑", "천동"];
  const salStars = ["경양", "타라", "화성", "영성", "지공", "지겁"];

  // 3번 콘텐츠: 복덕궁 & 무의식 결핍 연산
  const fortunePalace = extractedStars["福德"];
  if (fortunePalace) {
    const fortuneStars = getStarNames(fortunePalace);
    const fortuneAllStarsObj = [
      ...(fortunePalace.majorStars || []),
      ...(fortunePalace.luckyStars || []),
      ...(fortunePalace.unluckyStars || [])
    ];
    
    // 복덕궁 주성화기 감지
    let hwaGiStarName = "";
    fortuneAllStarsObj.forEach((s) => {
      if (s.sihua === "화기") {
        hwaGiStarName = s.name;
      }
    });

    let matchedNeedKey = "";
    if (hwaGiStarName) {
      matchedNeedKey = `${hwaGiStarName}화기`;
    }

    const dbNeedMap = loveLuckDb.unconsciousNeeds as Record<string, { innerChild: string; deficiency: string; solution: string }>;
    
    if (matchedNeedKey && dbNeedMap[matchedNeedKey]) {
      unconsciousNeeds = {
        palaceLabel: "복덕궁",
        deficiencyType: dbNeedMap[matchedNeedKey].deficiency,
        innerChildDescription: dbNeedMap[matchedNeedKey].innerChild,
        solution: dbNeedMap[matchedNeedKey].solution
      };
    } else {
      // 살성 개수 연산
      const salCount = fortuneStars.filter(s => salStars.includes(s)).length;
      if (salCount >= 2 && dbNeedMap["살성밀집"]) {
        unconsciousNeeds = {
          palaceLabel: "복덕궁",
          deficiencyType: dbNeedMap["살성밀집"].deficiency,
          innerChildDescription: dbNeedMap["살성밀집"].innerChild,
          solution: dbNeedMap["살성밀집"].solution
        };
      } else if (fortuneStars.some(s => ["지공", "지겁"].includes(s)) && dbNeedMap["지공_지겁"]) {
        unconsciousNeeds = {
          palaceLabel: "복덕궁",
          deficiencyType: dbNeedMap["지공_지겁"].deficiency,
          innerChildDescription: dbNeedMap["지공_지겁"].innerChild,
          solution: dbNeedMap["지공_지겁"].solution
        };
      }
    }
  }

  if (liunian) {
    let matchedDohwaStar = "";
    let matchedBlockerStar = "";

    for (const [, palace] of Object.entries(extractedStars)) {
      if (!palace) continue;
      const stars = getStarNames(palace);
      
      stars.forEach((star) => {
        if (dohwaStars.includes(star) && !matchedDohwaStar) {
          matchedDohwaStar = star;
        }
        if (salStars.includes(star) && !matchedBlockerStar) {
          matchedBlockerStar = star;
        }
      });
    }

    if (matchedDohwaStar) {
      const dbEntry = dohwaActivationSource[matchedDohwaStar];
      if (dbEntry) {
        dohwaActivation = { starName: matchedDohwaStar, ...dbEntry };
      }
    } else {
      dohwaActivation = { starName: "홍란", ...dohwaActivationSource["홍란"] };
    }

    if (matchedBlockerStar) {
      const dbEntry = (loveLuckDb.blockers as Record<string, { effect: string }>)[matchedBlockerStar];
      if (dbEntry) {
        blocker = { starName: matchedBlockerStar, ...dbEntry };
      }
    }

    encounterPath = encounterPathsSource["노복궁"];
    
    const hasCelebrationSignal = Object.values(extractedStars).some((palace) => {
      if (!palace) return false;
      const stars = getStarNames(palace);
      const isCelebrationPalace = palace.name === "자녀궁" || palace.name === "전택궁";
      const hasSignal = stars.includes("천희") || stars.includes("녹존") || palace.majorStars.some((s) => s.sihua === "화록");
      return isCelebrationPalace && hasSignal;
    });

    if (hasCelebrationSignal) {
      pregnancyCelebration = {
        condition: pregnancyCelebrationSource.condition,
        manifestation: pregnancyCelebrationSource.manifestation,
      };
    }

    // 월별 연애운 흐름 추출 (현재 월 ~ 12월)
    const currentMonth = getCurrentKoreanMonth();
    const filteredMonths = getMonthlyFlowMonths({ liuyue: liunian.liuyue, currentMonth });

    filteredMonths.forEach((ly) => {
      const palaceLabel = PALACE_NAME_TO_LABEL[ly.natalPalaceName] ?? ly.natalPalaceName;
      const natalPalace = extractedStars[ly.natalPalaceName];
      const stars = natalPalace ? getStarNames(natalPalace) : [];

      // 해당 월 궁위에 도화성이 있는지 매칭
      let monthDohwa: DohwaActivationMatch | null = null;
      for (const star of stars) {
        if (dohwaStars.includes(star)) {
          const dbEntry = (loveLuckDb.dohwaActivation as Record<string, Omit<DohwaActivationMatch, "starName">>)[star];
          if (dbEntry) {
            monthDohwa = { starName: star, ...dbEntry };
            break;
          }
        }
      }

      // 해당 월 궁위에 살성(방해 요소)이 있는지 매칭
      let monthBlocker: { starName: string; effect: string } | null = null;
      for (const star of stars) {
        if (salStars.includes(star)) {
          const dbEntry = (loveLuckDb.blockers as Record<string, { effect: string }>)[star];
          if (dbEntry) {
            monthBlocker = { starName: star, ...dbEntry };
            break;
          }
        }
      }

      // 해당 월 중첩 궁위에 만남 경로 매칭
      let monthEncounterPath: { pathDescription: string } | null = null;
      const pathEntry = (loveLuckDb.encounterPaths as Record<string, { pathDescription: string }>)[palaceLabel];
      if (pathEntry) {
        monthEncounterPath = { pathDescription: pathEntry.pathDescription };
      }

      monthlyFlow.push({
        month: ly.month,
        palaceLabel,
        stars,
        dohwaActivation: monthDohwa,
        blocker: monthBlocker,
        encounterPath: monthEncounterPath,
      });
    });

  }

  return {
    dohwaActivation,
    blocker,
    encounterPath,
    pregnancyCelebration,
    monthlyFlowStartMonth: getCurrentKoreanMonth(),
    requiredMonthlyFlowMonths: getMonthlyFlowRequiredMonths(),
    monthlyFlow,
    unconsciousNeeds
  };
}

function translateDatingDatabaseMatches(matches: DatingDatabaseMatches): DatingDatabaseMatches {
  return {
    idealTypes: {
      idealStars: matches.idealTypes.idealStars.map(s => ({
        starName: translateStar(s.starName),
        basicTrait: sanitizeTerminology(s.basicTrait),
        gilSeongEffect: sanitizeTerminology(s.gilSeongEffect),
        salSeongEffect: sanitizeTerminology(s.salSeongEffect),
      })),
      polarityContradiction: matches.idealTypes.polarityContradiction ? {
        key: matches.idealTypes.polarityContradiction.key,
        title: sanitizeTerminology(matches.idealTypes.polarityContradiction.title),
        clashPattern: sanitizeTerminology(matches.idealTypes.polarityContradiction.clashPattern),
        advice: sanitizeTerminology(matches.idealTypes.polarityContradiction.advice),
      } : null,
      palaceContradiction: matches.idealTypes.palaceContradiction ? {
        title: sanitizeTerminology(matches.idealTypes.palaceContradiction.title),
        innerDesire: sanitizeTerminology(matches.idealTypes.palaceContradiction.innerDesire),
        outerExpectation: sanitizeTerminology(matches.idealTypes.palaceContradiction.outerExpectation),
        fallbackAdvice: sanitizeTerminology(matches.idealTypes.palaceContradiction.fallbackAdvice),
      } : null,
      gongGungRules: matches.idealTypes.gongGungRules.map(g => ({
        palace: translatePalace(g.palace),
        rule: {
          oppositePalace: translatePalace(g.rule.oppositePalace),
          clashPattern: sanitizeTerminology(g.rule.clashPattern),
          advice: sanitizeTerminology(g.rule.advice),
        }
      })),
      birthStemMatch: matches.idealTypes.birthStemMatch ? {
        stem: matches.idealTypes.birthStemMatch.stem,
        targetPalace: translatePalace(matches.idealTypes.birthStemMatch.targetPalace),
        targetStar: translateStar(matches.idealTypes.birthStemMatch.targetStar),
        attractionMechanism: sanitizeTerminology(matches.idealTypes.birthStemMatch.attractionMechanism),
      } : null,
    },
    relationshipStyles: {
      motive: matches.relationshipStyles.motive ? {
        starNames: matches.relationshipStyles.motive.starNames.map(translateStar),
        styleName: sanitizeTerminology(matches.relationshipStyles.motive.styleName),
        description: sanitizeTerminology(matches.relationshipStyles.motive.description),
        behaviorInLove: sanitizeTerminology(matches.relationshipStyles.motive.behaviorInLove),
      } : null,
      doubleStarSynthesis: matches.relationshipStyles.doubleStarSynthesis ? {
        type: matches.relationshipStyles.doubleStarSynthesis.type,
        text: sanitizeTerminology(matches.relationshipStyles.doubleStarSynthesis.text),
      } : null,
      gilSeongModifiers: matches.relationshipStyles.gilSeongModifiers.map(sanitizeTerminology),
      sihuaEffects: matches.relationshipStyles.sihuaEffects.map(s => ({
        starName: translateStar(s.starName),
        sihua: translateSihua(s.sihua),
      })),
      expectations: matches.relationshipStyles.expectations.map(e => ({
        starName: translateStar(e.starName),
        expectation: sanitizeTerminology(e.expectation),
      })),
    },
    charmAssets: {
      charms: matches.charmAssets.charms.map(c => ({
        palaceLabel: translatePalace(c.palaceLabel),
        starName: translateStar(c.starName),
        title: sanitizeTerminology(c.title),
        description: sanitizeTerminology(c.description),
      })),
      yeomjeongCombo: matches.charmAssets.yeomjeongCombo ? {
        key: matches.charmAssets.yeomjeongCombo.key,
        title: sanitizeTerminology(matches.charmAssets.yeomjeongCombo.title),
        coreAura: sanitizeTerminology(matches.charmAssets.yeomjeongCombo.coreAura),
        flirtingBehavior: sanitizeTerminology(matches.charmAssets.yeomjeongCombo.flirtingBehavior),
      } : null,
      dohwaCharms: matches.charmAssets.dohwaCharms.map(d => ({
        starName: translateStar(d.starName),
        charmType: d.charmType,
        coreAttraction: sanitizeTerminology(d.coreAttraction),
      })),
    },
    relationshipProblems: {
      tempos: matches.relationshipProblems.tempos.map(t => ({
        palaceLabel: translatePalace(t.palaceLabel),
        starName: translateStar(t.starName),
        tempoType: t.tempoType,
        pattern: sanitizeTerminology(t.pattern),
        solution: sanitizeTerminology(t.solution),
      })),
      gongMangs: matches.relationshipProblems.gongMangs.map(g => ({
        palaceLabel: translatePalace(g.palaceLabel),
        starName: translateStar(g.starName),
        effect: sanitizeTerminology(g.effect),
      })),
      hwaGis: matches.relationshipProblems.hwaGis.map(h => ({
        palaceLabel: translatePalace(h.palaceLabel),
        starName: translateStar(h.starName),
        key: h.key,
        deficiencyType: h.deficiencyType,
        behavior: sanitizeTerminology(h.behavior),
        selfAche: sanitizeTerminology(h.selfAche),
      })),
      synergies: matches.relationshipProblems.synergies.map(s => ({
        palaceLabel: translatePalace(s.palaceLabel),
        key: s.key,
        title: sanitizeTerminology(s.title),
        patternEffect: sanitizeTerminology(s.patternEffect),
        advice: sanitizeTerminology(s.advice),
      })),
      flyOutProblem: matches.relationshipProblems.flyOutProblem ? {
        phenomenon: sanitizeTerminology(matches.relationshipProblems.flyOutProblem.phenomenon),
        mechanism: sanitizeTerminology(matches.relationshipProblems.flyOutProblem.mechanism),
        solution: sanitizeTerminology(matches.relationshipProblems.flyOutProblem.solution),
      } : null,
    },
    loveLuck: {
      dohwaActivation: matches.loveLuck.dohwaActivation ? {
        starName: translateStar(matches.loveLuck.dohwaActivation.starName),
        opportunity: sanitizeTerminology(matches.loveLuck.dohwaActivation.opportunity),
        warning: sanitizeTerminology(matches.loveLuck.dohwaActivation.warning),
      } : null,
      blocker: matches.loveLuck.blocker ? {
        starName: translateStar(matches.loveLuck.blocker.starName),
        effect: sanitizeTerminology(matches.loveLuck.blocker.effect),
      } : null,
      encounterPath: matches.loveLuck.encounterPath ? {
        pathDescription: sanitizeTerminology(matches.loveLuck.encounterPath.pathDescription),
      } : null,
      pregnancyCelebration: matches.loveLuck.pregnancyCelebration ? {
        condition: sanitizeTerminology(matches.loveLuck.pregnancyCelebration.condition),
        manifestation: sanitizeTerminology(matches.loveLuck.pregnancyCelebration.manifestation),
      } : null,
      monthlyFlowStartMonth: matches.loveLuck.monthlyFlowStartMonth,
      requiredMonthlyFlowMonths: matches.loveLuck.requiredMonthlyFlowMonths,
      monthlyFlow: matches.loveLuck.monthlyFlow.map(m => ({
        month: m.month,
        palaceLabel: translatePalace(m.palaceLabel),
        stars: m.stars.map(translateStar),
        dohwaActivation: m.dohwaActivation ? {
          starName: translateStar(m.dohwaActivation.starName),
          opportunity: sanitizeTerminology(m.dohwaActivation.opportunity),
          warning: sanitizeTerminology(m.dohwaActivation.warning),
        } : null,
        blocker: m.blocker ? {
          starName: translateStar(m.blocker.starName),
          effect: sanitizeTerminology(m.blocker.effect),
        } : null,
        encounterPath: m.encounterPath ? {
          pathDescription: sanitizeTerminology(m.encounterPath.pathDescription),
        } : null,
      })),
      unconsciousNeeds: matches.loveLuck.unconsciousNeeds ? {
        palaceLabel: translatePalace(matches.loveLuck.unconsciousNeeds.palaceLabel),
        deficiencyType: matches.loveLuck.unconsciousNeeds.deficiencyType,
        innerChildDescription: sanitizeTerminology(matches.loveLuck.unconsciousNeeds.innerChildDescription),
        solution: sanitizeTerminology(matches.loveLuck.unconsciousNeeds.solution),
      } : null,
    }
  };
}

/** 5대 JSON 파일에서 맞춤형 텍스트 일괄 추출 */
export function extractDatingDatabaseMatches(
  configs: LoveConfigs,
  extractedStars: ExtractedChart,
  birthDate: string | null,
  liunian: RuntimeLiunianData | null
): DatingDatabaseMatches {
  const rawMatches = {
    idealTypes: extractIdealTypes(configs, extractedStars, birthDate),
    relationshipStyles: extractRelationshipStyles(configs, extractedStars),
    charmAssets: extractCharmAssets(configs, extractedStars),
    relationshipProblems: extractRelationshipProblems(configs, extractedStars),
    loveLuck: extractLoveLuck(configs, extractedStars, liunian),
  };
  return translateDatingDatabaseMatches(rawMatches);
}
