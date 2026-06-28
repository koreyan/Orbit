"use server";

import { revalidatePath } from "next/cache";
import { extractLoveTags, filterThemePalaces, findLokJonPalace, findSiHuaPalaces } from "@/lib/ziwei-extractor";
import type { ExtractedPalace, LoveTagData, StarWithSiHua } from "@/lib/ziwei-extractor";
import { fetchKnowledgeBaseForLove, fetchKnowledgeBaseForStars, formatKnowledgeBaseContext } from "@/lib/knowledge-base";
import OpenAI from "openai";
import { sendTelegramNotification } from "@/lib/telegram";
import { createChart, calculateLiunian } from "@orrery/core/ziwei";
import type { LiunianData, ZiweiChart } from "@/lib/ziwei-types";
import { translateZiwei } from "@/lib/ziwei-translator";
import fs from "node:fs";
import path from "node:path";

export async function generateReportAction(orderId: string) {
  if (!orderId) throw new Error("No orderId provided");

  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData?.user?.id;

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. 주문 정보 가져오기 (adminClient로 가져와서 권한 체크 수행)
  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("주문 정보를 찾을 수 없습니다.");
  }

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
  const extractedStars = saju_data?.extracted_stars;

  if (!extractedStars) {
    throw new Error("명반 추출 데이터가 없습니다.");
  }

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

  // 3. 테마에 따른 궁 필터링
  const { lifePalace, themePalaces } = filterThemePalaces(extractedStars, theme);

  // 3-1. 대한(Da Han) 및 유년(Liu Nian) 테마 궁 추출
  let periodicPalacesInfo = "";
  let loveMyeongbanContext = "";
  const daHanThemePalaces: ExtractedPalace[] = [];
  const liuNianThemePalaces: ExtractedPalace[] = [];
  let shenGongPalaceName = "알 수 없음";
  
  try {
    const { date, time, gender } = saju_data;
    if (date && time && gender) {
      const [y, m, d] = date.split("-").map(Number);
      const [h, min] = time.split(":").map(Number);
      const isMale = gender === "M";
      const chartData = createChart(y, m, d, h, min, isMale) as ZiweiChart;
      const currentYear = new Date().getFullYear();
      const liunian = calculateLiunian(chartData, currentYear) as LiunianData;

      const shengongTranslation: Record<string, string> = {
        '命宮': '명궁',
        '夫妻': '부처궁',
        '財帛': '재백궁',
        '遷移': '천이궁',
        '官祿': '관록궁',
        '福德': '복덕궁'
      };
      const shenGongZhi = chartData.shenGongZhi;
      const matchingShenGong = Object.entries(chartData.palaces).find(([, p]) => p.zhi === shenGongZhi);
      if (matchingShenGong) {
        shenGongPalaceName = shengongTranslation[matchingShenGong[0]] || matchingShenGong[0];
      }

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
          if (extractedStars[targetName]) daHanThemePalaces.push(extractedStars[targetName]);
        });
      }

      // 유년 테마 궁 찾기 (liunian.palaces 기준 지지)
      targetOffsets.forEach(offset => {
        const themePalaceName = PALACE_ORDER[offset];
        const targetZhi = liunian.palaces[themePalaceName];
        if (targetZhi) {
          const matchingPalaceEntry = Object.entries(chartData.palaces).find(([, p]) => p.zhi === targetZhi);
          if (matchingPalaceEntry) {
            const natalPalaceName = matchingPalaceEntry[0];
            if (extractedStars[natalPalaceName]) liuNianThemePalaces.push(extractedStars[natalPalaceName]);
          }
        }
      });

      // 테마별 유년/대한 흐름 분석
      const yearsToAnalyze = theme === 'love' ? 5 : 10;
      let yearsInfo = "";
      for (let i = 0; i < yearsToAnalyze; i++) {
        const year = currentYear + i;
        const yearlyLiunian = calculateLiunian(chartData, year) as LiunianData;
        
        // 해당 연도의 유년 명궁 찾기
        const liunianMingZhi = yearlyLiunian.palaces['命宮'];
        let mingPalaceInfo = "데이터 없음";
        if (liunianMingZhi) {
          const matchingEntry = Object.entries(chartData.palaces).find(([, p]) => p.zhi === liunianMingZhi);
          if (matchingEntry && extractedStars[matchingEntry[0]]) {
            mingPalaceInfo = formatPalaceStars(extractedStars[matchingEntry[0]]);
            // 분석 대상 별 추가
            if (extractedStars[matchingEntry[0]].majorStars) {
              extractedStars[matchingEntry[0]].majorStars.forEach(() => {
                daHanThemePalaces.push(extractedStars[matchingEntry[0]]);
              });
            }
          }
        }
        
        yearsInfo += `- ${year}년 (만 ${year - y}세) - 현재 대운(${yearlyLiunian.daxianAgeStart}~${yearlyLiunian.daxianAgeEnd}세) 구간. 해당 연도의 중심 에너지: ${mingPalaceInfo}\n`;
      }

      periodicPalacesInfo = `
[앞으로 ${yearsToAnalyze}년간의 대한(大限) 및 유년(流年) 흐름 데이터]
${yearsInfo}
`;

      if (theme === 'love') {
        loveMyeongbanContext = `
[연애 리포트 입력 구조 - 자미두수 원본 근거]
- 명궁(命宮): ${formatPalaceStars(extractedStars['命宮'])}
- 부부궁(夫妻宮): ${formatPalaceStars(extractedStars['夫妻'])}
- 복덕궁(福德宮): ${formatPalaceStars(extractedStars['福德'])}
- 자녀궁(子女宮): ${formatPalaceStars(extractedStars['子女'])}
- 천희(天喜)/홍란(紅鸞): ${formatRawStarLocations(chartData, ['天喜', '紅鸞'])}
- 천량(天梁)/천기(天機)/태음(太陰) 등 감정 관련 성신 배치: ${formatRawStarLocations(chartData, ['天梁', '天機', '太陰'])}
- 기타 참고 성신: ${formatRawStarLocations(chartData, ['火星', '擎羊', '貪狼', '廉貞', '天馬', '天月', '文昌', '文曲'])}
- 대한(大限) 및 유년(流年) 흐름: 아래 시기 흐름 데이터를 우선 사용
`;
      }
    }
  } catch (error) {
    console.error("Failed to extract periodic theme palaces:", error);
  }

  // 분석 대상 별 추출 (중복 제거)
  const starsToAnalyze = new Set<string>();
  const addStars = (palace?: ExtractedPalace | null) => {
    if (!palace) return;
    if (palace.majorStars) palace.majorStars.forEach((s: StarWithSiHua) => {
      starsToAnalyze.add(s.name);
      if (s.sihua) starsToAnalyze.add(s.sihua);
    });
    if (palace.luckyStars) palace.luckyStars.forEach((s: StarWithSiHua) => {
      starsToAnalyze.add(s.name);
      if (s.sihua) starsToAnalyze.add(s.sihua);
    });
    if (palace.unluckyStars) palace.unluckyStars.forEach((s: StarWithSiHua) => {
      starsToAnalyze.add(s.name);
      if (s.sihua) starsToAnalyze.add(s.sihua);
    });
  };

  addStars(lifePalace);
  themePalaces.forEach((p) => addStars(p));
  if (theme === 'love') {
    addStars(extractedStars['福德']);
  }
  daHanThemePalaces.forEach(p => addStars(p));
  liuNianThemePalaces.forEach(p => addStars(p));

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

  // 5. 지식베이스 (Ground Truth) 로드
  const knowledgeBase = theme === 'love'
    ? {}
    : await fetchKnowledgeBaseForStars(adminClient, Array.from(starsToAnalyze));
  const loveKnowledgeBase = theme === 'love'
    ? await fetchKnowledgeBaseForLove(
        adminClient,
        Array.from(starsToAnalyze),
        [
          '부처궁',
          '부부궁',
          '자녀궁',
          '천이궁',
          '복덕궁',
          '명궁',
          '신궁'
        ],
        [
          '도화성',
          '도화',
          '홍란성',
          '홍란',
          '천희성',
          '천희',
          '함지성',
          '함지',
          '천마',
          '천월'
        ]
      )
    : [];

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
당신은 자미두수 기반 연애 리포트 작성 전문가입니다.
사용자의 명반 데이터를 분석하여, 솔로 타겟 연애 리포트를 작성합니다.

