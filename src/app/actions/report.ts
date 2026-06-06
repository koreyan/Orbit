"use server";

import { createClient } from "@/lib/supabase/server";
import { filterThemePalaces, findLuStarPalaces } from "@/lib/ziwei-extractor";
import { fetchKnowledgeBaseForStars } from "@/lib/knowledge-base";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendTelegramNotification } from "@/lib/telegram";
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

      // 궁위 매핑: 0: 명궁, 2: 부처궁, 3: 자녀궁, 4: 재백궁, 5: 질액궁, 6: 천이궁, 8: 관록궁, 10: 복덕궁
      const PALACE_ORDER = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '官祿', '田宅', '福德', '父母'];
      
      let targetOffsets: number[] = [];
      if (theme === 'career') targetOffsets = [8, 4]; // 관록, 재백
      else if (theme === 'love') targetOffsets = [2, 6, 3]; // 부처, 천이, 자녀
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
        const themePalaceName = PALACE_ORDER[offset];
        const targetZhi = liunian.palaces[themePalaceName];
        if (targetZhi) {
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

  // 4. 커리어 테마 전용: 화록/록존이 위치한 궁(금광) 동적 탐색
  let luStarPalacesInfo = "";
  if (theme === 'career') {
    const luPalaces = findLuStarPalaces(extractedStars);
    if (luPalaces.length > 0) {
      luPalaces.forEach(p => addStars(p));
      luStarPalacesInfo = `
[숨겨진 금광 위치 (록존/화록이 위치한 궁)] - 이 정보는 유저의 실질적 수익 파이프라인을 의미합니다.
${luPalaces.map(p => `- ${p.name}궁: ${formatPalaceStars(p)}`).join("\n")}
`;
    }
  }

  // 5. 지식베이스 (Ground Truth) 로드
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const knowledgeBase = await fetchKnowledgeBaseForStars(adminClient, Array.from(starsToAnalyze));

  // 6. 테마별 맞춤형 시스템 프롬프트 생성
  const commonRules = `
[절대 지켜야 할 철칙 - 위반 시 실패]
1. "자미두수", "명궁", "관록궁", "재백궁", "주성", "살성", "화기", "차성안궁" 등 모든 명리학적 전문 용어와 한자어의 출력을 100% 절대 금지합니다.
2. 유저의 데이터에 있는 "태양성", "천동성" 같은 별 이름도 직접 언급하지 마세요. 대신 그 별이 가진 "기질(예: 따뜻한 오지라퍼, 타고난 리더)"로 완벽히 치환하여 설명하세요.
3. 제공된 보조성(길성/흉성)과 사화 에너지를 분석에 녹여내어, 단점도 긍정적이고 건설적인 방향으로 승화할 수 있도록 조언하세요.

다음 JSON 스키마를 엄격히 준수하여 응답하세요. 다른 텍스트는 출력하지 마세요.
{
  "teaser_quote": "마치 MBTI 결과처럼 직관적이고 톡톡 튀는 한 줄 요약",
  "core_trait": "유저의 타고난 본질과 장점, 매력을 친구에게 칭찬하듯 설명하는 3~4문단",
  "theme_insight": "테마에 맞춘 구체적이고 현실적인 액션 플랜 (3~4문단)",
  "periodic_insight": "[현재 10년 운]과 [올해의 1년 운] 데이터를 바탕으로 날씨에 비유한 구체적인 시기별 예측 (2~3문단)"
}`;

  const themePromptMap: Record<string, string> = {
    career: `
당신은 실용적인 커리어 전략가이자 비즈니스 모델 컨설턴트입니다. 유저의 명리학 데이터를 기반으로 MBTI 결과지처럼 직관적이고 뼈를 때리는 커리어 리포트를 작성합니다.

[커리어 테마 특수 지침]
1. core_trait에서는 유저의 타고난 업무 스타일, 리더십 유형, 재물을 다루는 감각을 설명하세요.
2. theme_insight에서는 반드시 아래 두 가지를 포함하세요:
   a) 나의 최적화된 업무 스탠스: 관록궁/재백궁 데이터 기반으로 어떤 환경에서 능력을 극대화하는지.
   b) 나만의 숨겨진 금광: [숨겨진 금광 위치] 데이터가 있다면 그것을 바탕으로, "당신의 진짜 돈은 OOO에서 나옵니다"라고 구체적인 타겟 시장이나 비즈니스 모델(예: 대중/팬덤 기반, 부동산/공간 기반, 대기업/기관 기반, 콘텐츠/교육 기반 등)을 제시하세요.
3. periodic_insight에서는 올해의 커리어 기회와 리스크를 날씨에 비유하여 구체적으로 설명하세요.
${commonRules}`,

    love: `
당신은 현대적이고 트렌디한 관계 심리 분석가이자 매력 컨설턴트입니다. 유저의 명리학 데이터를 기반으로 MBTI 결과지처럼 직관적이고 뼈를 때리는 연애/매력 리포트를 작성합니다.

[연애/관계 테마 특수 지침]
1. core_trait에서는 유저가 사랑에 빠졌을 때의 모습, 관계에서의 장점과 매력 포인트를 설명하세요.
2. theme_insight에서는 반드시 아래 두 가지를 포함하세요:
   a) 내가 끌리는 관계의 형태: 부처궁 데이터 기반으로 어떤 타입에 끌리며, 연애에서 어떤 태도를 보이는지.
   b) 나의 숨겨진 본능적 매력 자산: 자녀궁 데이터("본능적 매력 자산"이라고 라벨된 데이터)를 기반으로, 타인을 본능적으로 끌어당기는 숨겨진 도화 매력, 플러팅 스타일, 성적 어필 포인트를 구체적으로 설명하세요.
3. periodic_insight에서는 올해의 연애 기회와 주의할 점을 날씨에 비유하여 구체적으로 설명하세요.
${commonRules}`,

    hobby: `
당신은 현대인의 라이프스타일 큐레이터이자 멘탈케어 전문가입니다. 유저의 명리학 데이터를 기반으로 MBTI 결과지처럼 직관적이고 뼈를 때리는 웰니스/여가 리포트를 작성합니다.

[여가/웰니스 테마 특수 지침]
1. core_trait에서는 유저가 스트레스를 받는 지점과 에너지를 충전하는 방식, 타고난 체질적 특성을 설명하세요.
2. theme_insight에서는 반드시 아래 두 가지를 포함하세요:
   a) 나의 육체적 에너지와 관리법: 질액궁 데이터 기반으로 신체적으로 취약해지기 쉬운 포인트와 에너지 관리 팁.
   b) 나의 멘탈케어와 맞춤형 취미: 복덕궁 데이터 기반으로 어떤 취미나 여가 활동이 진정한 내면의 평화와 만족도를 가져다주는지 구체적으로 큐레이션하세요.
3. periodic_insight에서는 올해의 건강 리듬과 멘탈 관리 포인트를 날씨에 비유하여 구체적으로 설명하세요.
${commonRules}`
  };

  const systemPrompt = themePromptMap[theme] || themePromptMap['career'];

  // 6-1. 테마별 특수 컨텍스트 생성
  let themeSpecificContext = "";
  if (theme === 'love') {
    // 자녀궁 데이터를 '본능적 매력 자산'으로 라벨링하여 AI에게 전달
    const childrenPalace = extractedStars['子女'];
    if (childrenPalace) {
      themeSpecificContext = `
[나의 본능적 매력 자산 (도화/플러팅 스타일 분석용)] - 이 데이터는 타인을 본능적으로 끌어당기는 숨겨진 매력을 의미합니다.
- ${childrenPalace.name}궁 환경: ${formatPalaceStars(childrenPalace)}
`;
    }
  } else if (theme === 'career') {
    themeSpecificContext = luStarPalacesInfo;
  }

  const userContext = `
선택한 테마: ${theme}

[유저의 기질 및 운세 데이터 (절대 이 용어들을 결과에 직접 노출하지 말 것)]
- 타고난 본질: ${formatPalaceStars(lifePalace)}
- 테마별 행동 방식: ${themePalaces.map((p: any) => `${p.name} 환경: ${formatPalaceStars(p)}`).join(" | ")}
${themeSpecificContext}
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

  // 7. Gemini API 호출 및 자가복구(Retry) 로직
  const MAX_RETRIES = 5;
  let attempt = 0;
  let success = false;
  let parsedContent = null;

  // E2E 테스트용 모킹 분기
  if (order.saju_data?.e2e_mock_gemini?.startsWith('success_prompt')) {
    if (process.env.NODE_ENV !== "production") {
      try {
        const fs = require('fs');
        const path = require('path');
        fs.writeFileSync(
          path.join(process.cwd(), ".gemini_mock.log"), 
          JSON.stringify({ systemPrompt, userContext }, null, 2)
        );
      } catch (e) {
        // ignore
      }
    }
    parsedContent = {
      teaser_quote: `Mock Teaser for ${theme}`,
      core_trait: "Mock Core Trait",
      theme_insight: "Mock Theme Insight",
      periodic_insight: "Mock Periodic Insight"
    };
    success = true;
  }

  while (attempt < MAX_RETRIES && !success) {
    try {
      attempt++;

      // E2E 테스트용 재시도/실패 모킹
      if (order.saju_data?.e2e_mock_gemini === 'fail_retry_success') {
        if (attempt < 4) {
          throw new Error(`Simulated AI Error (Attempt ${attempt})`);
        } else {
          parsedContent = {
            teaser_quote: "Recovered",
            core_trait: "Recovered successfully",
            theme_insight: "Recovered insight",
            periodic_insight: "Recovered periodic"
          };
          success = true;
          continue;
        }
      } else if (order.saju_data?.e2e_mock_gemini === 'fail_max_retries') {
        throw new Error(`Simulated Permanent AI Error (Attempt ${attempt})`);
      }

      console.log(`Gemini API 호출 시도 (${attempt}/${MAX_RETRIES})...`);
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userContext }
      ]);

      const responseText = result.response.text();
      parsedContent = JSON.parse(responseText);
      success = true; // 성공 시 루프 탈출
    } catch (error) {
      console.error(`Gemini API 호출 실패 (시도 ${attempt}):`, error);
      if (attempt >= MAX_RETRIES) {
        await adminClient.from("reports").update({ status: "failed" }).eq("id", reportId);
        // 텔레그램 알림: 리포트 생성 실패
        await sendTelegramNotification(`❌ <b>[리포트 생성 실패]</b>\n주문번호: <code>${reportId}</code>\n사유: Gemini API 최대 재시도 횟수 초과\n에러: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
        throw new Error("리포트 생성에 실패했습니다. (최대 재시도 횟수 초과)");
      }
      // 재시도 전 1.5초 대기 (백오프)
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  // 8. 결과 저장
  if (success && parsedContent) {
    await adminClient.from("reports").update({
      content: parsedContent,
      status: "completed",
      generated_at: new Date().toISOString()
    }).eq("id", reportId);

    // 텔레그램 알림: 리포트 생성 성공
    await sendTelegramNotification(`✨ <b>[리포트 생성 완료]</b>\n주문번호: <code>${reportId}</code>\nAI가 성공적으로 별빛 이야기를 해독했습니다!`);

    return { success: true, reportId };
  }
}

