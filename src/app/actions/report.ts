"use server";

import { revalidatePath } from "next/cache";
import * as fs from "fs";
import * as path from "path";
import { filterThemePalaces, findLokJonPalace, findSiHuaPalaces } from "@/lib/ziwei-extractor";
import type { ExtractedChart, ExtractedPalace, StarWithSiHua } from "@/lib/ziwei-extractor";
import { getOpenAiApiKey } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchKnowledgeBaseForStars } from "@/lib/knowledge-base";
import { buildLoveUserMessageJson } from "@/lib/report-prompts/love-context";
import { getCurrentKoreanMonth, getMonthlyFlowMonths } from "@/lib/report-prompts/love-month-flow";
import { extractDatingDatabaseMatches, loadLoveConfigs } from "@/lib/report-prompts/love-data-extractor";
import { sanitizeTerminology } from "@/lib/report-prompts/term-translator";
import { sendTelegramNotification } from "@/lib/telegram";
import { buildGenericReportUserMessageJson } from "@/lib/reports/build-generic-report-user-message";
import { cleanMarkdown, stripLoveTipSection } from "@/lib/reports/report-markdown";
import { assertReportGenerationUpdateApplied, buildReportFailureNotification } from "@/lib/reports/report-generation-result";
import OpenAI from "openai";
import { createChart, calculateLiunian } from "@orrery/core/ziwei";

interface RuntimeChartPalace {
  zhi: string;
}

interface RuntimeChartData {
  palaces: Record<string, RuntimeChartPalace>;
  shenGongZhi: string;
}

interface RuntimeLiunianData {
  year?: number;
  age?: number;
  daxianPalaceName: string;
  daxianAgeStart: number;
  daxianAgeEnd: number;
  palaces: Record<string, string>;
  liuyue: { month: number; mingGongZhi: string; natalPalaceName: string }[];
}

const asRuntimeChartData = (value: unknown): RuntimeChartData => value as RuntimeChartData;
const asRuntimeLiunianData = (value: unknown): RuntimeLiunianData => value as RuntimeLiunianData;