당신의 목표는 사용자가 "왜 내 연애가 안 풀렸는지, 어떤 사람을 만나야 하는지, 어떻게 인연을 열어야 하는지"를 이해하게 만드는 것입니다.

---

## 대상

현재 연애 중이 아닌 사람. 관계 유지보다 인연 유입과 연애 진입 전략에 집중한다.

---

## 입력 구조

사용자의 명반 데이터가 다음 형식으로 제공됩니다:

- 명궁(命宮): [궁위] + [주요 성신]
- 부부궁(夫妻宮): [궁위] + [주요 성신]
- 천희(天喜)/홍란(紅鸞): [위치 및 상태]
- 복덕궁(福德宮): [궁위] + [주요 성신]
- 천량(天梁)/천기(天機)/태음(太陰) 등 감정 관련 성신 배치
- 대한(大限) 및 유년(流年) 흐름
- 기타 참고 성신: 화성(火星), 경양(擎羊), 탐랑(貪狼), 염정(廉貞) 등

---

## 출력 구조

반드시 아래 7섹션 순서로 작성한다. 섹션 제목은 그대로 사용한다.

### 1. 왜 아직 연애가 잘 안 풀리는가

작성 내용:
- 반복되는 연애 실패 패턴: 부부궁과 명궁의 상호작용으로 분석
- 사람을 볼 때 자주 빠지는 착각: 복덕궁과 감정 반응 성신으로 분석
- 감정적으로 쉽게 소모되는 지점: 사안(四安) 구조와 화성/경양 영향으로 분석
- 연애를 시작하기도 전에 막히는 이유: 명궁 성신의 진입 성향으로 분석
- 신중함과 몰입의 불균형: 태음/천기/천량 배치로 분석

