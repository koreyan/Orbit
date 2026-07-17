import type { ExtractedChart, ExtractedPalace, StarWithSiHua } from "@/lib/ziwei-extractor";
import type { LovePalaceRole, LovePalaceSnapshot, LoveStarSignal } from "./types";
import { translatePalace, translateStar, translateSihua as translateSihuaTerm, translateCategory } from "./term-translator";

interface LoveUserInputJson {
  birthDate: string | null;
  birthTime: string | null;
  gender: string | null;
  location: string | null;
}

import type { DatingDatabaseMatches } from "./love-data-extractor";

interface BuildLoveUserMessageJsonInput {
  userInput: LoveUserInputJson;
  extractedStars: ExtractedChart;
  periodicFlowText: string;
  datingDatabaseMatches: DatingDatabaseMatches;
}

const PALACE_LABELS: Record<string, string> = {
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

/** 연애 테마에서 실제 분석에 사용하는 궁위만 정의 */
export const LOVE_RELEVANT_PALACES: ReadonlySet<string> = new Set([
  "命宮",  // 명궁
  "夫妻",  // 부처궁
  "福德",  // 복덕궁
  "子女",  // 자녀궁
  "遷移",  // 천이궁
  "官祿",  // 관록궁
]);

const PALACE_ROLES: Record<string, LovePalaceRole> = {
  "命宮": "life",
  "夫妻": "spouse",
  "福德": "fortune",
  "子女": "children",
  "遷移": "migration",
  "官祿": "career",
};

const OUTPUT_SECTIONS = [
  "1. 나는 어떤 사람을 좋아하는가",
  "2. 나는 연애 할 때 어떤 성향인가",
  "3. 나의 매력 자산은 무엇인가",
  "4. 연애 관점에서 나의 문제란 무엇인가",
  "5. 앞으로 다가올 연애 기회",
] as const;

const normalizeStars = (stars: StarWithSiHua[] = []): LoveStarSignal[] => (
  stars.map((star) => ({ name: translateStar(star.name), sihua: star.sihua ? translateSihuaTerm(star.sihua) : null }))
);

const normalizePalace = ([key, palace]: [string, ExtractedPalace]): LovePalaceSnapshot => ({
  key,
  label: translatePalace(palace.name || PALACE_LABELS[key] || key),
  role: PALACE_ROLES[key] ?? "other",
  majorStars: normalizeStars(palace.majorStars),
  luckyStars: normalizeStars(palace.luckyStars),
  unluckyStars: normalizeStars(palace.unluckyStars),
  borrowed: palace.borrowed,
});



export const buildLoveUserMessageJson = ({
  userInput,
  extractedStars,
  periodicFlowText,
  datingDatabaseMatches,
}: BuildLoveUserMessageJsonInput) => {
  const lovePalaces = Object.entries(extractedStars)
    .filter(([key]) => LOVE_RELEVANT_PALACES.has(key))
    .map(normalizePalace);

  // chartSummaryText: 치환된 궁위명/별명/사화명으로 빌드
  const chartSummaryText = lovePalaces.map((p) => {
    const formatStar = (s: LoveStarSignal): string =>
      s.sihua ? `${s.name} + ${s.sihua}` : s.name;
    const major = p.majorStars.map(formatStar).join(', ') || '없음';
    const lucky = p.luckyStars.map(formatStar).join(', ') || '없음';
    const unlucky = p.unluckyStars.map(formatStar).join(', ') || '없음';
    return `- ${p.label}: [${translateCategory('주성')}] ${major} / [${translateCategory('길성')}] ${lucky} / [${translateCategory('살성')}] ${unlucky}`;
  }).join('\n');

  const requiredMonthlyFlowMonths = datingDatabaseMatches.loveLuck.requiredMonthlyFlowMonths;

  return {
    request: {
      theme: "love",
      outputFormat: "markdown",
      outputSections: OUTPUT_SECTIONS,
      instruction: "시스템 프롬프트의 섹션/문체/금지 규칙을 따르고, 아래 JSON의 datingDatabaseMatches를 메인 분석 자료로 삼고 chartSummaryText를 보조 분석 근거로 사용한다.",
    },
    userInput,
    chartSummaryText,
    chart: {
      source: "orrery",
      palaces: lovePalaces,
    },
    datingDatabaseMatches,
    timing: {
      monthlyFlowRule: {
        timezone: "Asia/Seoul",
        startMonthInclusive: datingDatabaseMatches.loveLuck.monthlyFlowStartMonth,
        requiredMonths: requiredMonthlyFlowMonths,
        instruction: `올해 연애운 월별 박스는 ${requiredMonthlyFlowMonths.join(", ")}월을 모두 포함해야 하며 첫 박스는 ${requiredMonthlyFlowMonths[0] ?? "현재"}월이어야 한다. 현재 월을 건너뛰고 다음 달부터 시작하지 않는다.`,
      },
      periodicFlowText,
    },
  };
};
