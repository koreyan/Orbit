"use server";

import { createClient } from "@/lib/supabase/server";
import { filterThemePalaces, extractStarsForPalace } from "@/lib/ziwei-extractor";
import { fetchKnowledgeBaseForStars } from "@/lib/knowledge-base";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createChart, calculateLiunian } from "@orrery/core/ziwei";

export async function generateReportAction(orderId: string) {
  if (!orderId) throw new Error("No orderId provided");

  const supabase = await createClient();

  // 1. 주문 정보 및 추출된 명반 데이터 가져오기
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("주문 정보를 찾을 수 없습니다.");
  }

  const { theme, saju_data } = order;
  const extractedStars = saju_data?.extracted_stars;

  if (!extractedStars) {
    throw new Error("명반 추출 데이터가 없습니다.");
  }

  // 2. Report 레코드 확인 또는 생성
  const { data: existingReport } = await supabase
    .from("reports")
    .select("id, status")
    .eq("order_id", orderId)
    .single();

  let reportId = existingReport?.id;

  if (!existingReport) {
    const { data: newReport, error: insertError } = await supabase
      .from("reports")
      .insert({
        order_id: orderId,
        status: "generating"
      })
      .select("id")
      .single();

    if (insertError) throw new Error("리포트 생성 실패: " + insertError.message);
    reportId = newReport.id;
  } else if (existingReport.status === "completed") {
    return { success: true, reportId };
  } else {
    await supabase.from("reports").update({ status: "generating" }).eq("id", reportId);
  }

  // 3. 테마에 따른 궁 필터링
  const { lifePalace, themePalaces } = filterThemePalaces(extractedStars, theme);

  // 3-1. 대한(Da Han) 및 유년(Liu Nian) 테마 궁 추출
  let periodicPalacesInfo = "";
  let daHanThemePalaces: any[] = [];
  let liuNianThemePalaces: any[] = [];
  
  try {
    const { date, time, gender } = saju_data;
    if (date && time && gender) {
      const [y, m, d] = date.split("-").map(Number);
      const [h, min] = time.split(":").map(Number);
      const isMale = gender === "M";
      const chartData = createChart(y, m, d, h, min, isMale);
      const currentYear = new Date().getFullYear();
      const liunian = calculateLiunian(chartData, currentYear);

      // 궁위 매핑: 0: 명궁, ..., 8: 관록궁, 4: 재백궁, 2: 부처궁, 6: 천이궁, 5: 질액궁, 10: 복덕궁
      const PALACE_ORDER = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '官祿', '田宅', '福德', '父母'];
      
      let targetOffsets: number[] = [];
      if (theme === 'career') targetOffsets = [8, 4]; // 관록, 재백
      else if (theme === 'love') targetOffsets = [2, 6]; // 부처, 천이
      else if (theme === 'hobby') targetOffsets = [5, 10]; // 질액, 복덕
      else targetOffsets = [8, 4];

      // 대한 테마 궁 찾기 (daxianPalaceName 기준 오프셋)
      const daxianMingIndex = PALACE_ORDER.indexOf(liunian.daxianPalaceName);
      if (daxianMingIndex !== -1) {
        targetOffsets.forEach(offset => {
          const targetName = PALACE_ORDER[(daxianMingIndex + offset) % 12];
          if (extractedStars[targetName]) daHanThemePalaces.push({ name: targetName, ...extractedStars[targetName] });
        });
      }

      // 유년 테마 궁 찾기 (liunian.palaces 기준 지지)
      targetOffsets.forEach(offset => {
        const themePalaceName = PALACE_ORDER[offset]; // 예: '官祿'
        const targetZhi = liunian.palaces[themePalaceName];
        if (targetZhi) {
          // chartData.palaces 값들 중 zhi가 targetZhi인 궁 찾기
          const matchingPalaceEntry = Object.entries(chartData.palaces).find(([_, p]: [string, any]) => p.zhi === targetZhi);
          if (matchingPalaceEntry) {
            const natalPalaceName = matchingPalaceEntry[0];
            if (extractedStars[natalPalaceName]) liuNianThemePalaces.push({ name: natalPalaceName, ...extractedStars[natalPalaceName] });
          }
        }
      });

      periodicPalacesInfo = `
[현재 10년 운(대한) 테마 분석 대상] 나이: ${liunian.daxianAgeStart}~${liunian.daxianAgeEnd}세
- 추출된 대한 테마 궁: ${daHanThemePalaces.map(p => p.name).join(", ")}

[올해(${currentYear}년) 1년 운(유년) 테마 분석 대상]
- 추출된 유년 테마 궁: ${liuNianThemePalaces.map(p => p.name).join(", ")}
`;
    }
  } catch (error) {
    console.error("Failed to extract periodic theme palaces:", error);
  }

  
  // 분석 대상 별 추출 (중복 제거)
  const starsToAnalyze = new Set<string>();
  const addStars = (palace: any) => {
    if (!palace) return;
    if (palace.majorStars) palace.majorStars.forEach((s: any) => {
      starsToAnalyze.add(s.name);
      if (s.sihua) starsToAnalyze.add(s.sihua);
    });
    if (palace.luckyStars) palace.luckyStars.forEach((s: any) => {
      starsToAnalyze.add(s.name);
      if (s.sihua) starsToAnalyze.add(s.sihua);
    });
    if (palace.unluckyStars) palace.unluckyStars.forEach((s: any) => {
      starsToAnalyze.add(s.name);
      if (s.sihua) starsToAnalyze.add(s.sihua);
    });
  };

  addStars(lifePalace);
  themePalaces.forEach((p: any) => addStars(p));
  daHanThemePalaces.forEach(p => addStars(p));
  liuNianThemePalaces.forEach(p => addStars(p));

  // 4. 지식베이스 (Ground Truth) 로드
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const knowledgeBase = await fetchKnowledgeBaseForStars(adminClient, Array.from(starsToAnalyze));

  // 5. 프롬프트 생성
  const systemPrompt = `
당신은 트렌디하고 통찰력 있는 최고의 성향 분석가이자 라이프 코치입니다. 당신의 목표는 유저의 명리학 데이터를 기반으로 마치 MBTI나 심리 테스트 결과지처럼 직관적이고 유쾌한, 그러면서도 뼈를 때리는 정확한 리포트를 작성하는 것입니다.

[절대 지켜야 할 철칙 - 위반 시 실패]
1. "자미두수", "명궁", "관록궁", "재백궁", "주성", "살성", "화기", "차성안궁" 등 모든 명리학적 전문 용어와 한자어의 출력을 100% 절대 금지합니다.
2. 유저의 데이터에 있는 "태양성", "천동성" 같은 별 이름도 직접 언급하지 마세요. 대신 그 별이 가진 "기질(예: 따뜻한 오지라퍼, 타고난 리더)"로 완벽히 치환하여 설명하세요.
3. 제공된 보조성(길성/흉성)과 사화 에너지를 분석에 녹여내어, 단점도 긍정적이고 건설적인 방향으로 승화할 수 있도록 조언하세요.

다음 JSON 스키마를 엄격히 준수하여 응답하세요. 다른 텍스트는 출력하지 마세요.
{
  "teaser_quote": "마치 MBTI 결과처럼 직관적이고 톡톡 튀는 한 줄 요약 (예: '따뜻한 오지라퍼이자 타고난 리더!')",
  "core_trait": "어려운 말 없이, 유저의 타고난 본질과 장점, 매력을 친구에게 칭찬하듯 설명하는 3~4문단",
  "theme_insight": "유저가 선택한 테마(커리어/연애/여가)에 맞춰, 유저의 기질을 실생활과 직장에 바로 써먹을 수 있는 구체적이고 현실적인 액션 플랜 (3~4문단)",
  "periodic_insight": "함께 제공된 [현재 10년 운]과 [올해의 1년 운] 테마 데이터를 바탕으로, 내년까지 유저에게 펼쳐질 기회와 피해야 할 리스크를 날씨에 비유하여 설명하는 아주 구체적인 시기별 예측 (2~3문단)"
}
`;

  const formatPalaceStars = (palace: any) => {
    if (!palace) return "데이터 없음";
    const major = palace.majorStars?.map((s: any) => `${s.name}${s.sihua ? `[${s.sihua}]` : ''}`).join(", ") || "";
    const lucky = palace.luckyStars?.map((s: any) => `${s.name}${s.sihua ? `[${s.sihua}]` : ''}`).join(", ") || "";
    const unlucky = palace.unluckyStars?.map((s: any) => `${s.name}${s.sihua ? `[${s.sihua}]` : ''}`).join(", ") || "";
    return `핵심 에너지: [${major || '비어있음'}], 보조 에너지: [${lucky || '없음'}], 주의할 에너지: [${unlucky || '없음'}]`;
  };

  const userContext = `
선택한 테마: ${theme}

[유저의 기질 및 운세 데이터 (절대 이 용어들을 결과에 직접 노출하지 말 것)]
- 타고난 본질: ${formatPalaceStars(lifePalace)}
- 테마별 행동 방식: ${themePalaces.map((p: any) => `${p.name} 환경: ${formatPalaceStars(p)}`).join(" | ")}

${periodicPalacesInfo}

[지식베이스 (Ground Truth)]
${Object.entries(knowledgeBase).map(([star, insight]) => `
별 이름: ${star}
- 본질적 성향: ${insight.core_trait}
- 커리어 방향성: ${insight.career_insight}
- 연애/관계성: ${insight.love_insight}
- 웰니스/여가: ${insight.wellness_insight}
- 시기별 조언: ${insight.periodic_insight}
`).join("\n")}
`;

  // 6. Gemini API 호출
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // 최신 모델 사용
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userContext }
    ]);

    const responseText = result.response.text();
    const parsedContent = JSON.parse(responseText);

    // 7. 결과 저장
    await adminClient.from("reports").update({
      content: parsedContent,
      status: "completed",
      generated_at: new Date().toISOString()
    }).eq("id", reportId);

    return { success: true, reportId };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    await adminClient.from("reports").update({ status: "failed" }).eq("id", reportId);
    throw new Error("리포트 생성에 실패했습니다.");
  }
}
