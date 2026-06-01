import { test, expect } from '@playwright/test';

test.describe('Order Form Page E2E Tests', () => {
  const validQueryParams = '?theme=career&date=1995-05-15&time=08:00&gender=M&location=서울/경기';

  test.beforeEach(async ({ page }) => {
    // 올바른 쿼리 파라미터로 주문서 작성 페이지에 진입
    await page.goto(`/order-form${validQueryParams}`);
    await expect(page.locator('text=내 별빛 이야기 기록하기')).toBeVisible();
  });

  test('전화번호 유효성 검사 (자동 포맷팅 및 길이 제한)', async ({ page }) => {
    const phoneInput = page.getByPlaceholder('010-0000-0000');
    
    // 1. 문자, 특수기호 입력 시도 -> 숫자만 남고 하이픈 포맷팅 되는지 확인
    await phoneInput.pressSequentially('abc!@#01012345678');
    await expect(phoneInput).toHaveValue('010-1234-5678');

    // 2. 10자리 미만 입력 후 제출 시도
    await phoneInput.fill('0101234');
    // 비밀번호는 정상 입력
    await page.getByPlaceholder('비밀번호를 입력해주세요').fill('1234');
    
    await page.getByRole('button', { name: '내 별빛 이야기 보러가기' }).click();

    // 폼 제출이 차단되고 오류 메시지 표시 확인
    await expect(page.locator('text=정확한 휴대전화 번호를 입력해주세요.')).toBeVisible();
    expect(page.url()).toContain('/order-form');
  });

  test('비밀번호 단순 공백 입력 차단', async ({ page }) => {
    const phoneInput = page.getByPlaceholder('010-0000-0000');
    const passwordInput = page.getByPlaceholder('비밀번호를 입력해주세요');

    // 전화번호는 정상 입력
    await phoneInput.fill('01012345678');

    // 스페이스바로만 4자리 입력
    await passwordInput.fill('    ');
    
    await page.getByRole('button', { name: '내 별빛 이야기 보러가기' }).click();

    // 폼 제출 차단 및 오류 메시지 확인
    await expect(page.locator('text=공백 제외 최소 4자리 이상 입력해주세요.')).toBeVisible();
    expect(page.url()).toContain('/order-form');
  });

  test('XSS 및 악성 입력 차단', async ({ page }) => {
    const phoneInput = page.getByPlaceholder('010-0000-0000');
    const passwordInput = page.getByPlaceholder('비밀번호를 입력해주세요');

    // 전화번호는 정상 입력
    await phoneInput.fill('01012345678');

    // 스크립트 태그 삽입 시도
    await passwordInput.fill('<script>alert(1)</script>');
    
    await page.getByRole('button', { name: '내 별빛 이야기 보러가기' }).click();

    // 폼 제출 차단 및 오류 메시지 확인
    await expect(page.locator('text=<, >, &, ", \' 와 같은 특수문자는 사용할 수 없습니다.')).toBeVisible();
    expect(page.url()).toContain('/order-form');
  });

  test('정상 폼 제출 시 결제 페이지로 이동', async ({ page }) => {
    const phoneInput = page.getByPlaceholder('010-0000-0000');
    const passwordInput = page.getByPlaceholder('비밀번호를 입력해주세요');

    // 정상 데이터 입력
    await phoneInput.fill('01012345678');
    await passwordInput.fill('validPass123');
    
    await page.getByRole('button', { name: '내 별빛 이야기 보러가기' }).click();

    // 결제 폼(/checkout)으로 이동 확인
    await page.waitForURL(/\/checkout/);
    
    // 파라미터가 모두 잘 전달되었는지 확인
    const url = new URL(page.url());
    expect(url.searchParams.get('phone')).toBe('010-1234-5678');
    expect(url.searchParams.get('password')).toBe('validPass123');
    expect(url.searchParams.get('theme')).toBe('career');
  });
});
