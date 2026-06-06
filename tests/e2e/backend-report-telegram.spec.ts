import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const MOCK_TELEGRAM_LOG_PATH = path.join(process.cwd(), '.telegram_mock.log');

test.describe.serial('AI Report Telegram Notification E2E', () => {

  const dummyUserIds: Record<string, string> = {};
  const dummyOrderIds: Record<string, string> = {};
  const dummyReportIds: Record<string, string> = {};

  test.beforeAll(async () => {
    if (fs.existsSync(MOCK_TELEGRAM_LOG_PATH)) {
      fs.unlinkSync(MOCK_TELEGRAM_LOG_PATH);
    }

    const scenarios = [
      { id: 'telegram_success', flag: 'success_prompt', email: 'tele_success@orbit-app.com' },
      { id: 'telegram_failure', flag: 'fail_max_retries', email: 'tele_fail@orbit-app.com' }
    ];

    for (const scenario of scenarios) {
      // 1. 기존 유저 정리
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData.users.find((u) => u.email === scenario.email);
      if (existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      }

      // 2. 유저 생성
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: scenario.email,
        password: 'test_password',
        email_confirm: true,
      });

      if (signUpError || !signUpData.user) throw new Error(`User creation failed: ${signUpError?.message}`);
      dummyUserIds[scenario.id] = signUpData.user.id;

      // 3. 더미 주문서 생성
      const sajuData = {
        date: "1990-01-01",
        time: "12:00",
        gender: "M",
        extracted_stars: {},
        e2e_mock_gemini: scenario.flag
      };

      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: dummyUserIds[scenario.id],
          theme: 'career',
          amount: 990,
          status: 'paid', // 이미 결제 완료
          saju_data: sajuData
        })
        .select('id')
        .single();

      if (orderError || !orderData) throw new Error(`Order creation failed: ${orderError?.message}`);
      dummyOrderIds[scenario.id] = orderData.id;

      // 4. 더미 리포트 레코드 생성
      const { data: reportData, error: reportError } = await supabaseAdmin
        .from('reports')
        .insert({
          order_id: dummyOrderIds[scenario.id],
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (reportError || !reportData) throw new Error(`Report creation failed: ${reportError?.message}`);
      dummyReportIds[scenario.id] = reportData.id;
    }
  });

  test.afterAll(async () => {
    for (const id of Object.values(dummyUserIds)) {
      if (id) await supabaseAdmin.auth.admin.deleteUser(id);
    }
    if (fs.existsSync(MOCK_TELEGRAM_LOG_PATH)) {
      fs.unlinkSync(MOCK_TELEGRAM_LOG_PATH);
    }
  });

  test('리포트 생성 성공 시 텔레그램 알림 발송 검증', async ({ page }) => {
    // 로그 초기화
    if (fs.existsSync(MOCK_TELEGRAM_LOG_PATH)) {
      fs.unlinkSync(MOCK_TELEGRAM_LOG_PATH);
    }

    await page.goto(`/reports/${dummyOrderIds['telegram_success']}`);
    
    // 리포트 렌더링 완료 대기 (success_prompt이므로 즉시 성공)
    await expect(page.locator('text=Mock Teaser for career')).toBeVisible({ timeout: 10000 });

    // 텔레그램 로그 검증
    expect(fs.existsSync(MOCK_TELEGRAM_LOG_PATH)).toBe(true);
    const logData = fs.readFileSync(MOCK_TELEGRAM_LOG_PATH, 'utf-8');
    
    // 알림 메시지 내용 단언
    expect(logData).toContain('✨ <b>[리포트 생성 완료]</b>');
    expect(logData).toContain(`주문번호: <code>${dummyReportIds['telegram_success']}</code>`);
    expect(logData).toContain('AI가 성공적으로 별빛 이야기를 해독했습니다!');
  });

  test('최대 재시도 초과 실패 시 텔레그램 알림 발송 검증', async ({ page }) => {
    // 로그 초기화
    if (fs.existsSync(MOCK_TELEGRAM_LOG_PATH)) {
      fs.unlinkSync(MOCK_TELEGRAM_LOG_PATH);
    }

    await page.goto(`/reports/${dummyOrderIds['telegram_failure']}`);
    
    // 5번 재시도 후 최종 실패 화면 렌더링 대기
    await expect(page.getByRole('heading', { name: '리포트 생성에 실패했습니다' })).toBeVisible({ timeout: 20000 });

    // 텔레그램 로그 검증
    expect(fs.existsSync(MOCK_TELEGRAM_LOG_PATH)).toBe(true);
    const logData = fs.readFileSync(MOCK_TELEGRAM_LOG_PATH, 'utf-8');
    
    // 알림 메시지 내용 단언
    expect(logData).toContain('❌ <b>[리포트 생성 실패]</b>');
    expect(logData).toContain(`주문번호: <code>${dummyReportIds['telegram_failure']}</code>`);
    expect(logData).toContain('사유: Gemini API 최대 재시도 횟수 초과');
    expect(logData).toContain('Simulated Permanent AI Error (Attempt 5)');
  });

});
