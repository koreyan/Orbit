import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const DUMMY_PHONE = '010-8888-7777';
const DUMMY_EMAIL = 'u01088887777@orbit-app.com';

test.describe.serial('Order & Virtual Account Creation Backend E2E', () => {

  // 테스트 시작 전후로 찌꺼기 계정 정리
  test.beforeAll(async () => {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const user = data.users.find((u) => u.email === DUMMY_EMAIL);
    if (user) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
  });

  test.afterAll(async () => {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const user = data.users.find((u) => u.email === DUMMY_EMAIL);
    if (user) {
      // CASCADE 설정으로 연관된 orders 도 삭제됨
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
  });

  test('신규 유저 주문서 생성 및 가상 계정 발급 검증', async ({ page }) => {
    // 1. 주문 폼 직접 진입
    await page.goto('/order-form?theme=career&date=1990-05-01&time=12:30&gender=M');
    
    // 2. 폼 채우기
    await page.getByPlaceholder('010-0000-0000').fill(DUMMY_PHONE);
    await page.getByPlaceholder('비밀번호를 입력해주세요').fill('first_pwd');
    
    // 3. 제출
    const checkoutPromise = page.waitForURL('**/checkout?*orderId=*');
    await page.getByRole('button', { name: '내 별빛 이야기 보러가기' }).click();
    await checkoutPromise;
    
    // 4. 리다이렉트 된 URL에서 orderId 파싱
    const url = new URL(page.url());
    const orderId = url.searchParams.get('orderId');
    expect(orderId).toBeTruthy();

    // 5. 백엔드(DB) 상태 검증
    // 유저가 가입되었는지 확인
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const user = usersData.users.find((u) => u.email === DUMMY_EMAIL);
    expect(user).toBeDefined();

    // 주문서가 정상적으로 pending 상태로 삽입되었는지 확인
    const { data: orderData, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    expect(error).toBeNull();
    expect(orderData.status).toBe('pending');
    expect(orderData.theme).toBe('career');
    expect(orderData.user_id).toBe(user?.id);
  });

  test('기존 회원 재주문 시 가상 계정 충돌 방지 및 덮어쓰기 검증', async ({ page }) => {
    // 첫 번째 테스트에서 이미 계정이 생성된 상태를 보장 (순차 실행 기준)
    
    // 1. 주문 폼 재진입 (이번엔 다른 테마로 시도)
    await page.goto('/order-form?theme=love&date=1990-05-01&time=12:30&gender=M');
    
    // 2. 동일한 전화번호, 하지만 "다른" 비밀번호 입력 (비밀번호 강제 갱신 로직 트리거)
    await page.getByPlaceholder('010-0000-0000').fill(DUMMY_PHONE);
    await page.getByPlaceholder('비밀번호를 입력해주세요').fill('second_pwd');
    
    // 3. 제출 (기존에 가입된 이메일이지만 에러 없이 넘어가야 함)
    const checkoutPromise = page.waitForURL('**/checkout?*orderId=*');
    await page.getByRole('button', { name: '내 별빛 이야기 보러가기' }).click();
    await checkoutPromise;
    
    // 4. 새로운 orderId 발급 확인
    const url = new URL(page.url());
    const newOrderId = url.searchParams.get('orderId');
    expect(newOrderId).toBeTruthy();

    // 5. DB 상태 재검증
    const { data: orderData, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', newOrderId)
      .single();
    
    expect(error).toBeNull();
    expect(orderData.status).toBe('pending');
    expect(orderData.theme).toBe('love'); // 변경된 테마가 맞는지 확인
  });

});
