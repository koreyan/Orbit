import { translateZiwei } from "./ziwei-translator";
import type { ZiweiChart, ZiweiStar } from "./ziwei-types";

export const MAJOR_STARS = [
  '紫微', '天機', '太陽', '武曲', '天同', '廉貞',
  '天府', '太陰', '貪狼', '巨門', '天相', '天梁',
  '七殺', '破軍'
];

export const LUCKY_STARS = [
  '左輔', '右弼', '文昌', '文曲', '天魁', '天鉞', '祿存', '天馬'
];

export const UNLUCKY_STARS = [
  '火星', '鈴星', '擎羊', '陀羅', '地空', '地劫'
];

export interface StarWithSiHua {
  name: string;
  sihua: string | null;
}

export interface ExtractedPalace {
  name: string;
  majorStars: StarWithSiHua[];
  luckyStars: StarWithSiHua[];
  unluckyStars: StarWithSiHua[];
  borrowed: boolean;
}

export type ExtractedChart = Record<string, ExtractedPalace>;

function extractStars(starsData: ZiweiStar[], filterList: string[]): StarWithSiHua[] {
  return starsData
    .filter((s) => filterList.includes(s.name))
    .map((s) => ({
      name: translateZiwei(s.name),
      sihua: s.siHua ? translateZiwei(s.siHua) : null
    }));
}

export function extractMainStars(chartData: ZiweiChart): ExtractedChart {
  const palaces = chartData.palaces;
  if (!palaces) throw new Error("Invalid chart data");

  const palaceKeys = [
    '命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄',
    '遷移', '交友', '官祿', '田宅', '福德', '父母'
  ];

  const extracted: ExtractedChart = {};

  palaceKeys.forEach((key, index) => {
    const palace = palaces[key];
    if (!palace) return;

    let majorStars = extractStars(palace.stars, MAJOR_STARS);
    let luckyStars = extractStars(palace.stars, LUCKY_STARS);
    let unluckyStars = extractStars(palace.stars, UNLUCKY_STARS);
    let borrowed = false;

    // 무주성(빈 궁)인 경우, 차성안궁 (대궁에서 빌려오기)
    if (majorStars.length === 0) {
      const oppositeIndex = (index + 6) % 12;
      const oppositeKey = palaceKeys[oppositeIndex];
      const oppositePalace = palaces[oppositeKey];

      if (oppositePalace) {
        // 차성안궁 시 주성 뿐만 아니라 보조성도 함께 빌려옵니다. (해석의 일관성을 위해)
        majorStars = extractStars(oppositePalace.stars, MAJOR_STARS);
        luckyStars = extractStars(oppositePalace.stars, LUCKY_STARS);
        unluckyStars = extractStars(oppositePalace.stars, UNLUCKY_STARS);
        borrowed = true;
      }
    }

    extracted[key] = {
      name: translateZiwei(key),
      majorStars,
      luckyStars,
      unluckyStars,
      borrowed
    };
  });

  return extracted;
}

export function filterThemePalaces(extracted: ExtractedChart, theme: string) {
  const lifePalace = extracted['命宮'];
  let themePalaces: ExtractedPalace[] = [];

  switch (theme) {
    case 'career':
      themePalaces = [extracted['官祿'], extracted['財帛']]; // 관록궁, 재백궁
      break;
    case 'love':
      themePalaces = [extracted['夫妻'], extracted['遷移'], extracted['子女']]; // 부처궁, 천이궁, 자녀궁(본능적 매력/도화)
      break;
    case 'hobby':
      themePalaces = [extracted['疾厄'], extracted['福德']]; // 질액궁, 복덕궁
      break;
    default:
      themePalaces = [extracted['官祿'], extracted['財帛']];
  }

  themePalaces = themePalaces.filter(Boolean);

  return {
    lifePalace,
    themePalaces
  };
}

/**
 * 화록(化祿)과 록존(祿存)이 위치한 궁을 동적으로 탐색하는 함수.
 * 커리어/재물 테마에서 '돈이 흘러나오는 진짜 금광(수익 파이프라인)'을 찾기 위해 사용.
 */
export function findLuStarPalaces(extracted: ExtractedChart): ExtractedPalace[] {
  const luPalaces: ExtractedPalace[] = [];
  const addedPalaceNames = new Set<string>();

  for (const [key, palace] of Object.entries(extracted)) {
    if (!palace) continue;

    // 모든 별(주성, 길성, 흉성)을 순회하며 록존 또는 화록 사화를 찾음
    const allStars = [
      ...(palace.majorStars || []),
      ...(palace.luckyStars || []),
      ...(palace.unluckyStars || [])
    ];

    const hasLuStar = allStars.some(
      (s: StarWithSiHua) => s.name === '녹존' || s.sihua === '화록'
    );

    if (hasLuStar && !addedPalaceNames.has(key)) {
      luPalaces.push(palace);
      addedPalaceNames.add(key);
    }
  }

  return luPalaces;
}

