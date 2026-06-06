import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_PHONE_SUCCESS = '01099991111';
const TEST_PASSWORD_SUCCESS = 'testpwd123';
const TEST_EMAIL_SUCCESS = `u${TEST_PHONE_SUCCESS}@orbit-app.com`;
const TEST_PADDED_PASSWORD_SUCCESS = `${TEST_PASSWORD_SUCCESS}_orbit`;

const TEST_PHONE_BRUTE = '01099992222';
const TEST_PASSWORD_BRUTE = 'testpwd456';
const TEST_EMAIL_BRUTE = `u${TEST_PHONE_BRUTE}@orbit-app.com`;
const TEST_PADDED_PASSWORD_BRUTE = `${TEST_PASSWORD_BRUTE}_orbit`;

test.describe('Auth API Backend E2E Tests', () => {
  let successUserId: string;
  let bruteUserId: string;

  test.beforeAll(async () => {
    // 1. Success 유저 생성
    const { data: sData, error: sErr } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL_SUCCESS,
      password: TEST_PADDED_PASSWORD_SUCCESS,
      email_confirm: true,
      user_metadata: { phone_number: TEST_PHONE_SUCCESS }
    });
    if (sErr && !sErr.message.includes('already registered')) {
      console.error('Setup failed for success user:', sErr);
    }
    if (sData?.user) successUserId = sData.user.id;

    // 2. Brute-force 유저 생성
    const { data: bData, error: bErr } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL_BRUTE,
      password: TEST_PADDED_PASSWORD_BRUTE,
      email_confirm: true,
      user_metadata: { phone_number: TEST_PHONE_BRUTE }
    });
    if (bErr && !bErr.message.includes('already registered')) {
      console.error('Setup failed for brute user:', bErr);
    }
    if (bData?.user) bruteUserId = bData.user.id;
  });

  test.afterAll(async () => {
    // Teardown
    if (successUserId) {
      await adminClient.auth.admin.deleteUser(successUserId);
    } else {
       const { data } = await adminClient.auth.admin.listUsers();
       const u1 = data.users.find((u: any) => u.email === TEST_EMAIL_SUCCESS);
       if(u1) await adminClient.auth.admin.deleteUser(u1.id);
    }
    
    if (bruteUserId) {
      await adminClient.auth.admin.deleteUser(bruteUserId);
    } else {
       const { data } = await adminClient.auth.admin.listUsers();
       const u2 = data.users.find((u: any) => u.email === TEST_EMAIL_BRUTE);
       if(u2) await adminClient.auth.admin.deleteUser(u2.id);
    }
  });

  test('로그인 성공 및 세션 발급 검증', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('휴대전화 번호').pressSequentially(TEST_PHONE_SUCCESS);
    await page.getByLabel('비밀번호').fill(TEST_PASSWORD_SUCCESS);

    await page.getByRole('button', { name: '내 별빛 이야기 꺼내보기' }).click();

    // /reports (보관함) 페이지로 리다이렉트 되는지 확인
    await page.waitForURL('**/reports', { timeout: 10000 });
    
    // 쿠키 검증 (Supabase 세션 쿠키 발급 여부)
    const cookies = await page.context().cookies();
    const supabaseCookie = cookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
    
    expect(supabaseCookie).toBeDefined();
    expect(supabaseCookie?.value).toBeTruthy();
  });

  test('브루트포스 로그인 차단 (5회 실패 시 백엔드 에러 반환 검증)', async ({ page }) => {
    await page.goto('/login');

    const phoneInput = page.getByLabel('휴대전화 번호');
    const passwordInput = page.getByLabel('비밀번호');
    const submitBtn = page.getByRole('button', { name: '내 별빛 이야기 꺼내보기' });

    // 1~4회 틀린 비밀번호 시도
    for (let i = 0; i < 4; i++) {
      await phoneInput.fill('');
      await phoneInput.pressSequentially(TEST_PHONE_BRUTE);
      await passwordInput.fill(`wrongpassword${i}`);
      
      const responsePromise = page.waitForResponse(response => response.url().includes('/login') && response.request().method() === 'POST');
      await submitBtn.click();
      await responsePromise;

      await expect(page.locator('text=일치하는 별빛 이야기가 없습니다.')).toBeVisible();
    }

    // 5번째 시도 시 잠금 발동
    await phoneInput.fill('');
    await phoneInput.pressSequentially(TEST_PHONE_BRUTE);
    await passwordInput.fill('wrongpassword4');
    
    const responsePromise5 = page.waitForResponse(response => response.url().includes('/login') && response.request().method() === 'POST');
    await submitBtn.click();
    await responsePromise5;

    // 잠금 안내 메시지 확인
    await expect(page.locator('text=비정상적인 로그인 시도가 감지되었습니다. 5분 후에 다시 시도해주세요.')).toBeVisible();

    // 6번째 시도 (올바른 비밀번호) 시도해도 잠금 유지 확인
    await phoneInput.fill('');
    await phoneInput.pressSequentially(TEST_PHONE_BRUTE);
    await passwordInput.fill(TEST_PASSWORD_BRUTE); // 맞는 비밀번호
    
    const responsePromise6 = page.waitForResponse(response => response.url().includes('/login') && response.request().method() === 'POST');
    await submitBtn.click();
    await responsePromise6;

    await expect(page.locator('text=비정상적인 로그인 시도가 감지되었습니다.')).toBeVisible();
    
    // 여전히 세션 발급 안 됨 (쿠키 없음 확인)
    const cookies = await page.context().cookies();
    const supabaseCookie = cookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
    expect(supabaseCookie).toBeUndefined();
  });
});