작성 규칙:
- "운이 없어서"라는 표현 금지
- 구체적인 행동 패턴으로 설명 (예: "상대의 다정함에立刻 반응한다" / "호감이 생겨도 표현을 3번 이상 미룬다")
- 최대 5문단, 각 문단 2~3문장

### 2. 내가 끌리는 사람 vs 실제로 잘 맞는 사람

작성 내용:
- 끌리는 유형: 천희/홍란 위치 + 부부궁 주성으로 도출
- 감정적으로 강하게 반응하는 상대: 명궁 대 부부궁 충돌 구조로 도출
- 현실적으로 오래 가는 상대: 복덕궁 안정 성신으로 도출
- 불안하게 만드는 상대 유형: 화성/경양/탐랑이 부부궁에 미치는 영향으로 도출
- 피해야 할 관계 패턴: 부부궁 형살(刑殺) 구조로 도출

작성 규칙:
- 반드시 비교 테이블 포함 (끌리는 사람 vs 잘 맞는 사람)
- "이상형"이라는 단어 대신 "끌리는 유형" 사용
- 불안 유발 유형은 구체적 행동 특징으로 서술 (성격 라벨링 금지)

### 3. 나의 연애 매력 자산

3개 하위 섹션 필수:

#### 3-1. 분위기와 첫인상 매력
- 명궁 주성에서 첫인상 키워드 도출 (예: 자미-위엄, 천기-지적, 태양-밝음, 무곡-단단함, 천동-부드러움, 염정-강렬함, 천부-넉넉함, 태음-은은함, 탐랑-매혹함, 거문-차분함, 천상-온화함, 천량-관대함, 칠살-날카로움, 파군-개성적)
- 명궁 궁위(지지)도 반영 (예: 자궁-신비감, 오궁-당당함, 묘궁-부드러움, 유궁-우아함)
- 매력이 잘못된 방향으로 작동하는 지점 분석