export async function generateReportAction(orderId: string) {
  if (!orderId) throw new Error("No orderId provided");

  console.log("[OBIT DEBUG 1] generateReportAction started. orderId:", orderId);

  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData?.user?.id;
  console.log("[OBIT DEBUG 2] Auth check complete. currentUserId:", currentUserId);

  const adminClient = createSupabaseAdminClient();

  // 1. 주문 정보 가져오기 (adminClient로 가져와서 권한 체크 수행)
  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("주문 정보를 찾을 수 없습니다.");
  }
  console.log("[OBIT DEBUG 3] Order fetched. Theme:", order.theme);

  // 관리자 여부 확인
  let isAdmin = false;
  if (currentUserId) {
    const { data: dbUser } = await adminClient.from("users").select("role").eq("id", currentUserId).single();
    isAdmin = dbUser?.role === 'admin';
  }

  // 본인 주문이 아니고 관리자도 아니면 차단 (보안)
  if (order.user_id !== currentUserId && !isAdmin) {
    throw new Error("접근 권한이 없습니다.");
  }

  const { theme, saju_data } = order;

  // 2. Report 레코드 확인 또는 생성
  const { data: existingReport } = await adminClient
    .from("reports")
    .select("id, status")
    .eq("order_id", orderId)
    .single();

  let reportId = existingReport?.id;

  if (!existingReport) {
    const { data: newReport, error: insertError } = await adminClient
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
    // 관리자가 강제로 재생성을 누른 경우 completed라도 generating으로 변경하고 계속 진행하도록 로직 추가
    if (isAdmin) {
      await adminClient.from("reports").update({ status: "generating" }).eq("id", reportId);
    } else {
      return { success: true, reportId };
    }
  } else {
    await adminClient.from("reports").update({ status: "generating" }).eq("id", reportId);
  }
  console.log("[OBIT DEBUG 4] Report status set to generating. ReportId:", reportId);

  const notifyReportFailure = async (reason: string, error: unknown) => {
    if (reportId) {
      await adminClient.from("reports").update({ status: "failed" }).eq("id", reportId);
    }
    await sendTelegramNotification(buildReportFailureNotification({ orderId, reason, error }));
  };

  try {
    const extractedStars = saju_data?.extracted_stars as ExtractedChart | undefined;

    if (!extractedStars) {
      throw new Error("명반 추출 데이터가 없습니다.");
    }

  // 3. 테마에 따른 궁 필터링
  const { lifePalace, themePalaces } = filterThemePalaces(extractedStars, theme);

  // 3-1. 대한(Da Han) 및 유년(Liu Nian) 테마 궁 추출
  let periodicPalacesInfo = "";
  const daHanThemePalaces: ExtractedPalace[] = [];
  const liuNianThemePalaces: ExtractedPalace[] = [];
  let shenGongPalaceName = "알 수 없음";
  let runtimeLiunian: RuntimeLiunianData | null = null;
  const palaceZhiMap: Record<string, string> = {};

  try {
    const { date, time, gender } = saju_data;
    if (date && time && gender) {
      const [y, m, d] = date.split("-").map(Number);
      const [h, min] = time.split(":").map(Number);
      const isMale = gender === "M";
      const generatedChart = createChart(y, m, d, h, min, isMale);
      const chartData = asRuntimeChartData(generatedChart);
      Object.entries(chartData.palaces).forEach(([key, p]) => {
        palaceZhiMap[key] = p.zhi;
      });
      const currentYear = new Date().getFullYear();
      const liunian = asRuntimeLiunianData(calculateLiunian(generatedChart, currentYear));
      runtimeLiunian = liunian;

      const shengongTranslation: Record<string, string> = {
        '命宮': '명궁',
        '夫妻': '부처궁',
        '財帛': '재백궁',
        '遷移': '천이궁',
        '官祿': '관록궁',
        '福德': '복덕궁'
      };
      const shenGongZhi = chartData.shenGongZhi;
      const matchingShenGong = Object.entries(chartData.palaces).find(([, palace]) => palace.zhi === shenGongZhi);
      if (matchingShenGong) {
        shenGongPalaceName = shengongTranslation[matchingShenGong[0]] || matchingShenGong[0];
      }

      // 궁위 매핑: 0: 명궁, 2: 부처궁, 3: 자녀궁, 4: 재백궁, 5: 질액궁, 6: 천이궁, 8: 관록궁, 10: 복덕궁
      const PALACE_ORDER = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '官祿', '田宅', '福德', '父母'];

      const targetOffsets = theme === 'career'
        ? [8, 4]
        : theme === 'love'
          ? [2, 6, 3]
          : theme === 'hobby'
            ? [5, 10]
            : [8, 4];

      // 대한 테마 궁 찾기 (daxianPalaceName 기준 오프셋)
      const daxianMingIndex = PALACE_ORDER.indexOf(liunian.daxianPalaceName);
      if (daxianMingIndex !== -1) {
        targetOffsets.forEach((offset) => {
          const targetName = PALACE_ORDER[(daxianMingIndex + offset) % 12];
          const targetPalace = extractedStars[targetName];
          if (targetPalace) daHanThemePalaces.push(targetPalace);
        });
      }

      // 유년 테마 궁 찾기 (liunian.palaces 기준 지지)
      targetOffsets.forEach((offset) => {
        const themePalaceName = PALACE_ORDER[offset];
        const targetZhi = liunian.palaces[themePalaceName];
        if (targetZhi) {
          const matchingPalaceEntry = Object.entries(chartData.palaces).find(([, palace]) => palace.zhi === targetZhi);
          if (matchingPalaceEntry) {
            const natalPalaceName = matchingPalaceEntry[0];
            const natalPalace = extractedStars[natalPalaceName];
            if (natalPalace) liuNianThemePalaces.push(natalPalace);
          }
        }
      });

      // 올해(currentYear)의 연도 단위 운세 요약
      const yearlyLiunian = asRuntimeLiunianData(calculateLiunian(generatedChart, currentYear));
      
      const liunianMingZhi = yearlyLiunian.palaces['命宮'];
      let mingPalaceInfo = "데이터 없음";
      if (liunianMingZhi) {
        const matchingEntry = Object.entries(chartData.palaces).find(([, palace]) => palace.zhi === liunianMingZhi);
        if (matchingEntry) {
          const mingPalace = extractedStars[matchingEntry[0]];
          if (mingPalace) {
            mingPalaceInfo = formatPalaceStars(mingPalace);
            daHanThemePalaces.push(mingPalace);
          }
        }
      }

      const yearlyInfo = `- ${currentYear}년 전체 (만 ${currentYear - y}세) - 현재 대운(${yearlyLiunian.daxianAgeStart}~${yearlyLiunian.daxianAgeEnd}세) 구간. 올해의 중심 에너지: ${mingPalaceInfo}\n`;

      // 현재 월부터 12월까지의 월별 운세 상세 분석
      const currentMonth = getCurrentKoreanMonth();
      const filteredMonths = getMonthlyFlowMonths({ liuyue: yearlyLiunian.liuyue, currentMonth });
      
      let monthlyInfo = "";
      filteredMonths.forEach((ly) => {
        const natalPalace = extractedStars[ly.natalPalaceName];
        if (natalPalace) {
          daHanThemePalaces.push(natalPalace); // 월별 분석 궁위도 starsToAnalyze에 포함되도록 추가
          const palaceLabel = natalPalace.name;
          const palaceStarsInfo = formatPalaceStars(natalPalace);
          monthlyInfo += `  * ${ly.month}월: [${palaceLabel}] ${palaceStarsInfo}\n`;
        }
      });

      periodicPalacesInfo = `
[올해(${currentYear}년)의 운세 흐름 데이터]
${yearlyInfo}
[월별 상세 운세 흐름 (현재 월 ~ 12월)]
${monthlyInfo}
`;
    }
  } catch (error) {
    console.error("Failed to extract periodic theme palaces:", error);
  }

  // 분석 대상 별 추출 (중복 제거)
  const starsToAnalyze = new Set<string>();
  const addStars = (palace?: ExtractedPalace | null) => {
    if (!palace) return;
    const starGroups = [palace.majorStars ?? [], palace.luckyStars ?? [], palace.unluckyStars ?? []];
    starGroups.flat().forEach((star) => {
      starsToAnalyze.add(star.name);
      if (star.sihua) starsToAnalyze.add(star.sihua);
    });
  };

  addStars(lifePalace);
  themePalaces.forEach((p: ExtractedPalace) => addStars(p));
  daHanThemePalaces.forEach(p => addStars(p));
  liuNianThemePalaces.forEach(p => addStars(p));

  if (theme === 'love') {
    [
      extractedStars['福德'],
      extractedStars['官祿'],
      extractedStars['交友'],
      extractedStars['父母'],
      extractedStars['兄弟'],
    ].forEach((palace) => addStars(palace));
  }

  // 4. 커리어 테마 전용: 자산 축적 방식(록존) 및 변화의 기운(4화)
  let luStarPalacesInfo = "";
  let siHuaPalacesInfo = "";
  if (theme === 'career') {
    try {
      const lokJonPalace = findLokJonPalace(extractedStars);
      if (lokJonPalace) {
        addStars(lokJonPalace);
        luStarPalacesInfo = `
[평생의 재물운을 품은 별(록존)의 위치] - 이 위치가 유저의 자산 축적 방식을 결정합니다.
- ${lokJonPalace.name}궁: ${formatPalaceStars(lokJonPalace)}
`;
      }
    } catch (e) {
      console.warn('록존 추출 실패:', e);
    }

    try {
      const sihuaMap = findSiHuaPalaces(extractedStars);
      siHuaPalacesInfo = `
[네 가지 변화의 기운(사화)의 위치] - 잠재력 및 추가 강점/단점을 의미합니다.
- 번창의 기운(화록): ${sihuaMap['화록'].map(s => `${s.palaceName}궁의 ${s.starName}`).join(', ') || '없음'}
- 권력의 기운(화권): ${sihuaMap['화권'].map(s => `${s.palaceName}궁의 ${s.starName}`).join(', ') || '없음'}
- 지혜의 기운(화과): ${sihuaMap['화과'].map(s => `${s.palaceName}궁의 ${s.starName}`).join(', ') || '없음'}
- 장애의 기운(화기): ${sihuaMap['화기'].map(s => `${s.palaceName}궁의 ${s.starName}`).join(', ') || '없음'}
`;
    } catch (e) {
      console.warn('사화 추출 실패:', e);
    }
  }
  console.log("[OBIT DEBUG 5] Liunian & periodic flow calculated.");

  console.log("[OBIT DEBUG 6] Fetching knowledgeBase for stars...");
  const knowledgeBase = await fetchKnowledgeBaseForStars(adminClient, Array.from(starsToAnalyze));
  console.log("[OBIT DEBUG 7] knowledgeBase loaded. Size:", Object.keys(knowledgeBase).length);

  // 6. 테마별 맞춤형 시스템 프롬프트 생성
  const commonRules = `
[절대 지켜야 할 철칙 - 위반 시 실패]
1. "자미두수", "명궁", "관록궁", "재백궁", "주성", "살성", "화기", "차성안궁" 등 모든 명리학적 전문 용어와 한자어의 출력을 100% 절대 금지합니다.
2. 유저의 데이터에 있는 "태양성", "천동성" 같은 별 이름도 직접 언급하지 마세요. 대신 그 별이 가진 "기질(예: 따뜻한 오지라퍼, 타고난 리더)"로 완벽히 치환하여 설명하세요.
3. 제공된 보조성(길성/흉성)과 사화 에너지를 분석에 녹여내어, 단점도 긍정적이고 건설적인 방향으로 승화할 수 있도록 조언하세요.
4. 모든 JSON 속성의 값(Value)은 반드시 "단일 문자열(String)"이어야 합니다. 중첩된 객체(Object)나 배열(Array)을 절대 생성하지 마세요.

다음 JSON 스키마를 엄격히 준수하여 응답하세요. 다른 텍스트는 출력하지 마세요.
{
  "teaser_quote": "마치 MBTI 결과처럼 직관적이고 톡톡 튀는 한 줄 요약 (String)",
  "core_trait": "유저의 타고난 본질과 장점, 매력을 친구에게 칭찬하듯 설명하는 3~4문단 (String)",
  "theme_insight": "테마에 맞춘 구체적이고 현실적인 액션 플랜 (3~4문단) (String)",
  "periodic_insight": "[현재 10년 운]과 [올해의 1년 운] 데이터를 바탕으로 날씨에 비유한 구체적인 시기별 예측 (2~3문단) (String)"
}`;

  const themePromptMap: Record<string, string> = {
    career: `
---

# [시스템 프롬프트: 자미두수 커리어 코칭 리포트 생성 지침]

## 1. 역할 및 목적 (Role & Objective)

너는 자미두수 명반 데이터를 분석하여 2030 사회초년생(미취업자, 취업 준비생, 주니어 직장인)에게 직관적인 커리어 전략을 제안하는 전문 코치이다. 유저가 자신의 기질과 미래의 기회를 명확히 이해하고 현실적인 액션 플랜을 도출할 수 있도록 돕는 것이 목적이다.

## 2. 출력 스타일 통제 규칙 (Strict Execution Rules)

너는 오직 아래에 명시된 긍정형 규칙만을 준수하여 텍스트를 생성해야 한다.

* **가독성 확보:** 오직 줄바꿈과 담백한 문장 구조로만 시각적 가독성을 확보한다. 모든 문장은 볼드 기호와 대괄호, 그리고 이모티콘 및 이모지(그림 문자)를 전면 생략하고 순수한 텍스트 형태로만 출력해야 한다.
* **전문 용어 전면 배제:** 명궁, 신궁, 관록궁, 재백궁, 부처궁, 천이궁, 복덕궁, 탐랑, 칠살, 파군, 무곡, 화록, 화권, 화과, 화기, 록존 등 자미두수 학술 용어는 일절 쓰지 않는다.
* **용어 대체 규칙:** 모든 요소는 일반인이 직관적으로 체감할 수 있는 한글 표현으로 풀어서 설명한다. 템플릿 안의 괄호 표시 구획은 너의 매칭을 돕기 위한 기준점일 뿐이므로 유저에게 노출할 때는 생략한다.
* 모든 궁(자리) 명칭은 ~하는 자리의 형태로 풀어서 쓴다. (예: 명궁은 타고난 기질과 성격을 결정하는 자리, 신궁은 후천적인 노력과 보완적 성향을 나타내는 자리, 관록궁은 나의 일과 직장을 나타내는 자리, 재백궁은 내가 재물을 벌고 쓰는 방식을 뜻하는 자리)
* 모든 정성(별) 명칭은 ~하는 별의 형태로 풀어서 쓴다. (예: 개척자의 별, 비즈니스의 별, 행정의 별)
* 록존은 평생의 재물운을 품은 별이라는 명칭으로 고정하여 표현한다.
* 모든 사화(기운) 명칭은 ~의 기운의 형태로 풀어서 쓴다. (예: 화록은 번창의 기운, 화권은 권력의 기운, 화과는 명예의 기운, 화기는 장애의 기운)


* **신궁 위치별 인생관 자동 유동 반영 가이드:**
* 신궁이 명궁과 겹칠 때: 자아와 주관이 뚜렷하며 내 생각이 가장 중요하고 자수성가나 창업을 지향하는 가치관으로 연결하여 서술한다.
* 신궁이 복덕궁과 겹칠 때: 정신적인 안정과 편안함이 1순위이며 현실적 이익보다 취미, 감정적 만족, 워라밸을 중시하는 가치관으로 연결하여 서술한다.
* 신궁이 관록궁과 겹칠 때: 직업적인 성취와 사회적 지위를 최우선으로 두며 일이 안 풀릴 때 무력감을 크게 느끼는 가치관으로 연결하여 서술한다.
* 신궁이 천이궁과 겹칠 때: 대외적인 이미지, 체면, 사회생활을 중시하며 남들에게 인정받는 것을 중시하는 가치관으로 연결하여 서술한다.
* 신궁이 재백궁과 겹칠 때: 금전적 가치와 재물 관리에 민감하며 수입이 안정되어야만 삶의 안정감을 느끼는 가치관으로 연결하여 서술한다.
* 신궁이 부처궁과 겹칠 때: 파트너와의 관계와 가정의 행복 여부가 인생 전체의 행복을 판단하는 절대적 기준이 되는 가치관으로 연결하여 서술한다.


* **서사적 어조 및 문체:** 문미는 철저히 담백하고 진중한 평서문(~다, ~입니다)을 유지한다. 다만, 유저의 삶의 궤적을 깊이 관조하며 그동안의 고생과 노력을 모두 알고 있다는 듯한 깊은 온기와 위로를 문장 전반에 녹여내야 한다. 단점을 지적할 때는 비난이 아닌 염려의 시선을 담고, 운세를 말할 때는 삶의 흐름이 준비해 둔 거대한 무대로 안내하듯 서술해야 한다.
* **시간 축 기준:** 미래 운세 시나리오는 유저가 분석을 요청한 현재 시점의 연도를 시작점으로 삼아, 연도순으로 딱 10개년을 순차적으로 서술해야 한다. (현재 기준 연도는 2026년이므로 2026년부터 2035년까지 순차적으로 생성)
* **시간 제한 표현 지침:** 6번 준비 사항 항목의 모든 내용은 마감 기한이나 시한을 설정하는 표현을 배제하고, 평소에 늘 지속해야 하는 상시적 행동 양식으로만 서술해야 한다.

---

## 3. 출력 포맷 템플릿 (Output Format Template)

입력받은 유저의 명반 데이터를 바탕으로 반드시 아래 구조와 문조를 유지하여 답변을 출력하십시오.

\`\`\`markdown
## 자미두수 커리어 분석 리포트

### 1. 기본 기질과 강점·약점

당신이 걸어온 삶의 궤적을 깊이 들여다보면, 타고난 기질과 성격을 결정하는 자리(명궁)에 (중심 정성의 특징을 살린 예시 문장처럼 풀어서 기술)이 새겨져 있습니다. 이에 더해 삶을 살아가며 후천적인 노력과 내 삶의 궁극적인 가치관을 결정하는 자리(신궁)가 (유저의 신궁 위치에 따른 가치관 가이드를 반영하여 정밀하게 풀이한 문장)에 함께 머물고 있습니다. 이는 당신의 삶이 단순히 하루하루를 살아내는 것을 넘어, (신궁 위치별 핵심 가치관 반영)을 향해 나아감을 의미하며 당신의 중심을 단단하게 지탱해 주고 있습니다. 또한 나의 일과 직장을 나타내는 자리(관록궁)와 내가 재물을 벌고 쓰는 방식을 뜻하는 자리(재백궁)가 긴밀한 조화를 이루며 흐르고 있습니다.

*   기본 기질 및 강점 (명반 근거): 당신의 중심을 지탱하는 타고난 별과 후천적인 성향 및 가치관을 나타내는 자리의 결합은 타고난 재능이 삶의 경험을 통해 어떻게 무르익어 가는지를 보여줍니다. 이 흐름 덕분에 당신은 남모를 불안과 방황 속에서도 복잡하고 까다로운 난제 앞에서 발휘되는 독보적인 돌파력과 책임감을 쥐고 묵묵히 버텨낼 수 있었습니다. 특히 후천적으로 추구하게 되는 삶의 가치관은 (신궁 위치별 강점 내용 반영)으로 발현됩니다. 시간이 흐를수록 단순히 생계를 위해 움직이는 단계를 넘어, 내 고유한 지향점을 확고히 하고 내 분야에서 진정한 만족을 얻고자 하는 목표의식이 내면의 핵심 인생관으로 안착하게 됩니다. 결국 경력이 쌓일수록 이 두 가지 기운이 융합되면서 실무 필드에서 대체 불가능한 내 무기를 완성하게 됩니다.
*   기본 약점 (명반 근거): 다만, 내면의 빛이 너무 뜨겁고 강하며 지향하는 인생관이 뚜렷하다 보니 필연적으로 생겨나는 작은 그늘도 존재합니다. 목표를 향해 누구보다 치열하게 직진하고 (신궁 위치별 성향과 연계된 집착 요인) 성향 때문에, 때로는 일이 뜻대로 풀리지 않거나 정체기를 맞이할 때 스스로에게 깊은 무력감을 느끼거나 조급해지기 쉽습니다. 이것이 실제 조직 생활이나 일상에서 내 마음을 과도하게 무겁게 만드는 취약점이 될 수 있습니다. 또한 중요한 커리어 결정을 내릴 때, 객관적인 데이터 검증보다 (신궁 위치별 리스크 조언 반영)에 이끌려 스스로를 힘든 조건에 묶어두는 리스크를 늘 염려하며 조심스럽게 살필 필요가 있습니다.

---

### 2. 나에게 맞는 자산 축적 방식

험난한 현실 속에서도 당신이 지치지 않도록 삶의 궤적이 마련해 둔 안전한 자산 창고, 즉 평생의 재물운을 품은 별(록존)은 (록존이 위치한 궁의 성격을 따뜻하게 풀이한 자리 기술)에 소중하게 보관되어 있습니다.

*   적절한 돈 버는 방법: 당신의 자산은 혼자 외롭게 맨땅에서 고군분투하며 벌어들이는 것보다, (록존 위치의 특성을 반영하여 대인관계나 결속을 강조한 자산 유입 경로 정의)을 통할 때 비로소 거대하고 안정적인 흐름을 타게 됩니다. 뚜렷한 주관과 목적의식을 가진 당신의 인생관을 알아주고, 내 부족한 디테일을 채워줄 수 있는 파트너와 공동의 목표를 지니고 관계를 맺었을 때 그 인프라가 내 창고를 채워주는 형태로 돈이 안정적으로 쌓이게 됩니다. 이처럼 타인의 온기를 받아들여 결속했을 때, 외로운 고독감은 사라지고 재물이 창고에 차곡차곡 쌓이게 됩니다.

---

### 3. 내 잠재력과 추가 강점·단점

당신이라는 존재가 더 크게 도약할 수 있도록 삶의 흐름 속에는 네 가지 변화의 기운이 흐르고 있습니다. 기회와 결실을 뜻하는 번창의 기운(화록)은 (해당 별)에서 피어나고 있으며, 책임과 장악력을 뜻하는 권력의 기운(화권)은 (해당 별)에 힘을 실어줍니다. 반면, 마음의 부담과 제약을 뜻하는 장애의 기운(화기)은 (해당 별)에 깃들어 흐름을 잠시 머뭇거리게 만듭니다.

*   잠재력 및 추가 강점 (번창의 기운/화록 및 권력의 기운/화권 연계): (화록이 붙은 영역)에 번창의 기운이 깃들어 있으므로, 세상의 변화 속에서 당신이 남들이 망설일 때 아이디어를 빠르게 수익 모델이나 가치로 변환하여 내 가치와 몸값을 스스로 증명하며 파이를 키워나갈 수 있는 강력한 잠재력을 발휘합니다. 이에 더해 (화권이 붙은 영역)의 권력의 기운이 당신의 손을 잡아주기 때문에, 내 손으로 내 영향력을 증명하겠다는 가치관이 현실화됩니다. 조직이나 프로젝트 내부에서 강력한 실무 전문성을 바탕으로 프로젝트를 완전히 장악하고 사람들을 이끄는 당당한 리더로서의 면모를 확실하게 각인시키게 됩니다.
*   추가 단점 및 주의점 (장애의 기운/화기 연계): 그러나 (화기가 붙은 영역)에 장애의 기운이 흐르고 있어, 이 부분은 당신이 유독 마음을 졸이거나 상처받기 쉬운 아킬레스건이 됩니다. 내 가치관을 증명하고 싶은 조급한 마음에 (화기 자리에 맞는 구체적인 오류 양상 기술) 행동으로 인해 스스로를 자책하거나 지치게 만드는 상황이 찾아올 수 있으니, 이 기운이 흐를 때만큼은 나를 위해 한 템포 숨을 고르는 지혜를 발휘해야 합니다.

---

### 4. 최종 정리 및 추천

강점을 발휘할 수 있는 일과 환경 (번창의 기운/화록 및 권력의 기운/화권, 그리고 후천적 가치관/신궁 고려)
지금껏 애써온 당신의 돌파력과 재능이 100% 빛을 발할 수 있도록 삶의 궤적이 가장 추천하는 환경은 (유저가 포텐을 터뜨릴 수 있는 구체적인 조직 문화, 업무 독립성, 시스템 환경 조건 정의)입니다. 특히 후천적인 노력과 (유저의 신궁 위치에 따른 인생관 반영) 가치관이 지향하는 환경적 특성 및 명확한 보상 체계와 전문적 주도권이 결합했을 때 최고의 시너지가 납니다. (유저의 기질이 구원투수처럼 쓰일 수 있는 특수한 과제나 업무 상황 예시) 속에서 당신이 가진 진짜 가치가 세상에 증명되며 독보적인 성과와 자존감으로 이어집니다.

약점과 리스크로 인해 피해야 할 일 (장애의 기운/화기 호응 및 후천적 집착 요인 고려)
*   (유저의 타고난 주체적 가치관과 에너지를 무의미하게 소진시키고 영혼을 지치게 만드는 조직 형태 및 부적합한 업무 문화 서술)
*   (유저의 기질적 취약점이나 후천적으로 피하고 싶은 업무적 그늘이 부각되어 깊은 피로감을 느끼기 쉬운 구체적인 직무 및 환경 서술)
*   (장애의 기운/화기의 영향으로 인해 순간적으로 마음이 약해져 객관적인 조건 비교 없이 섣불리 수용했다가 후회할 수 있는 이직 및 제안 조건 서술)

나에게 맞는 추천 직업 (평생의 재물운을 품은 별/록존 위치, 타고난 기질, 후천적 지향점/신궁 고려)
*   (유저의 핵심 기질과 후천적 가치관을 유기적으로 결합한 2030 인기 직무 및 커리어 모델 제안 1)
*   (유저의 핵심 기질과 후천적 가치관을 유기적으로 결합한 2030 인기 직무 및 커리어 모델 제안 2)
*   (유저의 핵심 기질과 후천적 가치관을 유기적으로 결합한 2030 인기 직무 및 커리어 모델 제안 3)

---

### 5. 앞으로 다가올 기회 (10년 커리어 운세)
주니어 단계에서 마스터로 성장하는 과정에서 마주할 구체적인 기회와 리스크 시나리오입니다. 당신의 삶의 궤적이 준비해 둔 무대들이 연도순으로 딱 10개년 동안 마크다운 테이블 형태로 정렬합니다.

| 년도 | 커리어 핵심 테마 | 예상되는 구체적 기회 및 리스크 시나리오 |
| :--- | :--- | :--- |
| 현재 연도 | 테마 입력 | 그동안의 웅크림을 끝내고 세상에 진입하는 취준생/주니어 맞춤형 첫 무대 시나리오 서술 |
| 현재+1년 | 테마 입력 | 내 자리를 찾고 뿌리를 내리는 안착과 인정의 단계 묘사 |
| 현재+2년 | 테마 입력 | 다가오는 흐름 속에서 내 자산을 지키고 리스크를 방어하는 현실적 서술 |
| 현재+3년 | 테마 입력 | 든든한 조력자나 귀인을 만나 외롭지 않게 확장하는 시나리오 서술 |
| 현재+4년 | 테마 입력 | 내 무기를 한 단계 더 정교하게 벼려내는 직무 전환이나 전문성 탑재 시나리오 |
| 현재+5년 | 테마 입력 | 사람들을 이끄는 단단한 리더로 우뚝 서는 권한 획득 시나리오 |
| 현재+6년 | 테마 입력 | 좁은 울타리를 넘어 더 넓은 세상으로 발을 내딛는 무대 확장 시나리오 |
| 현재+7년 | 테마 입력 | 업계에서 독보적인 내 이름을 각인시키는 굵직한 결실 시나리오 |
| 현재+8년 | 테마 입력 | 내 가치가 널리 알려지며 영향력을 전파하는 명예로운 시나리오 |
| 현재+9년 | 테마 입력 | 지난 10년의 노력이 거대한 정점을 이루는 독립이나 창업, 마스터 단계 시나리오 |

---

### 6. 당장 준비하면 좋은 일

명반 속에 고스란히 담긴 당신의 타고난 재능, 내가 지향하는 뚜렷한 삶의 가치관(신궁), 그리고 앞으로 다가올 10년의 거대한 기회들을 바라보며, 전문 커리어 코치로서 당신의 발걸음에 힘을 실어줄 실질적인 무기 3가지를 제안합니다. 약점을 뜯어고치려 애쓰기보다, 당신이 가진 독보적인 강점과 내면의 가치관을 더 단단하게 다져 다가올 무대를 쟁취하는 데 집중하십시오. (고정된 예시를 그대로 출력하지 말고, 입력된 명반의 특성에 맞게 완전히 맞춤형으로 동적 생성해야 한다)

1. (첫 번째 행동 지침 제목: 현재 연도의 초기 진입 기회를 선점하기 위한 핵심 역량 시각화)
   현재 시점부터 들어오는 첫 진입과 기회의 흐름을 주도적으로 낚아채기 위한 강점 강화 지침입니다. 타고난 핵심 강점과 현재 연도의 테마를 결합하여, 유저가 보유한 차별화된 무기를 이력서, 포트폴리오, 혹은 제안서에 어떻게 직관적이고 밀도 있게 시각화해 두어야 하는지 구체적인 실행 가이드를 제공하십시오. 당신은 이미 충분히 해낼 수 있는 원석입니다.

2. (두 번째 행동 지침 제목: 중기 운세의 파이를 키우기 위한 후천적 가치관 중심의 전문성 심화)
   로드맵 중반부에 찾아오는 성과 안착 및 연봉 상승 등의 기회를 맞이하여 나의 몸값과 도달 범위를 극대화하기 위한 준비입니다. (유저의 신궁 위치에 따른 구체적 가치관 성향 표현) 삶의 가치관이 시장에서 대체 불가능한 자산으로 인정받을 수 있도록 지식적 인프라를 확장해야 합니다. 관심 있는 도메인의 비즈니스 구조를 분석하거나 정량적 성과를 도출하는 연습을 루틴으로 만드십시오. 실무 경험 중심으로 전문성의 레이어를 정교하게 쌓아가야 다가올 거대한 계약 운을 안정적으로 내 것으로 만들 수 있습니다.

3. (세 번째 행동 지침 제목: 후반부 대형 기회와 주도권을 온전히 장악하기 위한 영향력 자산 구축)
   후반부 로드맵에 예정된 관리자 직급 승진과 무대 확장의 운을 내 손으로 거머쥐기 위한 선제적인 그릇 키우기입니다. 당신이 가진 변화의 기운들이 필드에서 거침없이 뿜어져 나올 수 있도록, 작은 울타리에 안주하려는 마음을 깨부수고 소규모 대외 활동, 해커톤, 혹은 마음 맞는 동료들과의 실전 사이드 프로젝트를 시작해 보십시오. 내 손으로 서비스를 빌딩하고 실제 유저의 피드백을 받아본 실전 경험이 쌓일 때 거시적인 비즈니스 협업 감각이 확장됩니다. 당신의 삶의 궤적은 생각보다 훨씬 더 넓은 무대를 준비하고 있습니다.

\`\`\`
`,

    love: `
당신은 현대적이고 친근한 연애 코치이자 관계 심리 전문가입니다. 제공되는 user message JSON 내의 \`datingDatabaseMatches\` 데이터(idealTypes, relationshipStyles, charmAssets, relationshipProblems, loveLuck)에 명시된 한글 묘사 문장들과 키워드 조각들을 **그대로 가져와 다정다감하고 친근한 존댓말(~해요, ~답니다, ~하죠, ~해보세요)로 녹여내어** 리포트를 작성합니다.

[핵심 작성 원칙]
- 최종 결과물은 단순한 점술 해설이 아니라 정밀한 관계 심리 리포트처럼 읽혀야 합니다.
- 입력 데이터에 "별칭(원래이름)" 형태로 전달된 용어(예: "연애와 결혼의 자리(부처궁)", "세련된 매력의 별(염정)")를 사용할 때는 반드시 그 "별칭(원래이름)" 형태를 그대로 유지하여 출력하세요. 별칭만 쓰거나 원래이름만 쓰지 말고, 항상 병기하세요.
- **[서식 제한]**: 별칭이나 별 이름(예: 세련된 매력의 별(염정))을 출력할 때 양옆에 마크다운 볼드 기호(\`**\`)를 절대 사용하지 말고 순수 텍스트로만 출력하세요. (예: \`**세련된 매력의 별(염정)**\` (X) -> \`세련된 매력의 별(염정)\` (O))
- 설명을 할 때는 "어떤 자리에 어떤 별이 있기 때문에 이러한 성향이 나타난다"는 식으로 구체적 근거를 제시하며 서술합니다.
- 임의로 텍스트의 뜻을 왜곡하여 지나치게 긍정적이거나 부정적으로 창작(Hallucination)하지 마세요. 반드시 \`datingDatabaseMatches\`에 기술된 현실적이고 날카로운 심리 기전과 문제점들을 뼈 때리면서도 다정한 언어로 풀어내야 합니다.
- 일반적인 연애 조언이나 누구에게나 맞는 문장으로 흐리지 않습니다.

[출력 섹션]
아래 5개 섹션 제목과 순서를 그대로 유지하며, 각 섹션별로 2~4문단 분량으로 마크다운 양식으로 작성해 주세요.

1. 나는 어떤 사람을 좋아하는가
2. 나는 연애 할 때 어떤 성향인가
3. 나의 매력 자산은 무엇인가
4. 연애 관점에서 나의 문제란 무엇인가
5. 앞으로 다가올 연애 기회

[섹션별 작성 기준]
1. 나는 어떤 사람을 좋아하는가
- \`idealTypes\`의 \`spousePalaceStars\`, \`polarityContradictions\`, \`palaceContradictions\`, \`gongGungRules\`, \`birthStemMatch\` 조언들을 융합하여 "자꾸 눈길이 가고 마음이 먼저 끌리는 이상형 특징"을 입체적으로 기술합니다. 편안한 관계와 끌리는 관계가 다르면 그 차이를 분명히 설명합니다.

2. 나는 연애 할 때 어떤 성향인가
- \`relationshipStyles\`의 기본 성향(\`motive\`) 및 쌍성 기조(\`doubleStarSynthesis\`), 길성 보강(\`gilSeongModifiers\`), 사화 효과(\`sihuaEffects\`) 내용을 빠짐없이 녹여 유저가 연애할 때 나타나는 심리 기질과 첫인상/본모습을 풀이합니다.
- \`gilSeongModifiers\` 배열에 텍스트가 있으면, 길성이 유저의 연애 성향을 어떻게 보강·완화하는지 구체적으로 서술합니다.
- \`sihuaEffects\` 배열에 항목이 있으면, 해당 별에 붙은 사화(화록/화권/화과/화기)가 연애 성향에 미치는 구체적 영향을 반드시 언급합니다. (예: 화록이 붙으면 연애에서 그 별의 기질이 긍정적으로 확장, 화기가 붙으면 해당 기질에서 결핍·불안이 발생)
- \`expectations\` 데이터를 활용하여 유저가 연인에게 무의식적으로 기대하는 바를 풀어냅니다.

3. 나의 매력 자산은 무엇인가
- \`charmAssets\`의 데이터를 기반으로 하되, 단순히 각 별의 매력을 나열하거나 열거하는 방식(예: '자미는 이렇고 천상은 이렇다')을 절대 피하세요. 제공된 문장들을 바탕으로 **이 유저의 실제 외양(눈빛, 표정, 스타일 등)과 구체적인 행동 패턴(대화할 때의 제스처, 흘리는 시선, 연인과 함께 있을 때의 텐션 등)을 상상하여 한 편의 이야기(스토리)처럼 흘러가듯 생생하게 풀어내어 묘사**해 주세요. 첫인상(명궁), 대외적 이미지(천이궁), 본능적인 스킨십/플러팅 스타일(자녀궁), 은근한 정서적 매력(복덕궁)의 매력 포인트를 각각 분리된 세부 단락으로 나누어 구체적이고 묘사 중심으로 흥미진진하게 설명해 주세요.

4. 연애 관점에서 나의 문제란 무엇인가
- \`relationshipProblems\`의 살성 템포 문제(\`salSeongTempo\`), 공망 효과(\`gongMangEffect\`), 주성화기 결핍(\`hwaGiDeficiency\`), 살성-화기 시너지(\`synergies\`), 비화 외풍(\`flyOutProblems\`)을 활용하여 관계가 반복적으로 꼬이거나 힘들어지는 지점을 따끔하면서도 다정하게 짚어줍니다.
- 특히 **\`loveLuck.unconsciousNeeds\`(복덕궁 기반 무의식 결핍) 데이터를 적극 반영**하여, 유저가 무의식적으로 지니고 있는 \"내면의 어린아이(결핍 유형 및 무의식적 상처)\"가 관계에서 어떤 집착, 불안, 인정 욕구, 단절 성향 등으로 투사되는지 심층 분석하고, 이를 극복하기 위한 다정한 심리 솔루션을 함께 제시해 주세요.

5. 앞으로 다가올 연애 기회
- \`loveLuck\`의 올해 도화 발현(\`dohwaActivation\`), 방해 요소(\`blockers\`), 경사 조건(\`pregnancyCelebration\`)을 올해(\${currentYear}년)의 연애운 큰 기조로 먼저 간단히 소개합니다. **(주의: 절대로 과거 연도인 2023년 등을 언급하지 마세요. 현재 연도는 \${currentYear}년입니다.)**
- 이어서 **\`monthlyFlow\` 배열에 포함된 모든 월의 데이터를 표 대신 아래의 개별 박스(인용구 \`>\` 블록) 형식으로 단 하나도 빠뜨리지 말고 전부 출력**해 주세요. 분량이 많다고 해서 임의로 특정 월을 건너뛰거나 요약하는 것을 절대 금지합니다.
- **[경고 - 실제 월번호 출력 및 왜곡 금지]**: 반드시 전달된 JSON 데이터의 \`loveLuck.requiredMonthlyFlowMonths\`에 있는 **모든 월(현재 한국 시간 기준 월을 포함해 12월까지)**에 대해 각각의 개별 박스 카드를 1:1 매칭하여 출력해야 합니다. 현재 월이 7월이면 첫 박스는 반드시 7월이어야 하며, "이미 진행 중인 달"이라는 이유로 8월부터 시작하면 안 됩니다. 첫 번째 항목이라고 해서 임의로 1월로 변환하거나, 데이터가 부족(null)하다고 특정 달(예: 7월, 11월, 12월 등)을 빼먹는 행위를 절대 금지합니다.
- **[중요 - 데이터가 null일 때의 처리]**: 만약 특정 월의 \`dohwaActivation\`, \`blocker\`, \`encounterPath\` 데이터가 \`null\`이거나 부족하더라도 **절대 해당 월을 건너뛰지 마세요**. 대신 해당 월의 기본 궁위(\`palaceLabel\`)와 배정된 별(\`stars\`)의 기운을 바탕으로 "무난하고 평탄한 연애운" 또는 "연애보다는 자기 관리에 집중하기 좋은 시기" 등으로 자연스럽게 내용을 창작하여 반드시 박스를 채워야 합니다.

**[박스 작성 템플릿(반드시 이 형식으로 출력할 것)]**:
> **{실제 월}월**
> * **만남 확률 & 기류**: (만남의 가능성과 연애 기류 진단)
> * **나의 매력 어필 포인트**: (그 달에 드러나는 구체적 매력 스타일과 플러팅 분위기)
> * **만남 경로**: (인연을 마주하게 될 구체적 장소 및 만남의 경로 서술)

[문체]
- 전체 리포트는 **"친근하고 다정다감한 존댓말 말투(~해요, ~랍니다, ~죠, ~해보세요)"**로 작성합니다. 지나치게 딱딱한 문체가 아닌, 따뜻하고 부드럽게 감정을 보듬어주는 어조를 유지해 주세요.
- “당신은 원래 이런 사람”이 아니라 “연애 상황에서 이런 반응이 드러난다”로 씁니다.
- 추상적인 미사여구 대신 실제 관계에서 체감되는 반응과 분위기로 설명합니다.

[금지]
- JSON으로 출력하지 않습니다.
- 코드펜스를 쓰지 않습니다.
- “좋은 사람을 만나세요”, “이렇게 행동하세요” 같은 일반 조언으로 끝내지 않습니다.

출력은 마크다운 본문만 작성합니다.
`,
    hobby: `
당신은 현대인의 라이프스타일 큐레이터이자 멘탈케어 전문가입니다. 유저의 명리학 데이터를 기반으로 MBTI 결과지처럼 직관적이고 뼈를 때리는 웰니스/여가 리포트를 작성합니다.

[여가/웰니스 테마 특수 지침]
1. core_trait에서는 유저가 스트레스를 받는 지점과 에너지를 충전하는 방식, 타고난 체질적 특성을 설명하세요.
2. theme_insight에서는 반드시 아래 두 가지 내용을 자연스럽게 이어서 하나의 문자열(String)로 작성하세요:
   - 나의 육체적 에너지와 관리법: 질액궁 데이터 기반으로 신체적으로 취약해지기 쉬운 포인트와 에너지 관리 팁.
   - 나의 멘탈케어와 맞춤형 취미: 복덕궁 데이터 기반으로 어떤 취미나 여가 활동이 진정한 내면의 평화와 만족도를 가져다주는지 구체적으로 큐레이션하세요.
3. periodic_insight에서는 올해의 건강 리듬과 멘탈 관리 포인트를 날씨에 비유하여 구체적으로 설명하세요.
${commonRules}`
  };

  const systemPrompt = themePromptMap[theme] || themePromptMap['career'];

  // 6-1. 테마별 특수 컨텍스트 생성
  let themeSpecificContext = "";
  if (theme === 'career') {
    themeSpecificContext = `\n[신궁(후천적 가치관) 위치]: ${shenGongPalaceName}궁\n` + luStarPalacesInfo + "\n" + siHuaPalacesInfo;
  }

  let loveUserMessageJson: ReturnType<typeof buildLoveUserMessageJson> | null = null;

  const genericUserMessageJson = buildGenericReportUserMessageJson({
    theme,
    sajuData: saju_data ?? {},
    extractedStars,
    lifePalace,
    themePalaces,
    knowledgeBase,
    themeSpecificContext,
    periodicPalacesInfo,
  });
  let userContext = JSON.stringify(genericUserMessageJson);

  console.log("[OBIT DEBUG 8] Theme-specific config check. Theme:", theme);
  if (theme === 'love') {
    console.log("[OBIT DEBUG 8-1] Loading love configs from DB...");
    const configs = await loadLoveConfigs(adminClient);
    console.log("[OBIT DEBUG 8-2] love configs loaded. Extracting matches...");
    const datingDatabaseMatches = extractDatingDatabaseMatches(
      configs,
      extractedStars ?? {},
      saju_data?.date ?? null,
      runtimeLiunian
    );
    console.log("[OBIT DEBUG 8-3] Matches extracted. Building prompt JSON...");

    loveUserMessageJson = buildLoveUserMessageJson({
      userInput: {
        birthDate: saju_data?.date ?? null,
        birthTime: saju_data?.time ?? null,
        gender: saju_data?.gender === 'M' ? '남성' : (saju_data?.gender === 'F' ? '여성' : saju_data?.gender ?? null),
        location: saju_data?.location ?? null,
      },
      extractedStars: extractedStars ?? {},
      periodicFlowText: periodicPalacesInfo,
      datingDatabaseMatches,
    });
    userContext = JSON.stringify(loveUserMessageJson);
    console.log("[OBIT DEBUG 9] Love prompt JSON built.");
  }


  // 7. OpenAI API 호출
  let parsedContent = null;

  // E2E 테스트용 모킹 분기
  if (order.saju_data?.e2e_mock_gemini?.startsWith('success_prompt')) {
    if (process.env.NODE_ENV !== "production") {
      try {
        fs.writeFileSync(
          path.join(process.cwd(), ".gemini_mock.log"),
          JSON.stringify({
            systemPrompt,
            userContext,
            genericUserMessageJson,
            loveUserMessageJson,
          }, null, 2)
        );
      } catch {
        // ignore
      }
    }
    if (theme === 'career' || theme === 'love') {
      parsedContent = {
        markdown: `## 자미두수 ${theme === 'career' ? '커리어' : '연애'} 분석 리포트\n\n이것은 모의(Mock) 마크다운 리포트 결과입니다. 백엔드 E2E 테스트를 위해 생성되었습니다.`
      };
    } else {
      parsedContent = {
        teaser_quote: `Mock Teaser for ${theme}`,
        core_trait: "Mock Core Trait",
        theme_insight: "Mock Theme Insight",
        periodic_insight: "Mock Periodic Insight"
      };
    }
  } else {
    try {
      // E2E 테스트용 재시도/실패 모킹
      if (order.saju_data?.e2e_mock_gemini === 'fail_max_retries') {
        throw new Error(`Simulated AI Error`);
      }
      if (order.saju_data?.e2e_mock_gemini === 'fail_retry_success') {
        const attempts = order.saju_data?.retry_count || 0;
        if (attempts < 1) {
          // 첫 시도 실패, retry_count 증가시켜 다음 수동 재생성 시에는 통과하도록 함
          const retryAdminClient = createSupabaseAdminClient();
          const newSajuData = { ...order.saju_data, retry_count: attempts + 1 };
          await retryAdminClient.from("orders").update({ saju_data: newSajuData }).eq("id", order.id);

          throw new Error(`Simulated AI Error for retry`);
        }
      }

      console.log("[OBIT DEBUG 10] Calling OpenAI API (gpt-4o-mini)...");
      const openai = new OpenAI({ apiKey: getOpenAiApiKey() });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext }
        ]
      });

      const responseText = response.choices[0].message.content || "";
      console.log("[OBIT DEBUG 11] OpenAI response received. Length:", responseText.length);

      if (theme === 'career' || theme === 'love') {
        let cleanedMarkdown = cleanMarkdown(responseText);
        // 연애 테마: 후처리로 누출된 전문용어를 병기 형태로 치환하고, 5-2 연애 팁 섹션을 저장 전에 제거
        if (theme === 'love') {
          cleanedMarkdown = stripLoveTipSection(sanitizeTerminology(cleanedMarkdown)).markdown;
        }
        parsedContent = { markdown: cleanedMarkdown };
      } else {
        parsedContent = JSON.parse(responseText);

        // JSON 파싱 후, AI가 실수로 문자열 대신 객체를 반환했을 경우에 대한 안전 장치(Fallback)
        if (parsedContent && typeof parsedContent === "object") {
          for (const key of ["teaser_quote", "core_trait", "theme_insight", "periodic_insight"]) {
            if (parsedContent[key] && typeof parsedContent[key] === "object") {
              parsedContent[key] = Object.values(parsedContent[key]).join("\n\n");
            }
          }
        }
      }

    } catch (error) {
      console.error(`OpenAI API 호출 실패:`, error);
      throw new Error(`OpenAI API 호출 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    }
  }

  if (parsedContent) {
    const { data: updateData, error: updateError } = await adminClient.from("reports").update({
      content: parsedContent,
      status: "completed",
      generated_at: new Date().toISOString()
    }).eq("id", reportId).select();
    
    assertReportGenerationUpdateApplied({
      updateErrorMessage: updateError?.message,
      updatedRows: updateData,
    });

    console.log("[OBIT DEBUG 12] DB update succeeded. Affected rows:", updateData?.length);

    // 텔레그램 알림: 리포트 생성 성공
    await sendTelegramNotification(`✨ <b>[리포트 생성 완료]</b>\n주문번호: <code>${orderId}</code>\nAI가 성공적으로 별빛 이야기를 해독했습니다!`);

    // 관리자 페이지 등에서 최신 데이터를 볼 수 있도록 캐시 무효화
    revalidatePath('/admin/order-list');
    revalidatePath(`/admin/order-list/${orderId}`);
    revalidatePath('/reports');
    revalidatePath(`/reports/${orderId}`);

    return { success: true, reportId };
  }

  throw new Error("리포트 생성 결과가 비어 있습니다.");
  } catch (error) {
    console.error("[OBIT REPORT GENERATION FAILED]", error);
    await notifyReportFailure("리포트 생성 처리 오류", error);
    revalidatePath('/reports');
    revalidatePath(`/reports/${orderId}`);
    throw error;
  }
}


function formatPalaceStars(palace?: ExtractedPalace | null): string {
  if (!palace) return "데이터 없음";
  const formatStar = (star: StarWithSiHua) => `${star.name}${star.sihua ? `[${star.sihua}]` : ''}`;
  const major = palace.majorStars?.map(formatStar).join(", ") || "";
  const lucky = palace.luckyStars?.map(formatStar).join(", ") || "";
  const unlucky = palace.unluckyStars?.map(formatStar).join(", ") || "";
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
  const adminClient = createSupabaseAdminClient();

  const { error } = await adminClient.from("reports").update({ is_public: true }).eq("order_id", orderId);
  if (error) {
    console.error("makeReportPublic error:", error);
    return { success: false, error: "Update failed" };
  }

  return { success: true };
}
