import type { ExtractedChart, ExtractedPalace, StarWithSiHua } from "@/lib/ziwei-extractor";
import type { KnowledgeBaseContextEntry } from "@/lib/knowledge-base";
import type { LoveEvidenceTag, LovePalaceRole, LovePalaceSnapshot, LoveStarSignal } from "./types";

interface LoveUserInputJson {
  birthDate: string | null;
  birthTime: string | null;
  gender: string | null;
  location: string | null;
}

interface BuildLoveUserMessageJsonInput {
  userInput: LoveUserInputJson;
  extractedStars: ExtractedChart;
  dictionaryMatches: {
    byStar: KnowledgeBaseContextEntry[];
    byPalace: KnowledgeBaseContextEntry[];
    byFormation: KnowledgeBaseContextEntry[];
    byLoveTag: Record<LoveEvidenceTag, KnowledgeBaseContextEntry[]>;
  };
  periodicFlowText: string;
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

const PALACE_ROLES: Record<string, LovePalaceRole> = {
  "命宮": "life",
  "夫妻": "spouse",
  "福德": "fortune",
  "子女": "children",
  "遷移": "migration",
  "官祿": "career",
  "交友": "friends",
  "父母": "parents",
  "兄弟": "siblings",
};

const OUTPUT_SECTIONS = [
  "연애 한 줄 정의",
  "내가 끌리는 사람 유형",
  "나의 매력 자산",
  "연애 관점으로 본 나의 문제",
  "애정운",
] as const;

const normalizeStars = (stars: StarWithSiHua[] = []): LoveStarSignal[] => (
  stars.map((star) => ({ name: star.name, sihua: star.sihua ?? null }))
);

const normalizePalace = ([key, palace]: [string, ExtractedPalace]): LovePalaceSnapshot => ({
  key,
  label: palace.name || PALACE_LABELS[key] || key,
  role: PALACE_ROLES[key] ?? "other",
  majorStars: normalizeStars(palace.majorStars),
  luckyStars: normalizeStars(palace.luckyStars),
  unluckyStars: normalizeStars(palace.unluckyStars),
  borrowed: palace.borrowed,
});

const compactDictionaryEntry = (entry: KnowledgeBaseContextEntry) => ({
  category: entry.category,
  matchedTerm: entry.matched_term,
  targetSubject: entry.target_subject,
  coreTrait: entry.core_trait,
  careerInsight: entry.career_insight,
  loveInsight: entry.love_insight,
  wellnessInsight: entry.wellness_insight,
  periodicInsight: entry.periodic_insight,
});

export const buildLoveUserMessageJson = ({
  userInput,
  extractedStars,
  dictionaryMatches,
  periodicFlowText,
}: BuildLoveUserMessageJsonInput) => ({
  request: {
    theme: "love",
    outputFormat: "markdown",
    outputSections: OUTPUT_SECTIONS,
    instruction: "시스템 프롬프트의 섹션/문체/금지 규칙을 따르고, 아래 JSON의 chart와 dictionaryMatches만 근거로 사용한다.",
  },
  userInput,
  chart: {
    source: "orrery",
    palaces: Object.entries(extractedStars).map(normalizePalace),
    rawExtractedStars: extractedStars,
  },
  dictionaryMatches: {
    byStar: dictionaryMatches.byStar.map(compactDictionaryEntry),
    byPalace: dictionaryMatches.byPalace.map(compactDictionaryEntry),
    byFormation: dictionaryMatches.byFormation.map(compactDictionaryEntry),
    byLoveTag: Object.fromEntries(
      Object.entries(dictionaryMatches.byLoveTag).map(([tag, entries]) => [
        tag,
        entries.map(compactDictionaryEntry),
      ])
    ),
  },
  timing: {
    periodicFlowText,
  },
});
