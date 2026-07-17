import { createChart, getDaxianList, calculateLiunian } from "@orrery/core/ziwei";

import { createClient } from "@/lib/supabase/server";
import { translateZiwei } from "@/lib/ziwei-translator";
import type { DaxianItem, LiunianData, ResultInterpretation, ZiweiChart } from "@/lib/ziwei-types";

const MAJOR_STARS = [
  "紫微", "天機", "太陽", "武曲", "天同", "廉貞",
  "天府", "太陰", "貪狼", "巨門", "天相", "天梁",
  "七殺", "破軍",
];

export interface MyeongbanParams {
  date: string;
  time: string;
  gender: string;
  location: string;
}

export interface MyeongbanResult {
  chartData: ZiweiChart;
  daxianList: DaxianItem[];
  currentLiunian: LiunianData;
  interpretation: ResultInterpretation;
}

export const getMyeongban = async (params: MyeongbanParams): Promise<MyeongbanResult> => {
  const { date, time, gender } = params;

  if (!date || !time || !gender) {
    throw new Error("필수 데이터가 누락되었습니다.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const isMale = gender === "M";

  let chartData: ZiweiChart;
  let daxianList: DaxianItem[];
  let currentLiunian: LiunianData;

  try {
    chartData = createChart(year, month, day, hour, minute, isMale) as ZiweiChart;
    daxianList = getDaxianList(chartData) as DaxianItem[];
    currentLiunian = calculateLiunian(chartData, new Date().getFullYear()) as LiunianData;
  } catch (error) {
    console.error("Chart generation error:", error);
    throw new Error("명반 데이터를 생성하는 중 오류가 발생했습니다.");
  }

  const lifePalace = chartData.palaces["命宮"];
  let primaryStars = lifePalace.stars.filter((star) => MAJOR_STARS.includes(star.name));
  let borrowed = false;

  if (primaryStars.length === 0) {
    const qianYiPalace = chartData.palaces["遷移"];
    primaryStars = qianYiPalace.stars.filter((star) => MAJOR_STARS.includes(star.name));
    borrowed = true;
  }

  const primaryStarNames = primaryStars.map((star) => translateZiwei(star.name));
  let coreTrait = "매우 특별하고 흥미로운 성향을 가지고 있습니다.";

  if (primaryStarNames.length > 0) {
    try {
      const supabase = await createClient();
      const starName = primaryStarNames[0];
      const { data, error } = await supabase
        .from("z_knowledge_base")
        .select("target_subject, core_trait")
        .eq("category", "star")
        .ilike("target_subject", `%${starName}%`);

      if (!error && data && data.length > 0) {
        const exactMatch = data.find((entry) => entry.target_subject.startsWith(`${starName}성`)) || data[0];
        coreTrait = exactMatch.core_trait;
      } else if (error) {
        console.warn(`Error fetching knowledge base entry for ${starName}:`, error.message);
      }
    } catch (error) {
      console.warn("DB fetch failed", error);
    }
  }

  return {
    chartData,
    daxianList,
    currentLiunian,
    interpretation: {
      primaryStars: primaryStarNames,
      borrowed,
      coreTrait,
    },
  };
};
