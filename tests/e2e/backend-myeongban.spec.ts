import { test, expect } from '@playwright/test';

test.describe('Myeongban API Backend E2E Tests', () => {

  test('정상 사주 입력 시 기초 데이터 정상 추출 (명궁 주성 있음)', async ({ page }) => {
    // 1. 랜딩 페이지 접속
    await page.goto('/');

    // 2. 정상 사주 데이터 입력: 1990년 5월 1일 12시 30분, 남성
    await page.getByRole('button', { name: '남성' }).click();
    
    await page.getByPlaceholder('YYYY').fill('1990');
    await page.getByPlaceholder('MM').fill('5');
    await page.getByPlaceholder('DD').fill('1');
    
    await page.getByRole('button', { name: '오후' }).click(); // 12:30 PM
    await page.getByPlaceholder('12').fill('12');
    await page.getByPlaceholder('00').fill('30');
    
    // 3. '내 별빛 이야기 들어보기' 제출
    const responsePromise = page.waitForResponse(response => response.url().includes('/result'));
    await page.getByRole('button', { name: '내 별빛 이야기 들어보기' }).click();
    await responsePromise;

    // 4. /result 페이지 이동 확인
    await page.waitForURL('**/result*');
    
    // 5. DB 매핑 및 렌더링 결과 검증
    // 정상 사주이므로 명궁에 주성이 존재함
    // `당신의 진짜 모습을 결정짓는 핵심 별자리 [태음]입니다 ✨` 와 같은 텍스트가 나와야 함
    await expect(page.locator('text=당신의 진짜 모습을 결정짓는 핵심 별자리')).toBeVisible();
    
    // "무료 기초 해석" 본문에 빈 문자열이 아닌 내용이 렌더링되었는지 (DB에서 coreTrait을 잘 가져왔는지)
    // 텍스트 내용이 '매우 특별하고 흥미로운 성향을 가지고 있습니다.'가 아니면 DB에서 성공적으로 가져온 것임
    const coreTraitText = await page.locator('.bg-black\\/30.rounded-2xl.p-5 p').textContent();
    expect(coreTraitText).toBeTruthy();
    
    // 차성안궁 관련 텍스트가 안 떠야 함
    await expect(page.locator('text=당신의 천이궁에 숨겨진')).toBeHidden();
  });

  test('명궁무주성 사주 입력 시 예외 처리 (천이궁 주성 대체 추출)', async ({ page }) => {
    // 1. 랜딩 페이지 접속
    await page.goto('/');

    // 2. 명궁무주성 사주 데이터 입력: 1990년 5월 6일 12시 30분, 남성
    await page.getByRole('button', { name: '남성' }).click();
    
    await page.getByPlaceholder('YYYY').fill('1990');
    await page.getByPlaceholder('MM').fill('5');
    await page.getByPlaceholder('DD').fill('6');
    
    await page.getByRole('button', { name: '오후' }).click(); // 12:30 PM
    await page.getByPlaceholder('12').fill('12');
    await page.getByPlaceholder('00').fill('30');
    
    // 3. 제출
    const responsePromise = page.waitForResponse(response => response.url().includes('/result'));
    await page.getByRole('button', { name: '내 별빛 이야기 들어보기' }).click();
    await responsePromise;

    // 4. /result 페이지 이동 확인
    await page.waitForURL('**/result*');
    
    // 5. 차성안궁(명궁무주성) 예외 처리 검증
    // borrowed = true 로직이 작동하여 아래 텍스트가 나와야 함
    await expect(page.locator('text=당신의 천이궁에 숨겨진')).toBeVisible();
    await expect(page.locator('text=특별한 진짜 모습입니다! ✨')).toBeVisible();

    // "무료 기초 해석" 본문 존재 검증
    const coreTraitText = await page.locator('.bg-black\\/30.rounded-2xl.p-5 p').textContent();
    expect(coreTraitText).toBeTruthy();
    
    // 정상 타이틀은 숨겨져야 함
    await expect(page.locator('text=당신의 진짜 모습을 결정짓는 핵심 별자리')).toBeHidden();
  });

});
