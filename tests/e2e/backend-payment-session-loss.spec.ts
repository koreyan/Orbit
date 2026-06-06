import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const DUMMY_EMAIL = 'u01099998888@orbit-app.com';
const MOCK_PAYMENT_KEY = 'E2E_TEST_MOCK_PAYMENT_KEY';

test.describe('Payment Session Loss Backend E2E', () => {

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

  test('세션 유실 시 Admin Client(RLS 우회)를 통한 정상 결제 승인 및 업데이트 검증', async ({ page }) => {
    // 1. 세션 쿠키 강제 초기화 (SameSite 이슈 시뮬레이션)
    await page.context().clearCookies();
    
    // 쿠키가 지워졌는지 확인 (엄격하게)
    const cookies = await page.context().cookies();
    expect(cookies.length).toBe(0);

    // 2. Toss 결제 성공 콜백 진입 (Mock Payment Key 사용)
    const amount = 990;
    await page.goto(`/checkout/success?orderId=${dummyOrderId}&amount=${amount}&paymentKey=${MOCK_PAYMENT_KEY}`);
    
    // 3. 정상 승인 후 결과 페이지 리다이렉트 검증
    // 성공 시 /reports/[orderId] 로 이동해야 함 (CheckoutSuccessPage 하단의 "내 별빛 이야기 보러가기" 버튼 링크와 유사하지만
    // page.tsx를 보면 /checkout/success 진입 후 별문제 없으면 해당 페이지에 머무름!
    // 아, CheckoutSuccessPage는 리다이렉트가 아니라 결제 완료 페이지 뷰를 렌더링함!
    await page.waitForURL('**/checkout/success*');
    await expect(page.locator('text=별빛 이야기 해독 준비 완료')).toBeVisible();

    // 4. DB 업데이트 검증
    // 4-1. orders 테이블 상태가 paid로 변경되었는지
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', dummyOrderId)
      .single();
    
    expect(updatedOrder.status).toBe('paid');

    // 4-2. payments 테이블에 내역이 insert 되었는지
    const { data: paymentRecord } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', dummyOrderId)
      .single();
    
    expect(paymentRecord).toBeTruthy();
    expect(paymentRecord.payment_key).toBe(MOCK_PAYMENT_KEY);
    expect(paymentRecord.amount).toBe(990);
    expect(paymentRecord.method).toBe('가상계좌');
    expect(paymentRecord.status).toBe('done');
  });

});
