import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const uniqueSuffix = Date.now().toString().slice(-4);
const TEST_PHONE = `0105555${uniqueSuffix}`;
const TEST_PASSWORD = 'rlstestpwd';
const TEST_EMAIL = `u${TEST_PHONE}@orbit-app.com`;
const TEST_PADDED_PASSWORD = `${TEST_PASSWORD}_orbit`;

test.describe('Reports RLS & Access Control E2E', () => {
let ownerUserId: string;
  let dummyOrderId: string;
  let testEmail: string;
  let testPhone: string;

  test.beforeAll(async () => {
    // Generate a unique 8-digit suffix to make an 11-digit phone number: 010 + 8 digits
    const uniqueSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
    testPhone = `010${uniqueSuffix}`;
    testEmail = `u${testPhone}@orbit-app.com`;

    // 0. 기존 유저 정리
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    const existingUser = usersData.users.find(u => u.email === testEmail);
    if (existingUser) {
      await adminClient.auth.admin.deleteUser(existingUser.id);
    }

    // 1. 유저 생성
    const { data: sData, error: sErr } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: TEST_PADDED_PASSWORD,
      email_confirm: true,
      user_metadata: { phone_number: testPhone }
    });
    if (sErr) throw new Error(`User creation failed: ${sErr.message}`);
    ownerUserId = sData.user!.id;

    // 2. 주문 생성
    const { data: orderData, error: orderError } = await adminClient.from('orders').insert({
      user_id: ownerUserId,
      theme: 'career',
      amount: 10000,
      status: 'paid',
      saju_data: { name: 'RLS Test' }
    }).select('id').single();

    if (orderError) throw orderError;
    dummyOrderId = orderData!.id;

    // 3. 비공개 리포트 생성 (is_public: false)
    await adminClient.from('reports').insert({
      order_id: dummyOrderId,
      status: 'completed',
      is_public: false,
      content: {
        core_trait: 'RLS Core Trait',
        theme_insight: 'RLS Theme Insight',
        teaser_quote: 'RLS Teaser',
        periodic_insight: 'RLS Periodic'
      }
    });
  });

  test.afterAll(async () => {
    if (dummyOrderId) {
      await adminClient.from('reports').delete().eq('order_id', dummyOrderId);
      await adminClient.from('orders').delete().eq('id', dummyOrderId);
    }
    if (ownerUserId) {
      await adminClient.auth.admin.deleteUser(ownerUserId);
    } else {
      const { data } = await adminClient.auth.admin.listUsers();
      const u = data.users.find((u: any) => u.email === testEmail);
      if(u) await adminClient.auth.admin.deleteUser(u.id);
    }
  });

  test('Phase 1: 비소유자 비회원 접근 시 403 리다이렉트', async ({ page }) => {
    await page.goto(`/reports/${dummyOrderId}`);
    await page.waitForURL('**/reports/forbidden');
    await expect(page.locator('text=비공개 리포트입니다')).toBeVisible();
  });

  test('Phase 2, 3, 4: 소유자 열람, 권한 개방, 비회원 재열람', async ({ page, browser }) => {
    // --- Phase 2: 소유자 접근 ---
    await page.goto('/login');
    await page.getByLabel('휴대전화 번호').pressSequentially(testPhone);
    await page.getByLabel('비밀번호').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '내 별빛 이야기 꺼내보기' }).click();
    await page.waitForURL('**/reports');

    await page.goto(`/reports/${dummyOrderId}`);
    await expect(page.locator('text=내 별빛 이야기를 공유해보세요')).toBeVisible();
    await expect(page.locator('text=RLS Core Trait')).toBeVisible();

    // --- Phase 3: 공유하기 클릭 (권한 개방) ---
    const shareBtn = page.locator('button').filter({ hasText: '외부로 공유하기' });
    await shareBtn.click();
    
    // DB 업데이트 대기
    await page.waitForTimeout(1500);

    // --- Phase 4: 비회원이 공유 링크 접근 ---
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    await anonPage.goto(`/reports/${dummyOrderId}`);
    
    // 403으로 튕기지 않고 리포트가 정상 렌더링 되어야 함
    await expect(anonPage.locator('text=RLS Core Trait')).toBeVisible();
    await anonContext.close();
  });
});