/** 궁에 배속된 별 정보를 포맷팅하는 유틸 함수 */
function formatPalaceStars(palace: any): string {
  if (!palace) return "데이터 없음";
  const major = palace.majorStars?.map((s: any) => `${s.name}${s.sihua ? `[${s.sihua}]` : ''}`).join(", ") || "";
  const lucky = palace.luckyStars?.map((s: any) => `${s.name}${s.sihua ? `[${s.sihua}]` : ''}`).join(", ") || "";
  const unlucky = palace.unluckyStars?.map((s: any) => `${s.name}${s.sihua ? `[${s.sihua}]` : ''}`).join(", ") || "";
  return `핵심 에너지: [${major || '비어있음'}], 보조 에너지: [${lucky || '없음'}], 주의할 에너지: [${unlucky || '없음'}]`;
}

export async function makeReportPublic(orderId: string) {
  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { success: false, error: "Unauthorized" };

  // Verify ownership
  const { data: order } = await supabase.from("orders").select("user_id").eq("id", orderId).single();
  if (!order || order.user_id !== userData.user.id) return { success: false, error: "Forbidden" };

  // Update using adminClient to bypass RLS for the update itself
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.from("reports").update({ is_public: true }).eq("order_id", orderId);
  if (error) {
    console.error("makeReportPublic error:", error);
    return { success: false, error: "Update failed" };
  }

  return { success: true };
}
