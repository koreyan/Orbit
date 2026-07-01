import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const MOCK_LOG_PATH = path.join(process.cwd(), '.gemini_mock.log');

test.describe.serial('AI Prompt Generation & Jargon-Free E2E', () => {

  const dummyEmails = {
    career: 'u01099993331@orbit-app.com',
    love: 'u01099993332@orbit-app.com',
    hobby: 'u01099993333@orbit-app.com'
  };

  const dummyPhones = {
    career: '01099993331',
    love: '01099993332',
    hobby: '01099993333'
  };

  const dummyUserIds: Record<string, string> = {};
  const dummyOrderIds: Record<string, string> = {};
  const dummyReportIds: Record<string, string> = {};

  test.beforeAll(async () => {
    if (fs.existsSync(MOCK_LOG_PATH)) {
      fs.unlinkSync(MOCK_LOG_PATH);
    }

    for (const theme of ['career', 'love', 'hobby']) {
      // 1. 기존 유저 정리
      const email = dummyEmails[theme as keyof typeof dummyEmails];
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData.users.find((u) => u.email === email);
      if (existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      }

      // 2. 유저 생성
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'test_password_orbit',
        email_confirm: true,
        user_metadata: { phone_number: dummyPhones[theme as keyof typeof dummyPhones] }
      });

      if (signUpError || !signUpData.user) throw new Error(`User creation failed: ${signUpError?.message}`);
      dummyUserIds[theme] = signUpData.user.id;

      // 3. 더미 주문서 생성 (테마별)
      // Jargon-Free 검증을 위해 명리학 용어(명궁, 태양성 등)가 포함된 더미 데이터를 주입
      const sajuData = {
        date: "1990-01-01",
        time: "12:00",
        gender: "M",
        extracted_stars: {
          '命宮': { name: '명궁', majorStars: [{ name: '태양성' }, { name: '천동성', sihua: '화기' }] },
          '夫妻': { name: '부처궁', majorStars: [{ name: '자미성' }] },
          '子女': { name: '자녀궁', majorStars: [{ name: theme === 'love' ? '태음' : '탐랑성' }] },
          '財帛': { name: '재백궁', luckyStars: [{ name: '녹존' }] },
          '疾厄': { name: '질액궁', unluckyStars: [{ name: '경양' }] },
          '官祿': { name: '관록궁', majorStars: [{ name: '천기성' }] },
          '福德': { name: '복덕궁', majorStars: [{ name: '천량성' }] }
        },
        e2e_mock_gemini: 'success_prompt'
      };

      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: dummyUserIds[theme],
          theme,
          amount: 990,
          status: 'paid', // 이미 결제 완료된 상태여야 리포트 생성이 가능함
          saju_data: sajuData
        })
        .select('id')
        .single();

      if (orderError || !orderData) throw new Error(`Order creation failed: ${orderError?.message}`);
      dummyOrderIds[theme] = orderData.id;

      // 4. 더미 리포트 레코드 생성 (pending 상태로 두면 ReportContent.tsx가 트리거함)
      const { data: reportData, error: reportError } = await supabaseAdmin
        .from('reports')
        .insert({
          order_id: dummyOrderIds[theme],
          status: 'pending',
          is_public: true
        })
        .select('id')
        .single();
      
      if (reportError || !reportData) throw new Error(`Report creation failed: ${reportError?.message}`);
      dummyReportIds[theme] = reportData.id;
    }
  });

  test.afterAll(async () => {
    for (const theme of ['career', 'love', 'hobby']) {
      const id = dummyUserIds[theme];
      if (id) await supabaseAdmin.auth.admin.deleteUser(id);
    }
    if (fs.existsSync(MOCK_LOG_PATH)) {
      fs.unlinkSync(MOCK_LOG_PATH);
    }
  });

  // 모든 테마에 대한 Jargon-Free 규칙 검증 함수
  const assertJargonFreeRule = (systemPrompt: string) => {
    expect(systemPrompt).toContain('[절대 지켜야 할 철칙 - 위반 시 실패]');
    expect(systemPrompt).toContain('"자미두수", "명궁", "관록궁", "재백궁", "주성", "살성", "화기", "차성안궁" 등 모든 명리학적 전문 용어와 한자어의 출력을 100% 절대 금지합니다.');
  };

  const loginAsThemeUser = async (page: import('@playwright/test').Page, theme: keyof typeof dummyPhones) => {
    await page.goto('/login');
    await page.getByLabel('휴대전화 번호').pressSequentially(dummyPhones[theme]);
    await page.getByLabel('비밀번호').fill('test_password');
    await page.getByRole('button', { name: '내 별빛 이야기 꺼내보기' }).click();
    await page.waitForURL('**/reports', { timeout: 10000 });
  };

  test('커리어(career) 테마 프롬프트 분기 및 검증', async ({ page }) => {
    await loginAsThemeUser(page, 'career');
    await page.goto(`/reports/${dummyOrderIds['career']}`);
    
    // 리포트가 완성되어 UI가 렌더링될 때까지 대기
    await expect(page.getByRole('heading', { name: '자미두수 커리어 분석 리포트' })).toBeVisible({ timeout: 10000 });

    expect(fs.existsSync(MOCK_LOG_PATH)).toBe(true);
    const logData = JSON.parse(fs.readFileSync(MOCK_LOG_PATH, 'utf-8'));
    
    // 커리어 전용 지침 포함 여부
    expect(logData.systemPrompt).toContain('자미두수 커리어 코칭');
    
    // 유저 컨텍스트 검증 (숨겨진 금광 등)
    expect(logData.userContext).toContain('선택한 테마: career');
  });

  test('연애(love) 테마 프롬프트 분기 및 검증', async ({ page }) => {
    await loginAsThemeUser(page, 'love');
    await page.goto(`/reports/${dummyOrderIds['love']}`);
    
    await expect(page.getByRole('heading', { name: '자미두수 연애 분석 리포트' })).toBeVisible({ timeout: 10000 });

    const logData = JSON.parse(fs.readFileSync(MOCK_LOG_PATH, 'utf-8'));
    
    expect(logData.systemPrompt).toContain('docs/ziwei-love-self-understanding-guide.md');
    expect(logData.systemPrompt).toContain('조언, 처방, 훈련법, 해야 할 일 중심으로 쓰지 않는다');
    expect(logData.systemPrompt).toContain('1단: 성향');
    expect(logData.systemPrompt).toContain('2단: 매력');
    expect(logData.systemPrompt).toContain('3단: 과발현');
    expect(logData.systemPrompt).toContain('4단: 관계 환경');
    expect(logData.systemPrompt).toContain('중간 패킷만 근거로 사용한다');
    expect(logData.systemPrompt).toContain('최종 출력 용어 변환 규칙');
    expect(logData.systemPrompt).toContain('별 이름을 쓰지 않는다');
    expect(logData.systemPrompt).toContain('생활 언어로 치환한다');
    expect(logData.systemPrompt).not.toContain('LOVE_ADVICE_RULES');
    expect(logData.systemPrompt).not.toContain('연애 조언 생성 파이프라인');
    expect(logData.systemPrompt).not.toContain('조언 후처리');
    expect(logData.systemPrompt).not.toContain('성별 본질론');
    expect(logData.systemPrompt).not.toContain('정복');
    expect(logData.systemPrompt).not.toContain('소유');
    expect(logData.systemPrompt).not.toContain('밀당');
    expect(logData.systemPrompt).not.toContain('조종');
    expect(logData.systemPrompt).not.toContain('data 디렉터리 근거');
    expect(logData.systemPrompt).not.toContain('정서적 매력과 외적 매력을 통합');
    expect(logData.systemPrompt).not.toContain('3-2. 잠재된 이성적 매력');
    expect(logData.systemPrompt).not.toContain('천이궁은 외부 반응과 인기의 보조 근거로만 사용합니다');
    expect(logData.systemPrompt).not.toContain('현재 매력 → 오작동 → 훈련법');
    
    // 연애 전용 컨텍스트 검증: guide packet stack
    expect(logData.userContext).toContain('[USER_CHART_DATA]');
    expect(logData.userContext).toContain('[FIXED_ZIWEI_REFERENCE]');
    expect(logData.userContext).toContain('[DYNAMIC_DB_EVIDENCE]');
    expect(logData.userContext).toContain('[GUIDE_TRANSLATION_PACKET]');
    expect(logData.userContext).toContain('[1단: 성향]');
    expect(logData.userContext).toContain('[2단: 매력]');
    expect(logData.userContext).toContain('[3단: 과발현]');
    expect(logData.userContext).toContain('[4단: 관계 환경]');
    expect(logData.userContext).toContain('[CHARM_PACKET]');
    expect(logData.userContext).toContain('[ENVIRONMENT_PACKET]');
    expect(logData.userContext).toContain('[TIMING_PACKET]');
    expect(logData.userContext).toContain('[MONTHLY_LIUYUE_FLOW]');
    expect(logData.userContext).toContain('- 1월');
    expect(logData.userContext).toContain('- 12월');
    expect(logData.userContext).toContain('월별 중심 궁위:');
    expect(logData.userContext).toContain('주요 별:');
    expect(logData.userContext).toContain('호감/인연 신호:');
    expect(logData.userContext).toContain('주의 신호:');
    expect(logData.userContext).toContain('해석 근거:');
    expect(logData.userContext).toContain('예상 상황:');
    expect(logData.userContext).toContain('태그별 보강 근거');
    expect(logData.userContext).not.toContain('[TRAIT_FINDINGS]');
    expect(logData.userContext).not.toContain('[RISK_PATTERNS]');
    expect(logData.userContext).not.toContain('[LOVE_ADVICE_RULES]');
    expect(logData.userContext).not.toContain('조언 방향:');
    expect(logData.userContext).not.toContain('실행 예시:');
    expect(logData.userContext).not.toContain('action_guide');
    expect(logData.userContext).not.toContain('시기별 조언:');
    expect(logData.userContext).not.toContain('커리어 방향성:');
    expect(logData.userContext).not.toContain('웰니스/여가:');
    expect(logData.userContext).not.toContain('섹션 1~5는 최대 2개, 섹션 6은 최대 3개, 전체 최대 6개');
    expect(logData.userContext).not.toContain('source_excerpt');
    expect(logData.userContext).not.toContain('sourceBook');
    expect(logData.userContext).toContain('가까워질수록 드러나는 매력');
    expect(logData.userContext).toContain('같은 성향의 건강한 발현과 과발현');
    expect(logData.userContext).not.toContain('[CHARM_ACTION_RULES]');
    expect(logData.userContext).not.toContain('상대 이성이 체감하는 장면:');
    expect(logData.userContext).not.toContain('여성에게 어필되는 장면:');
  });

  test('여가(hobby) 테마 프롬프트 분기 및 검증', async ({ page }) => {
    await loginAsThemeUser(page, 'hobby');
    await page.goto(`/reports/${dummyOrderIds['hobby']}`);
    
    await expect(page.getByRole('heading', { name: '"Mock Teaser for hobby"' })).toBeVisible({ timeout: 10000 });

    const logData = JSON.parse(fs.readFileSync(MOCK_LOG_PATH, 'utf-8'));
    
    assertJargonFreeRule(logData.systemPrompt);
    
    // 여가 전용 지침 포함 여부
    expect(logData.systemPrompt).toContain('[여가/웰니스 테마 특수 지침]');
  });

});
