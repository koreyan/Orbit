import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const DUMMY_EMAIL = 'u01011112222@orbit-app.com';
const MOCK_PAYMENT_KEY = 'E2E_TEST_MOCK_PAYMENT_KEY';
const MOCK_LOG_PATH = path.join(process.cwd(), '.telegram_mock.log');

test.describe('Telegram Notification Backend E2E', () => {

  let dummyUserId = '';
  let dummyOrderId = '';

  test.beforeAll(async () => {
    // 기존 임시 로그 파일 삭제 (초기화)
    if (fs.existsSync(MOCK_LOG_PATH)) {
      fs.unlinkSync(MOCK_LOG_PATH);
    }

    // 1. 기존 찌꺼기 계정 정리
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersData.users.find((u) => u.email === DUMMY_EMAIL);
    if (existingUser) {
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    }

    // 2. 더미 유저 생성
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: DUMMY_EMAIL,
      password: 'test_password',
      email_confirm: true,
    });

    if (signUpError || !signUpData.user) {
      throw new Error(`Failed to create dummy user: ${signUpError?.message}`);
    }
    dummyUserId = signUpData.user.id;

    // 3. 더미 주문서 생성 (실제 금액 990원)
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: dummyUserId,
        theme: 'career',
        amount: 990,
        status: 'pending',
        saju_data: { test: true }
      })
      .select('id')
      .single();

    if (orderError || !orderData) {
      throw new Error(`Failed to create dummy order: ${orderError?.message}`);
    }
    dummyOrderId = orderData.id;
  });

  test.afterAll(async () => {
    // 유저 삭제 (CASCADE 연관 데이터 자동 삭제)
    if (dummyUserId) {
      await supabaseAdmin.auth.admin.deleteUser(dummyUserId);
    }
    // 로그 파일 정리
    if (fs.existsSync(MOCK_LOG_PATH)) {
      fs.unlinkSync(MOCK_LOG_PATH);
    }
  });

  test('결제 승인 직후 텔레그램 알림 발송 로직 동기화 검증', async ({ page }) => {
    // 1. Mock Payment Key를 이용해 결제 승인 로직에 접근
    const amount = 990;
    await page.goto(`/checkout/success?orderId=${dummyOrderId}&amount=${amount}&paymentKey=${MOCK_PAYMENT_KEY}`);
    
    // 2. 결제 처리 완료를 대기 (UI 리다이렉트 완료 시점)
    // 리다이렉트(또는 화면 렌더링)가 끝났다는 것은 서버 컴포넌트의 await 처리가 모두 끝났다는 의미
    await page.waitForURL('**/checkout/success*');
    await expect(page.locator('text=별빛 이야기 해독 준비 완료')).toBeVisible();

    // 3. 텔레그램 모의 로그 파일 검증
    // 서버리스(Vercel) 환경에서는 프론트엔드로 응답이 넘어가기 전 동기적으로 완료(await)되어야 함
    expect(fs.existsSync(MOCK_LOG_PATH)).toBe(true);

    const logContent = fs.readFileSync(MOCK_LOG_PATH, 'utf-8');
    
    // 내용 포맷 검증
    expect(logContent).toContain('✅ <b>[결제 성공]</b>');
    expect(logContent).toContain(`주문번호: <code>${dummyOrderId}</code>`);
    expect(logContent).toContain(`금액: 990원`);
  });

});
