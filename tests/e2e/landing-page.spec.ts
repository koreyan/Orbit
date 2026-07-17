import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('필수 정보 입력 누락 방지 - 성별', async ({ page }) => {
    // 폼 바로 제출 시도
    await page.getByRole('button', { name: '내 별빛 이야기 들어보기' }).click();
    
    // 에러 메시지 텍스트 렌더링 확인
    await expect(page.locator('text=모든 필수 정보를 입력해주세요.')).toBeVisible();
    
    // 성별 버튼 테두리 붉은색 클래스(border-red-500) 확인
    const maleBtn = page.getByRole('button', { name: '남성' });
    await expect(maleBtn).toHaveClass(/border-red-500/);
  });

  test('필수 정보 입력 누락 방지 - 생년월일/시간', async ({ page }) => {
    // 성별만 선택하고 제출 시도
    await page.getByRole('button', { name: '남성' }).click();
    
    await page.getByRole('button', { name: '내 별빛 이야기 들어보기' }).click();
    
    // 에러 메시지 렌더링 확인
    await expect(page.locator('text=모든 필수 정보를 입력해주세요.')).toBeVisible();
    
    // 연도 입력칸에 붉은색 테두리 클래스 확인
    const yearInput = page.getByPlaceholder('YYYY');
    await expect(yearInput).toHaveClass(/border-red-500/);
  });

  test('생년월일 예외 방어 - 존재하지 않는 날짜 (예: 2월 30일)', async ({ page }) => {
    await page.getByRole('button', { name: '여성' }).click();
    await page.getByPlaceholder('YYYY').fill('1990');
    await page.getByPlaceholder('MM').fill('2');
    await page.getByPlaceholder('DD').fill('30'); // 2월 30일 입력
    await page.getByPlaceholder('12').fill('10');
    await page.getByPlaceholder('00').fill('30');
    
    await page.getByRole('button', { name: '내 별빛 이야기 들어보기' }).click();
    
    // 존재하지 않는 날짜 에러 메시지 노출 확인
    await expect(page.locator('text=존재하지 않는 날짜입니다. 다시 확인해주세요.')).toBeVisible();
    
    // URL이 결과창으로 넘어가지 않았는지 확인
    expect(page.url()).not.toContain('/result'); 
  });

  test('중복 클릭(따닥) 시 한 번만 결과 페이지로 이동', async ({ page }) => {
    await page.getByRole('button', { name: '남성' }).click();
    await page.getByPlaceholder('YYYY').fill('1995');
    await page.getByPlaceholder('MM').fill('5');
    await page.getByPlaceholder('DD').fill('15');
    await page.getByPlaceholder('12').fill('8');
    await page.getByPlaceholder('00').fill('0');

    const submitBtn = page.getByRole('button', { name: '내 별빛 이야기 들어보기' });
    
    await Promise.all([
      page.waitForURL(/\/result/),
      submitBtn.dblclick(),
    ]);

    expect(page.url()).toContain('/result');
  });
});


