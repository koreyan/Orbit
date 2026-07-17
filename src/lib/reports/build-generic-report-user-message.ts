import type { ExtractedChart, ExtractedPalace } from "@/lib/ziwei-extractor";

interface KnowledgeBaseEntry {
  target_subject?: string;
  core_trait?: string;
  career_insight?: string;
  love_insight?: string;
  wellness_insight?: string;
  periodic_insight?: string;
}

interface BuildGenericReportUserMessageJsonParams {
  theme: string;
  sajuData: Record<string, unknown>;
  extractedStars: ExtractedChart;
  lifePalace: ExtractedPalace | null | undefined;
  themePalaces: ExtractedPalace[];
  knowledgeBase: Record<string, KnowledgeBaseEntry>;
  themeSpecificContext: string;
  periodicPalacesInfo: string;
}

export const buildGenericReportUserMessageJson = ({
  theme,
  sajuData,
  extractedStars,
  lifePalace,
  themePalaces,
  knowledgeBase,
  themeSpecificContext,
  periodicPalacesInfo,
}: BuildGenericReportUserMessageJsonParams) => ({
  request: {
    theme,
    outputFormat: theme === "hobby" ? "json" : "markdown",
  },
  userInput: {
    birthDate: typeof sajuData.date === "string" ? sajuData.date : null,
    birthTime: typeof sajuData.time === "string" ? sajuData.time : null,
    gender: typeof sajuData.gender === "string" ? (sajuData.gender === "M" ? "남성" : sajuData.gender === "F" ? "여성" : sajuData.gender) : null,
    location: typeof sajuData.location === "string" ? sajuData.location : null,
  },
  chart: {
    source: "orrery",
    lifePalace,
    themePalaces,
    rawExtractedStars: extractedStars,
  },
  dictionaryMatches: {
    byStar: Object.entries(knowledgeBase).map(([matchedTerm, entry]) => ({
      matchedTerm,
      targetSubject: entry.target_subject,
      coreTrait: entry.core_trait,
      careerInsight: entry.career_insight,
      loveInsight: entry.love_insight,
      wellnessInsight: entry.wellness_insight,
      periodicInsight: entry.periodic_insight,
    })),
  },
  themeSpecificContext,
  timing: {
    periodicFlowText: periodicPalacesInfo,
  },
});