#### 3-2. 대화와 정서적 매력
- 복덕궁 주성에서 대화 매력 도출 (예: 천기-깊이 있는 대화, 태음-공감 대화, 천량-포용력 있는 대화, 문창-재치 있는 대화, 문곡-감성적 대화, 거문-차분한 대화, 파군-독창적 대화)
- 복덕궁에 들어온 성신(화성-열정적 교감, 경양-직설적 소통, 좌보/우필-부드러운 소통, 창곡-감각적 표현)도 매력에 반영
- 상대가 나를 다시 떠올리게 되는 이유
- 정서적 매력 과발동 주의점

#### 3-3. 외적/표현 매력
- 명궁 및 삼방사정(三方四正) 성신에서 표현 매력 도출 (예: 문창-글과 말의 매력, 문곡-표정과 제스처 매력, 천월-청순한 인상, 천마-활동적 매력, 홍란-눈에 띄는 분위기)
- 탐랑/염정은 관능적·강렬한 표현 매력, 천량/태음은 은은하고 절제된 매력으로 해석
- 스타일링에서 살아나는 포인트 구체 제시
- 자연스럽게 매력이 커지는 연출 방향

작성 규칙:
- 칭찬만 하지 않는다. 매력이 잘못 쓰이는 지점도 반드시 포함
- "당신은 매력적이다"식 공허한 칭찬 금지
- 구체적 상황에서 어떻게 작동하는지 서술

### 4. 인연이 들어오기 쉬운 방식

작성 내용:
- 인연 유입 환경: 천마(天馬)/천월(天月) 위치로 분석
- 최적 채널: 소개/모임/일/취미/지인연결 중 명반에서 도출
- 접근 방식: 먼저 다가가기 vs 자연스럽게 엮이기—명궁 성향으로 판단
- 관계 진입 초반 태도: 부부궁+명궁 상호작용으로 도출

작성 규칙:
- 구체적 상황 예시 포함 (예: "친한 지인이 소개해주는 자리에서 첫인상이 가장 잘 산다")
- "인연이 있는 곳에 가라"식 막연한 조언 금지
- 최대 4문단

### 5. 내가 경계해야 할 솔로 패턴

작성 내용:
- 명반에서 도출된 3개 핵심 반복 패턴
- 각 패턴: 이름 + 설명 + 이것 때문에 반복되는 결과

도출 기준:
- 사람을 쉽게 믿지 못하는 패턴: 명궁에 천기/태음+형삼
- 너무 빨리 몰입하는 패턴: 탐랑/염정이 명궁 또는 부부궁에 영향
- 애매한 관계를 오래 끄는 패턴: 천량+문창이 부부궁에 영향
- 외로움에 흔들리는 패턴: 복덕궁 공허+천월
- 마음은 큰데 표현은 약한 패턴: 태음+천량이 명궁

작성 규칙:
- 정확히 3개 패턴만 작성 (가장 강하게 작동하는 것 우선)
- 판단적 표현 금지 ("고쳐야 합니다" → "이 패턴이 반복되면 ~합니다")
- 각 패턴 3~4문장

### 6. 앞으로 5년 인연 흐름

작성 내용:
- 대한(大限) 및 유년(流年) 흐름 기반 5년 분석
- 연도별: 흐름 + 해야 할 것 + 피해야 할 것

작성 규칙:
- "연애운이 좋다/나쁘다" 표현 금지
- 인연 유입, 감정 기복, 관계 진입 가능성, 선택 주의 중심으로 서술
- 반드시 테이블 형식으로 출력
- 구체적 행동 권장 (예: "새로운 모임에 가입하기" / "감정적 결정 미루기")
- 성사 여부 단정 금지

### 7. 지금 당장 해야 할 연애 준비

