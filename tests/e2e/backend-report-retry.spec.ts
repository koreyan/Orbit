import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

test.describe.serial('AI Retry & Self-Healing E2E', () => {

  const dummyUserIds: Record<string, string> = {};
  const dummyOrderIds: Record<string, string> = {};
  const dummyReportIds: Record<string, string> = {};

  test.beforeAll(async () => {
    const scenarios = [
      { id: 'retry_success', flag: 'fail_retry_success', email: 'retry_success@orbit-app.com' },
      { id: 'max_retries', flag: 'fail_max_retries', email: 'max_retries@orbit-app.com' }
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
        extracted_stars: {}, // retry 테스트에는 별자리 데이터 불필요
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

      // 4. 더미 리포트 레코드 생성 (pending 상태)
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
  });

  test('자가복구 성공 (Self-Healing Success) 검증', async ({ page }) => {
    // 3번 실패 후 4번째 성공. 1.5초 대기 * 3 = 4.5초 소요 예상
    await page.goto(`/reports/${dummyOrderIds['retry_success']}`);
    
    // 리포트가 복구되어 렌더링 될 때까지 대기 (넉넉하게 15초 부여)
    await expect(page.getByText('Recovered successfully')).toBeVisible({ timeout: 15000 });

    // DB 상태 확인
    const { data: reportData } = await supabaseAdmin
      .from('reports')
      .select('status')
      .eq('id', dummyReportIds['retry_success'])
      .single();
    
    expect(reportData.status).toBe('completed');
  });

  test('최대 재시도 초과 후 최종 실패 (Max Retries Failed) 검증', async ({ page }) => {
    // 5번 실패. 1.5초 대기 * 5 = 7.5초 소요 예상
    await page.goto(`/reports/${dummyOrderIds['max_retries']}`);
    
    // 최종 실패 UI가 나타날 때까지 대기 (넉넉하게 20초 부여)
    await expect(page.getByRole('heading', { name: '리포트 생성에 실패했습니다' })).toBeVisible({ timeout: 20000 });

    // DB 상태 확인
    const { data: reportData } = await supabaseAdmin
      .from('reports')
      .select('status')
      .eq('id', dummyReportIds['max_retries'])
      .single();
    
    expect(reportData.status).toBe('failed');
  });

});
