import { test, expect } from '@playwright/test';

test.describe('Result Page E2E Tests', () => {
  const validQueryParams = '?date=1995-05-15&time=08:00&gender=M&location=서울/경기';

  test('비정상적 직접 접근 시 랜딩 페이지로 리다이렉트', async ({ page }) => {
    // 쿼리 파라미터 없이 접근
    await page.goto('/result');
    
    // 리다이렉트되어 랜딩 페이지(/)에 머물러야 함
    await page.waitForURL('/');
    expect(page.url()).toBe('http://localhost:3000/');
  });

  test('옵션(테마) 미선택 시 결제 폼 이동 차단 및 에러 메시지 렌더링', async ({ page }) => {
    // 올바른 쿼리 파라미터로 접근
    await page.goto(`/result${validQueryParams}`);
    
    // 명반 페이지가 로딩되었는지 확인
    await expect(page.locator('text=별빛이 그려낸 나의 진짜 모습')).toBeVisible();

    // 테마 미선택 상태에서 다음 버튼 클릭
    await page.getByRole('button', { name: '선택한 테마의 내 별빛 이야기 들어보기' }).click();

    // 에러 메시지 렌더링 확인
    await expect(page.locator('text=분석 테마를 선택해주세요.')).toBeVisible();

    // URL이 /order-form으로 이동하지 않았는지 확인
    expect(page.url()).toContain('/result');
  });

  test('테마 선택 후 결제 폼 정상 이동 및 파라미터 유지', async ({ page }) => {
    await page.goto(`/result${validQueryParams}`);
    
    // 테마 선택 (연애 - 현재 활성 0원 데모 상품)
    await page.locator('label[for="theme-love"]').click();
    
    // 다음 버튼 클릭
    await page.getByRole('button', { name: '선택한 테마의 내 별빛 이야기 들어보기' }).click();

    // /checkout으로 라우팅 되는지 확인
    await page.waitForURL(/\/checkout/);
    
    // checkout은 서버에서 생성한 orderId 기반으로 진입한다.
    const url = new URL(page.url());
    expect(url.searchParams.get('orderId')).toBeTruthy();
  });

  test('새로고침 시 데이터 유지', async ({ page }) => {
    await page.goto(`/result${validQueryParams}`);
    
    // 명반 요소들이 렌더링 되어 있는지 확인 (예: 명궁 이라는 단어)
    await expect(page.locator('text=명궁').first()).toBeVisible();
    
    // 페이지 새로고침
    await page.reload();

    // 쿼리 파라미터가 그대로이므로 데이터가 다시 정상 렌더링되어야 함
    await expect(page.locator('text=별빛이 그려낸 나의 진짜 모습')).toBeVisible();
    await expect(page.locator('text=명궁').first()).toBeVisible();
  });
});
