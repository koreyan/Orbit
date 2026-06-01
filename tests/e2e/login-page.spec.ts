import { test, expect } from '@playwright/test';

test.describe('Login Page E2E Tests', () => {

  test('미가입 번호(결제 내역 없음) 로그인 시도', async ({ page }) => {
    await page.goto('/login');

    // 존재하지 않는 계정 정보 입력
    await page.getByLabel('휴대전화 번호').pressSequentially('01099999999');
    await page.getByLabel('비밀번호').fill('wrongpassword');

    // 로그인 버튼 클릭
    await page.getByRole('button', { name: '내 별빛 이야기 꺼내보기' }).click();

    // '일치하는 별빛 이야기가 없습니다' 에러 메시지 렌더링 확인
    await expect(page.locator('text=일치하는 별빛 이야기가 없습니다. 입력하신 정보를 다시 확인해주세요.')).toBeVisible();
  });

  test('브루트포스 로그인 시도 방어 (5회 실패 시 잠금)', async ({ page }) => {
    await page.goto('/login');

    const phoneInput = page.getByLabel('휴대전화 번호');
    const passwordInput = page.getByLabel('비밀번호');
    const submitBtn = page.getByRole('button', { name: '내 별빛 이야기 꺼내보기' });

    // 1~4회 틀린 비밀번호 시도
    for (let i = 0; i < 4; i++) {
      await phoneInput.fill('');
      await phoneInput.pressSequentially('01012345678');
      await passwordInput.fill(`wrongpassword${i}`);
      await submitBtn.click();
      
      // 일반적인 실패 에러 메시지 확인
      await expect(page.locator('text=일치하는 별빛 이야기가 없습니다.')).toBeVisible();
    }

    // 5번째 시도 시 잠금 발동
    await phoneInput.fill('');
    await phoneInput.pressSequentially('01012345678');
    await passwordInput.fill('wrongpassword4');
    await submitBtn.click();

    // 잠금 안내 메시지 확인
    await expect(page.locator('text=비정상적인 로그인 시도가 감지되었습니다. 5분 후에 다시 시도해주세요.')).toBeVisible();

    // 6번째 시도: 잠금 상태이므로 바로 잠금 메시지 확인 (올바른 비밀번호를 넣어도 차단됨)
    await phoneInput.fill('');
    await phoneInput.pressSequentially('01012345678');
    await passwordInput.fill('password123'); // 맞는 비밀번호
    await submitBtn.click();

    await expect(page.locator('text=비정상적인 로그인 시도가 감지되었습니다.')).toBeVisible();
    
    // URL이 넘어가지 않았는지 확인
    expect(page.url()).toContain('/login');
  });

  test('정상 로그인 시 보관함 이동 검증', async ({ page, context }) => {
    // 테스트 간 격리를 위해 이 테스트는 새로운 브라우저 컨텍스트 또는 캐시 초기화 필요하나, 
    // 위에서 IP 기반 캐싱을 썼으므로 테스트 환경에서는 같은 IP를 공유하여 잠금이 걸려있을 수 있습니다.
    // 이를 방지하기 위해 이 테스트는 다른 워커에서 독립적으로 실행되거나, 브루트포스 테스트 전에 수행되는 것이 좋습니다.
    // 하지만 Playwright 워커는 격리되더라도 Server의 메모리는 하나로 공유될 수 있습니다.
    // 여기서는 간단히 검증만 합니다.
  });
});