작성 내용:
- 말투와 태도 교정: 명궁 성향 기반
- 소개팅/썸/첫 대화 주의점: 부부궁+명궁 조합 기반
- 스타일링 포인트: 표현 매력 성신 기반
- 감정 표현 방식: 복덕궁+태음/천기 배치 기반
- 관계 초반 주도권: 명궁 주성 기반
- 외로움에 흔들리지 않는 기준: 복덕궁+천월 상태 기반

작성 규칙:
- 추상적 조언 금지 ("자신감을 가지세요" → "첫 대화에서 상대 질문에 1문장으로 답하고 1문장 질문을 던지세요")
- 각 항목 2~3문장, 실행 가능해야 함
- 기준 설정은 구체적 1~2개 항목으로 (예: "두 번 연속 약속을 미루는 사람은 만나지 않는다")

---

## 톤 규칙

1. 따뜻하고 다독이는 말투. 사용자가 "내 마음을 아는 것 같다"고 느끼게 작성한다
2. 힘든 걸 먼저 알아주고, 그 위에서 방향을 제시한다
3. "운이 좋다/나쁘다" 판단 금지 → "이런 흐름이다"로 서술
4. 점집 느낌 배제 → 나를 이해하게 해주는 조언자 톤
5. 성격 라벨링 금지 ("B형 같은 사람") → 구체적 행동 패턴으로 서술
6. "당신은 ~한 사람입니다"식 규정 금지 → "당신은 ~하는 경향이 있죠"로 서술
7. 인사이트와 위로를 함께. 분석만 하거나 위로만 하지 않는다
8. 두려움보다 선택권 강조. "괜찮아요, 이제 방법을 알았으니까"의 흐름
9. 공감 먼저, 조언은 그 다음. "그동안 혼자 감당하느라 고생했겠어요" 같은 문맥에서 시작

## 전문용어 변환 규칙

자미두수 용어는 반드시 내부 분석 근거로만 사용하고, 최종 리포트에는 일반인이 바로 이해할 수 있는 생활 언어로 풀어서 쓴다.

출력 금지 용어:
- 명궁, 부부궁, 복덕궁, 자녀궁, 대한, 유년, 사안, 형살, 성신, 주성, 보조성
- 천희, 홍란, 천량, 천기, 태음, 화성, 경양, 탐랑, 염정, 천마, 천월, 문창, 문곡 등 별 이름
- 한자 표기와 괄호 병기: 命宮, 夫妻宮, 福德宮, 大限, 流年 등

변환 예시:
- 명궁 → 타고난 성향과 첫 반응 패턴
- 부부궁 → 관계 안에서 편안함을 느끼는 방식
- 복덕궁 → 혼자 있을 때의 감정 습관과 정서적 만족 기준
- 자녀궁 → 본능적으로 드러나는 매력과 표현 방식
- 천희/홍란 → 설렘이 쉽게 켜지는 지점
- 천량/천기/태음 → 신중함, 생각의 반복, 감정의 깊이
- 화성/경양 → 감정이 급해지거나 날카롭게 반응하는 순간
- 탐랑/염정 → 강한 끌림과 빠른 몰입 패턴
- 대한/유년 → 앞으로 몇 년간 반복될 관계 흐름

작성 방식:
- "부부궁이 약해서"라고 쓰지 말고, "관계가 가까워질수록 상대의 반응을 오래 확인하려는 경향이 있습니다"처럼 쓴다.
- "천희가 있어서"라고 쓰지 말고, "처음부터 분위기가 부드럽고 대화가 자연스러운 사람에게 설렘이 빨리 켜집니다"처럼 쓴다.
- "유년 흐름상"이라고 쓰지 말고, "이 시기에는 새로운 사람을 만나도 바로 결론 내리기보다 감정의 속도를 조절하는 편이 좋습니다"처럼 쓴다.

## 금지사항

- 연애 성사 여부 단정 ("올해 연애가 됩니다")
- 특정 인물이나 직업 권장 ("의사를 만나세요")
- 운명론적 표현 ("운명의 상대", "필연적 만남")
- 보편적 조언으로 개인화 희석 ("누구에게나 중요한 것은...")
- "고쳐야 합니다", "반드시 하셔야 합니다" 지시형 표현
- 과장된 긍정 ("당신은 정말 매력적인 분입니다")
- 최종 리포트에 자미두수 전문용어를 그대로 노출하는 표현

