import { test, expect } from '@playwright/test';

test.describe('Checkout Page E2E Tests', () => {
  const validQueryParams = '?theme=career&date=1995-05-15&time=08:00&gender=M&location=서울/경기&phone=010-1234-5678&password=password123';

  test('비정상적 직접 접근 방어 (주문 정보 없음)', async ({ page }) => {
    // 파라미터 없이 직접 /checkout 접속 시도
    await page.goto('/checkout');
    
    // 잘못된 접근 에러 UI 렌더링 확인
    await expect(page.locator('text=잘못된 접근입니다. 주문 정보를 찾을 수 없습니다.')).toBeVisible();

    // 메인으로 돌아가기 버튼 동작 확인
    await page.getByRole('button', { name: '메인으로 돌아가기' }).click();
    await page.waitForURL('/');
    expect(page.url()).toBe('http://localhost:3000/');
  });

  test('결제 취소 프로세스 시뮬레이션', async ({ page }) => {
    // 토스페이먼츠 위젯을 띄우고 사용자가 X를 누른 상황(USER_CANCEL)을 모의합니다.
    // 결제 모듈 내부의 동작은 외부 의존성이므로 failUrl로 리다이렉트되는 결과 라우팅을 테스트합니다.
    await page.goto('/checkout/fail?code=USER_CANCEL&message=결제를 취소하셨습니다.');
    
    // 결제 실패 화면 UI 렌더링 검증
    await expect(page.locator('text=별빛 이야기 결제 실패')).toBeVisible();
    await expect(page.locator('text=오류 사유를 확인하신 후 다시 시도해 주세요.')).toBeVisible();
    
    // 에러 메시지와 코드가 제대로 출력되는지 확인
    await expect(page.locator('text=결제를 취소하셨습니다.')).toBeVisible();
    await expect(page.locator('text=USER_CANCEL')).toBeVisible();

    // 다시 시작하기 버튼 동작 확인
    await page.getByRole('button', { name: '다시 별빛 이야기 시작하기' }).click();
    await page.waitForURL('/');
    expect(page.url()).toBe('http://localhost:3000/');
  });

  test('결제 금액 변조 해킹 시도 방어 (서버 사이드 검증)', async ({ page }) => {
    // 악의적인 유저가 브라우저 개발자 도구 등을 통해 결제 금액(amount)을 0원 또는 임의의 금액으로 변조하여
    // 결제 성공 API(success)를 호출했다고 가정합니다.
    
    // 커리어 테마의 원래 금액은 990원이지만, amount=0 으로 조작하여 접속 시도
    const tamperedUrl = `/checkout/success${validQueryParams}&orderId=TEST_ORDER&amount=0`;
    await page.goto(tamperedUrl);

    // 백엔드(서버 컴포넌트)에서 금액 검증에 실패하여 강제로 fail 페이지로 리다이렉트 시켰는지 확인
    await page.waitForURL(/\/checkout\/fail/);
    
    // 강제 리다이렉트 된 실패 페이지의 URL과 에러 코드 검증
    const url = new URL(page.url());
    expect(url.searchParams.get('code')).toBe('AMOUNT_TAMPERED');

    // 화면에 적절한 에러 문구가 표시되는지 확인
    await expect(page.locator('text=결제 금액이 변조되어 결제가 자동 취소되었습니다.')).toBeVisible();
    await expect(page.locator('text=AMOUNT_TAMPERED')).toBeVisible();
  });
});
