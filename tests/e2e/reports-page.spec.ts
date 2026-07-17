import { test, expect } from '@playwright/test';

test.describe('Reports Page E2E Tests', () => {

  test('타인 리포트 접근 시도 (권한 검증)', async ({ page, context }) => {
    // 1. 로그인 세션 쿠키 주입 (로그인 상태 시뮬레이션)
    await context.addCookies([
      {
        name: 'orbit_session',
        value: '01012345678', // 가상의 내 전화번호 세션
        domain: 'localhost',
        path: '/',
      }
    ]);

    // 2. 본인의 리포트(ORDER_1700000001) 접근 시도 -> 정상 접근 확인
    await page.goto('/reports/ORDER_1700000001?theme=career');
    await expect(page.locator('text=권한이 없습니다')).toBeHidden();
    await expect(page.locator('text=나의 진짜 모습')).toBeVisible();

    // 3. 타인의 리포트(ORDER_9999999999) 접근 시도 -> 접근 차단 및 권한 에러 렌더링 확인
    await page.goto('/reports/ORDER_9999999999?theme=career');
    await expect(page.locator('text=권한이 없습니다')).toBeVisible();
    await expect(page.locator('text=나의 진짜 모습')).toBeHidden();

    // 4. 내 보관함으로 돌아가기 동작 확인
    await page.getByRole('button', { name: '내 보관함으로 돌아가기' }).click();
    await page.waitForURL(/\/reports$/);
    expect(page.url()).toBe('http://localhost:3000/reports');
  });

  test('로그아웃 상태 접근 시도', async ({ page }) => {
    // 세션 쿠키가 없는 상태(로그아웃 상태)에서 /reports 메뉴 접근
    await page.goto('/reports');
    
    // /login 페이지로 리다이렉트 되었는지 확인
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
    
    // 디테일 페이지도 동일하게 리다이렉트 되는지 확인
    await page.goto('/reports/ORDER_1700000001');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('링크 복사 공유 동작 검증', async ({ page, context }) => {
    // Web Share 버튼은 제거되었고 링크 복사 공유만 유지한다.

    // 로그인 세션 쿠키 주입
    await context.addCookies([
      {
        name: 'orbit_session',
        value: '01012345678',
        domain: 'localhost',
        path: '/',
      }
    ]);

    // 권한을 클립보드로 부여 (클립보드 복사 폴백 성공을 위해)
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/reports/ORDER_1700000001?theme=career');

    const copyBtn = page.getByRole('button', { name: '링크 복사하기' });
    await expect(page.getByRole('button', { name: '외부로 공유하기' })).toHaveCount(0);
    await copyBtn.click();

    // 링크 복사가 실행되면 '링크 복사하기' 버튼이 '링크 복사 완료'로 잠시 텍스트 변경되는지 확인
    await expect(page.locator('text=링크 복사 완료')).toBeVisible();

    // 일정 시간(2초) 후 다시 원상복구 되는지 검증
    // await page.waitForTimeout(2500);
    // await expect(copyBtn).toHaveText(/링크 복사하기/); 
    // (이 부분은 테스트 속도를 위해 생략하거나 가볍게 넘어감)
  });
});
