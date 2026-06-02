import { translateZiwei } from "./ziwei-translator";

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

function extractStars(starsData: any[], filterList: string[]): StarWithSiHua[] {
  return starsData
    .filter((s: any) => filterList.includes(s.name))
    .map((s: any) => ({
      name: translateZiwei(s.name),
      sihua: s.siHua ? translateZiwei(s.siHua) : null
    }));
}

export function extractMainStars(chartData: any): ExtractedChart {
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
