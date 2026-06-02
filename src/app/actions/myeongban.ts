"use server";

import { createClient } from "@/lib/supabase/server";
import { createChart, getDaxianList, calculateLiunian } from "@orrery/core/ziwei";
import { translateZiwei } from "@/lib/ziwei-translator";

// 14 정성 (주성) 한자 목록
const MAJOR_STARS = [
  '紫微', '天機', '太陽', '武曲', '天同', '廉貞',
  '天府', '太陰', '貪狼', '巨門', '天相', '天梁',
  '七殺', '破軍'
];

export async function getMyeongbanAction(params: {
  date: string;
  time: string;
  gender: string;
  location: string;
}) {
  const { date, time, gender } = params;

  if (!date || !time || !gender) {
    throw new Error("필수 데이터가 누락되었습니다.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const isMale = gender === "M";

  // 1. 명반 계산
  let chartData;
  let daxianList;
  let currentLiunian;
  try {
    chartData = createChart(year, month, day, hour, minute, isMale);
    daxianList = getDaxianList(chartData);
    currentLiunian = calculateLiunian(chartData, new Date().getFullYear());
  } catch (error) {
    console.error("Chart generation error:", error);
    throw new Error("명반 데이터를 생성하는 중 오류가 발생했습니다.");
  }

  // 2. 명궁의 주성 찾기
  const lifePalace = chartData.palaces['命宮'];
  let primaryStars = lifePalace.stars.filter((s: any) => MAJOR_STARS.includes(s.name));

  // 3. 명궁에 주성이 없다면 천이궁의 주성 차용
  let borrowed = false;
  if (primaryStars.length === 0) {
    const qianYiPalace = chartData.palaces['遷移'];
    primaryStars = qianYiPalace.stars.filter((s: any) => MAJOR_STARS.includes(s.name));
    borrowed = true;
  }

  // 주성들의 한국어 이름 추출
  const primaryStarNames = primaryStars.map((s: any) => translateZiwei(s.name));

  // 4. 지식베이스에서 해설 검색
  let coreTrait = "매우 특별하고 흥미로운 성향을 가지고 있습니다.";
  
  if (primaryStarNames.length > 0) {
    try {
      const supabase = await createClient();
      
      // 첫 번째 주성의 이름(예: '염정')으로 지식베이스의 target_subject 검색
      const starName = primaryStarNames[0];
      
      const { data, error } = await supabase
        .from('z_knowledge_base')
        .select('target_subject, core_trait')
        .eq('category', 'star')
        .ilike('target_subject', `%${starName}%`);

      if (!error && data && data.length > 0) {
        const exactMatch = data.find(d => d.target_subject.startsWith(`${starName}성`)) || data[0];
        coreTrait = exactMatch.core_trait;
      } else if (error) {
        console.warn(`Error fetching knowledge base entry for ${starName}:`, error.message);
      }
    } catch (e) {
      console.warn('DB fetch failed', e);
    }
  }

  return {
    chartData,
    daxianList,
    currentLiunian,
    interpretation: {
      primaryStars: primaryStarNames,
      borrowed,
      coreTrait
    }
  };
}
