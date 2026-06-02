import { translateZiwei } from "./ziwei-translator";

const MAJOR_STARS = [
  '紫微', '天機', '太陽', '武曲', '天同', '廉貞',
  '天府', '太陰', '貪狼', '巨門', '天相', '天梁',
  '七殺', '破軍'
];

export interface ExtractedPalace {
  name: string;
  stars: string[];
  borrowed: boolean;
}

export type ExtractedChart = Record<string, ExtractedPalace>;

export function extractMainStars(chartData: any): ExtractedChart {
  const palaces = chartData.palaces;
  if (!palaces) throw new Error("Invalid chart data");

  // 12궁 배열 추출 (orrery/core는 palaces가 객체로 내려옴)
  const palaceKeys = [
    '命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄',
    '遷移', '交友', '官祿', '田宅', '福德', '父母'
  ];

  const extracted: ExtractedChart = {};

  palaceKeys.forEach((key, index) => {
    const palace = palaces[key];
    if (!palace) return;

    let primaryStars = palace.stars
      .filter((s: any) => MAJOR_STARS.includes(s.name))
      .map((s: any) => translateZiwei(s.name));
    
    let borrowed = false;

    // 무주성(빈 궁)인 경우, 차성안궁 (대궁에서 빌려오기)
    if (primaryStars.length === 0) {
      // 대궁은 6칸 떨어져 있음
      const oppositeIndex = (index + 6) % 12;
      const oppositeKey = palaceKeys[oppositeIndex];
      const oppositePalace = palaces[oppositeKey];

      if (oppositePalace) {
        primaryStars = oppositePalace.stars
          .filter((s: any) => MAJOR_STARS.includes(s.name))
          .map((s: any) => translateZiwei(s.name));
        borrowed = true;
      }
    }

    extracted[key] = {
      name: translateZiwei(key),
      stars: primaryStars,
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
      themePalaces = [extracted['夫妻'], extracted['遷移']]; // 부처궁, 천이궁
      break;
    case 'hobby':
      themePalaces = [extracted['疾厄'], extracted['福德']]; // 질액궁, 복덕궁
      break;
    default:
      themePalaces = [extracted['官祿'], extracted['財帛']];
  }

  // 필터링된 배열에서 undefined 제거
  themePalaces = themePalaces.filter(Boolean);

  return {
    lifePalace,
    themePalaces
  };
}