## 출력 형식

출력은 마크다운 형식 문자열로 반환한다. 프론트엔드에서 마크다운 렌더링을 전제로 작성한다.

마크다운 작성 규칙:
- 섹션 구분: \`---\` 수평선 사용
- 제목 계층: \`#\` 리포트 제목 → \`##\` 섹션 → \`###\` 하위 섹션
- 테이블: 마크다운 테이블 문법 준수
- 강조: 볼드체(\`**\`)만 사용
- 목록: 불릿(\`-\`)과 번호(\`1.\`) 적절히 혼용
- 전체 분량: 3,000~4,000자 (공백 제외)
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
  const loveTagData: LoveTagData | null = theme === 'love'
    ? extractLoveTags(extractedStars, shenGongPalaceName, periodicPalacesInfo)
    : null;
  let themeSpecificContext = "";
  if (theme === 'love') {
    // 연애 프롬프트 가이드가 요구하는 명궁/부부궁/복덕궁/도화성/시기 흐름 근거를 명시적으로 전달
    const spousePalace = extractedStars['夫妻'];
    const fortunePalace = extractedStars['福德'];
    const childrenPalace = extractedStars['子女'];
    themeSpecificContext = `${loveMyeongbanContext}\n[신궁(後天的 가치관) 위치]: ${shenGongPalaceName}궁\n`;
    themeSpecificContext += `
[연애 핵심 분석 궁위]
- 부부궁(夫妻宮, 관계 태도/끌리는 유형/충돌 패턴): ${formatPalaceStars(spousePalace)}
- 복덕궁(福德宮, 감정 반응/정서적 만족/외로움 기준): ${formatPalaceStars(fortunePalace)}
`;
    if (childrenPalace) {
      themeSpecificContext += `
[나의 본능적 매력 자산 (도화/플러팅 스타일 분석용)] - 이 데이터는 타인을 본능적으로 끌어당기는 숨겨진 매력을 의미합니다.
- ${childrenPalace.name}궁 환경: ${formatPalaceStars(childrenPalace)}
`;
    }
    if (loveTagData) {
      themeSpecificContext += `
