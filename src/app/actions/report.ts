"use server";

import { createClient } from "@/lib/supabase/server";
import { filterThemePalaces } from "@/lib/ziwei-extractor";
import { fetchKnowledgeBaseForStars } from "@/lib/knowledge-base";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateReportAction(orderId: string) {
  if (!orderId) throw new Error("No orderId provided");

  const supabase = await createClient(); // 유저 세션 확인

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
    // 이미 완료된 리포트면 스킵
    return { success: true, reportId };
  } else {
    // 다시 generating 상태로 업데이트
    await supabase.from("reports").update({ status: "generating" }).eq("id", reportId);
  }

  // 3. 테마에 따른 궁 필터링
  const { lifePalace, themePalaces } = filterThemePalaces(extractedStars, theme);
  
  // 분석 대상 주성 추출 (중복 제거)
  const starsToAnalyze = new Set<string>();
  lifePalace.stars.forEach(s => starsToAnalyze.add(s));
  themePalaces.forEach(p => p.stars.forEach(s => starsToAnalyze.add(s)));

  // 4. 지식베이스 (Ground Truth) 로드
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const knowledgeBase = await fetchKnowledgeBaseForStars(adminClient, Array.from(starsToAnalyze));

  // 5. 프롬프트 생성
  const systemPrompt = `
당신은 세계 최고의 자미두수 명리학 마스터이자 심리 상담가입니다. 따뜻하고 우아하며 현대적인 한국어로 유저의 강점과 잠재력을 응원하는 톤앤매너를 유지하세요. 제공된 지식베이스(Knowledge Base)의 의미를 절대 왜곡하지 말고, 이를 유저의 상황에 맞게 유려한 스토리텔링으로 엮어내야 합니다.

다음 JSON 스키마를 엄격히 준수하여 응답하세요. 다른 텍스트는 출력하지 마세요.
{
  "teaser_quote": "30자 이내의 강력한 훅 문구 (예: 타고난 기획자! 하지만 완벽주의가 당신을 피곤하게 할 수 있습니다.)",
  "core_trait": "명궁 기반의 본질적 성향 분석 (3~4문단)",
  "theme_insight": "선택한 테마(커리어/연애/여가)에 맞춘 심층 분석 (3~4문단)",
  "periodic_insight": "향후 1~2년의 운세 흐름과 구체적 액션 플랜 (2문단)"
}
`;

  const userContext = `
선택한 테마: ${theme}

[유저의 자미두수 궁(Palace) 데이터]
- 명궁 (나의 본질): ${lifePalace.stars.join(", ") || "무주성 (대궁 차용됨)"}
- 테마 관련 궁: ${themePalaces.map(p => `${p.name}: ${p.stars.join(", ")}`).join(" | ")}

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