/**
 * 록존(祿存)이 위치한 궁을 탐색하는 함수
 */
export function findLokJonPalace(extracted: ExtractedChart): ExtractedPalace | null {
  for (const [, palace] of Object.entries(extracted)) {
    if (!palace) continue;
    const allStars = [
      ...(palace.majorStars || []),
      ...(palace.luckyStars || []),
      ...(palace.unluckyStars || [])
    ];
    if (allStars.some((s: StarWithSiHua) => s.name === '녹존' || s.name === '록존')) {
      return palace;
    }
  }
  return null;
}

/**
 * 4가지 사화(화록, 화권, 화과, 화기)가 작용하는 별과 궁을 찾는 함수
 */
export function findSiHuaPalaces(extracted: ExtractedChart) {
  const sihuaMap: Record<string, { palaceName: string, starName: string }[]> = {
    '화록': [],
    '화권': [],
    '화과': [],
    '화기': []
  };

  for (const [, palace] of Object.entries(extracted)) {
    if (!palace) continue;
    const allStars = [
      ...(palace.majorStars || []),
      ...(palace.luckyStars || []),
      ...(palace.unluckyStars || [])
    ];

    allStars.forEach((s: StarWithSiHua) => {
      if (s.sihua && sihuaMap[s.sihua]) {
        sihuaMap[s.sihua].push({ palaceName: palace.name, starName: s.name });
      }
    });
  }

  return sihuaMap;
}

export interface LoveTagData {
  attraction_pattern: string;
  compatible_partner: string;
  conflict_pattern: string;
  solo_blocker: string;
  charm_asset: string;
  encounter_path: string;
  timing_signal: string;
  action_guide: string;
}

const formatStars = (palace: ExtractedPalace | undefined): string => {
  if (!palace) return '없음';

  const starNames = [
    ...(palace.majorStars || []),
    ...(palace.luckyStars || []),
    ...(palace.unluckyStars || [])
  ]
    .map((star) => star.name)
    .filter(Boolean);

  if (starNames.length === 0) {
    return palace.borrowed ? `${palace.name}궁은 주성을 빌려 해석합니다` : `${palace.name}궁은 비어 있습니다`;
  }

  return `${palace.name}궁의 ${starNames.join(', ')}`;
};

export function extractLoveTags(
  extracted: ExtractedChart,
  shenGongPalaceName: string,
  periodicPalacesInfo: string
): LoveTagData {
  const lifePalace = extracted['命宮'];
  const spousePalace = extracted['夫妻'];
  const childrenPalace = extracted['子女'];
  const migrationPalace = extracted['遷移'];
  const financialPalace = extracted['財帛'];

  return {
    attraction_pattern: `끌림의 방향은 ${formatStars(childrenPalace)}와 ${formatStars(lifePalace)}에서 먼저 드러납니다.`,
    compatible_partner: `오래 편한 사람의 기준은 ${formatStars(spousePalace)}의 안정감과 소통 방식에 맞춰집니다.`,
    conflict_pattern: `갈등이 반복되는 패턴은 ${formatStars(spousePalace)}와 ${shenGongPalaceName}의 조합에서 드러나는 경계심입니다.`,
    solo_blocker: `연애를 미루게 만드는 장벽은 ${shenGongPalaceName}이 요구하는 책임감과 ${formatStars(lifePalace)}의 고집에서 생깁니다.`,
    charm_asset: `당신의 매력 자산은 ${formatStars(lifePalace)}의 기질과 ${formatStars(childrenPalace)}의 본능적 끌림, ${formatStars(migrationPalace)}의 대외적 분위기가 함께 만듭니다.`,
    encounter_path: `인연은 ${formatStars(migrationPalace)}처럼 바깥 활동과 사람을 자주 만나는 흐름에서 들어옵니다.`,
    timing_signal: periodicPalacesInfo || `시기 흐름은 ${formatStars(financialPalace)}의 안정감과 계절감처럼 천천히 드러납니다.`,
    action_guide: `지금은 ${formatStars(lifePalace)}의 강점을 먼저 정리하고, ${formatStars(spousePalace)}가 원하는 대화 습관을 실제 관계 밖에서 연습해야 합니다.`,
  };
}
