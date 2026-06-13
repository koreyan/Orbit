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
      { id: 'retry_success', flag: 'fail_retry_success', phone: '01011110001' },
      { id: 'max_retries', flag: 'fail_max_retries', phone: '01011110002' }
    ];

    for (const scenario of scenarios) {
      const email = `u${scenario.phone}@orbit-app.com`;
      // 1. 기존 유저 정리
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData.users.find((u) => u.email === email);
      if (existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      }

      // 2. 유저 생성
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'test_password_orbit', // login requires password + _orbit
        email_confirm: true,
        user_metadata: { phone_number: scenario.phone }
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

  test('수동 재생성 성공 (Manual Retry Success) 검증', async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.getByLabel('휴대전화 번호').pressSequentially('01011110001');
    await page.getByLabel('비밀번호').fill('test_password');
    await page.getByRole('button', { name: '내 별빛 이야기 꺼내보기' }).click();
    await page.waitForURL('**/reports');

    // 첫 진입 시 실패 (fail_retry_success 플래그에 의해 무조건 실패)
    await page.goto(`/reports/${dummyOrderIds['retry_success']}`);
    
    // 실패 UI가 나타날 때까지 대기
    await expect(page.getByRole('heading', { name: '리포트 생성에 실패했습니다' })).toBeVisible({ timeout: 10000 });

    // DB의 플래그를 성공 모드로 변경 (수동 재시도 시 성공하도록)
    const { data: orderData } = await supabaseAdmin.from('orders').select('saju_data').eq('id', dummyOrderIds['retry_success']).single();
    await supabaseAdmin.from('orders').update({
      saju_data: { ...orderData.saju_data, e2e_mock_gemini: 'success_prompt' }
    }).eq('id', dummyOrderIds['retry_success']);

    // 글 재생성하기 버튼 클릭
    await page.getByRole('button', { name: '글 재생성하기' }).click();

    // 리포트가 복구되어 렌더링 될 때까지 대기
    await expect(page.getByText('Mock Core Trait')).toBeVisible({ timeout: 15000 });

    // DB 상태 확인
    const { data: reportData } = await supabaseAdmin
      .from('reports')
      .select('status')
      .eq('id', dummyReportIds['retry_success'])
      .single();
    
    expect(reportData.status).toBe('completed');
  });

  test('재생성 영구 실패 (Manual Retry Failed) 검증', async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.getByLabel('휴대전화 번호').pressSequentially('01011110002');
    await page.getByLabel('비밀번호').fill('test_password');
    await page.getByRole('button', { name: '내 별빛 이야기 꺼내보기' }).click();
    await page.waitForURL('**/reports');

    // 첫 진입 시 실패
    await page.goto(`/reports/${dummyOrderIds['max_retries']}`);
    
    // 최종 실패 UI가 나타날 때까지 대기
    await expect(page.getByRole('heading', { name: '리포트 생성에 실패했습니다' })).toBeVisible({ timeout: 10000 });

    // 플래그를 그대로 두어 다시 실패하도록 함
    await page.getByRole('button', { name: '글 재생성하기' }).click();

    // 다시 실패 UI가 나타날 때까지 대기 (alert 창 확인)
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('글 생성에 실패했습니다');
      dialog.dismiss().catch(() => {});
    });

    // DB 상태 확인
    const { data: reportData } = await supabaseAdmin
      .from('reports')
      .select('status')
      .eq('id', dummyReportIds['max_retries'])
      .single();
    
    expect(reportData.status).toBe('failed');
  });

});
