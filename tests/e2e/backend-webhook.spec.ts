import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const DUMMY_EMAIL = `webhook_tester_${Date.now()}@orbit-app.com`;

test.describe.serial('Webhook Asynchronous Event Backend E2E', () => {

  let dummyUserId = '';
  let dummyOrderId = '';
  const dummyPaymentKey = 'webhook_test_payment_key_123';

  test.beforeAll(async () => {
    // 1. 찌꺼기 계정 정리
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

    // 3. 더미 주문서 생성 (초기 상태: pending)
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

    // 4. 더미 결제 레코드 생성 (초기 상태: waiting_for_deposit - 가상계좌 입금 대기 중)
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        order_id: dummyOrderId,
        payment_key: dummyPaymentKey,
        amount: 990,
        method: '가상계좌',
        status: 'done'
      });

    if (paymentError) {
      throw new Error(`Failed to create dummy payment: ${paymentError?.message}`);
    }
  });

  test.afterAll(async () => {
    // 유저 삭제 (CASCADE에 의해 orders, payments 자동 삭제)
    if (dummyUserId) {
      await supabaseAdmin.auth.admin.deleteUser(dummyUserId);
    }
  });

  test('웹훅 수신(DONE) 시 DB 주문 및 결제 상태가 paid/done으로 변경됨을 검증', async ({ request }) => {
    // 1. Toss Payments Webhook Payload 구성 (입금 완료 이벤트 시뮬레이션)
    const webhookPayload = {
      eventType: 'PAYMENT_STATUS_CHANGED',
      createdAt: new Date().toISOString(),
      data: {
        paymentKey: dummyPaymentKey,
        orderId: dummyOrderId,
        status: 'DONE',
      }
    };

    // 2. 백엔드 API(Webhook Endpoint)로 POST 요청 발송
    const response = await request.post('/api/webhooks/toss', {
      data: webhookPayload
    });

    expect(response.ok()).toBeTruthy();
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);

    // 3. DB 상태 전이 검증
    // 3-1. orders 테이블의 status가 'paid'로 변경되었는지
    const { data: orderData } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', dummyOrderId)
      .single();
    if (!orderData) throw new Error('웹훅 테스트용 주문 데이터를 찾지 못했습니다.');
    
    expect(orderData.status).toBe('paid');

    // 3-2. payments 테이블의 status가 'done'으로 변경되었는지
    const { data: paymentData } = await supabaseAdmin
      .from('payments')
      .select('status')
      .eq('payment_key', dummyPaymentKey)
      .single();
    if (!paymentData) throw new Error('웹훅 테스트용 결제 데이터를 찾지 못했습니다.');
    
    expect(paymentData.status).toBe('done');
  });

  test('웹훅 수신(CANCELED) 시 DB 주문 상태가 canceled로 변경됨을 검증', async ({ request }) => {
    // 앞선 테스트에서 status가 paid/done으로 변경된 상태에서 취소(환불) 웹훅을 수신한다고 가정
    
    // 1. Toss Payments Webhook Payload 구성 (결제 취소 이벤트 시뮬레이션)
    const webhookPayload = {
      eventType: 'PAYMENT_STATUS_CHANGED',
      createdAt: new Date().toISOString(),
      data: {
        paymentKey: dummyPaymentKey,
        orderId: dummyOrderId,
        status: 'CANCELED',
      }
    };

    // 2. 백엔드 API로 POST 요청
    const response = await request.post('/api/webhooks/toss', {
      data: webhookPayload
    });

    expect(response.ok()).toBeTruthy();
    
    // 3. DB 상태 전이 검증 (취소됨)
    const { data: orderData } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', dummyOrderId)
      .single();
    if (!orderData) throw new Error('취소 웹훅 테스트용 주문 데이터를 찾지 못했습니다.');
    
    expect(orderData.status).toBe('cancelled');

    const { data: paymentData } = await supabaseAdmin
      .from('payments')
      .select('status')
      .eq('payment_key', dummyPaymentKey)
      .single();
    if (!paymentData) throw new Error('취소 웹훅 테스트용 결제 데이터를 찾지 못했습니다.');
    
    expect(paymentData.status).toBe('canceled');
  });

});