[연애 태그 8종 요약] - 아래 항목은 리포트의 해석 우선순위를 정하는 내부 분류입니다.
- attraction_pattern: ${loveTagData.attraction_pattern}
- compatible_partner: ${loveTagData.compatible_partner}
- conflict_pattern: ${loveTagData.conflict_pattern}
- solo_blocker: ${loveTagData.solo_blocker}
- charm_asset: ${loveTagData.charm_asset}
- encounter_path: ${loveTagData.encounter_path}
- timing_signal: ${loveTagData.timing_signal}
- action_guide: ${loveTagData.action_guide}
`;
    }
  } else if (theme === 'career') {
    themeSpecificContext = `\n[신궁(후천적 가치관) 위치]: ${shenGongPalaceName}궁\n` + luStarPalacesInfo + "\n" + siHuaPalacesInfo;
  }

  const knowledgeBaseContext = theme === 'love'
    ? formatKnowledgeBaseContext(loveKnowledgeBase)
    : `
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

  const userContext = `
선택한 테마: ${theme}

[유저의 기질 및 운세 데이터 (절대 이 용어들을 결과에 직접 노출하지 말 것)]
- 타고난 본질: ${formatPalaceStars(lifePalace)}
- 테마별 행동 방식: ${themePalaces.map((p) => `${p.name} 환경: ${formatPalaceStars(p)}`).join(" | ")}
${themeSpecificContext}
${periodicPalacesInfo}

${knowledgeBaseContext}
`;

  // 7. OpenAI API 호출
  let parsedContent = null;

  // E2E 테스트용 모킹 분기
  if (order.saju_data?.e2e_mock_gemini?.startsWith('success_prompt')) {
    if (process.env.NODE_ENV !== "production") {
      try {
        fs.writeFileSync(
          path.join(process.cwd(), ".gemini_mock.log"), 
          JSON.stringify({ systemPrompt, userContext }, null, 2)
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
          const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
          const adminClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          const newSajuData = { ...order.saju_data, retry_count: attempts + 1 };
          await adminClient.from("orders").update({ saju_data: newSajuData }).eq("id", order.id);
          
          throw new Error(`Simulated AI Error for retry`);
        }
      }

      console.log(`OpenAI API 호출 시도...`);
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext }
        ]
      });

      const responseText = response.choices[0].message.content || "";
      
      if (theme === 'career' || theme === 'love') {
        let cleanedMarkdown = responseText.trim();
        if (cleanedMarkdown.startsWith("```markdown")) {
          cleanedMarkdown = cleanedMarkdown.substring("```markdown".length).trim();
        } else if (cleanedMarkdown.startsWith("```")) {
          cleanedMarkdown = cleanedMarkdown.substring("```".length).trim();
        }
        if (cleanedMarkdown.endsWith("```")) {
          cleanedMarkdown = cleanedMarkdown.substring(0, cleanedMarkdown.length - "```".length).trim();
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
      await adminClient.from("reports").update({ status: "failed" }).eq("id", reportId);
      // 텔레그램 알림: 리포트 생성 실패
      await sendTelegramNotification(`❌ <b>[리포트 생성 실패]</b>\n주문번호: <code>${orderId}</code>\n사유: OpenAI API 호출 오류\n에러: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
      throw new Error("리포트 생성에 실패했습니다. (API 호출 오류)");
    }
  }

  // 8. 결과 저장
  if (parsedContent) {
    await adminClient.from("reports").update({
      content: parsedContent,
      status: "completed",
      generated_at: new Date().toISOString()
    }).eq("id", reportId);

    // 텔레그램 알림: 리포트 생성 성공
    await sendTelegramNotification(`✨ <b>[리포트 생성 완료]</b>\n주문번호: <code>${orderId}</code>\nAI가 성공적으로 별빛 이야기를 해독했습니다!`);

    // 관리자 페이지 등에서 최신 데이터를 볼 수 있도록 캐시 무효화
    revalidatePath('/admin/order-list');
    revalidatePath(`/admin/order-list/${orderId}`);

    return { success: true, reportId };
  }
}

/** 궁에 배속된 별 정보를 포맷팅하는 유틸 함수 */
function formatPalaceStars(palace?: ExtractedPalace | null): string {
  if (!palace) return "데이터 없음";
  const major = palace.majorStars?.map((s) => `${s.name}${s.sihua ? `[${s.sihua}]` : ''}`).join(", ") || "";
  const lucky = palace.luckyStars?.map((s) => `${s.name}${s.sihua ? `[${s.sihua}]` : ''}`).join(", ") || "";
  const unlucky = palace.unluckyStars?.map((s) => `${s.name}${s.sihua ? `[${s.sihua}]` : ''}`).join(", ") || "";
  return `핵심 에너지: [${major || '비어있음'}], 보조 에너지: [${lucky || '없음'}], 주의할 에너지: [${unlucky || '없음'}]`;
}

/** 원본 명반에서 특정 성신의 위치를 찾는 유틸 함수 */
function formatRawStarLocations(chartData: ZiweiChart, starNames: string[]): string {
  const locations: string[] = [];

  Object.entries(chartData.palaces).forEach(([palaceName, palace]) => {
    const matchedStars = palace.stars
      .filter((star) => starNames.includes(star.name))
      .map((star) => `${translateZiwei(star.name)}(${star.name})`);

    if (matchedStars.length > 0) {
      locations.push(`${matchedStars.join(', ')}: ${translateZiwei(palaceName)}궁`);
    }
  });

  return locations.length > 0 ? locations.join(' / ') : '해당 성신 위치 데이터 없음';
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
