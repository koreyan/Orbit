import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const DUMMY_EMAIL = 'u01012345678@orbit-app.com';

test.describe('Payment Amount Tampering Validation Backend E2E', () => {

  let dummyUserId = '';
  let dummyOrderId = '';

  test.beforeAll(async () => {
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
  });

  test('결제 금액 변조 시 서버 컴포넌트에서 차단 및 리다이렉트 검증', async ({ page }) => {
    // 1. 실제 금액(990)이 아닌 변조된 금액(100)으로 결제 성공 콜백 URL 조작 후 강제 진입
    const tamperedAmount = 100;
    const fakePaymentKey = 'test_fake_payment_key_123';
    
    await page.goto(`/checkout/success?orderId=${dummyOrderId}&amount=${tamperedAmount}&paymentKey=${fakePaymentKey}`);
    
    // 2. 리다이렉트 검증 (서버에서 AMOUNT_TAMPERED 코드로 강제 리다이렉트)
    await page.waitForURL('**/checkout/fail*');
    
    const url = new URL(page.url());
    expect(url.pathname).toBe('/checkout/fail');
    expect(url.searchParams.get('code')).toBe('AMOUNT_TAMPERED');
    
    // 3. UI 렌더링 메시지 확인
    await expect(page.locator('text=결제 금액이 변조되어 결제가 자동 취소되었습니다.')).toBeVisible();
  });

});
