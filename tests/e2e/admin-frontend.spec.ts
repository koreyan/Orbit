import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('관리자 프론트엔드 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!adminEmail || !adminPassword, '관리자 E2E는 E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD가 필요합니다.');

    await page.goto('/admin-login');
    await page.locator('input[name="email"]').fill(adminEmail!);
    await page.locator('input[name="password"]').fill(adminPassword!);
    await page.getByRole('button', { name: '관리자 로그인' }).click();
    await page.waitForURL(/\/admin/);
  });

  test('1. 관리자 레이아웃: 사이드바 라우팅 및 404 동작 확인', async ({ page }) => {
    // 1. 대시보드 진입
    await page.goto('/admin');
    
    // 사이드바 타이틀 확인
    await expect(page.getByRole('heading', { name: 'Orbit Admin' })).toBeVisible();

    // 2. 주문 내역 리스트 메뉴 클릭
    const orderListLink = page.getByRole('link', { name: '주문 내역 리스트' });
    await expect(orderListLink).toBeVisible();
    await orderListLink.click();
    
    // URL 변경 대기 및 확인
    await page.waitForURL('/admin/order-list');
    await expect(page).toHaveURL(/\/admin\/order-list/);

    // 3. 존재하지 않는 하위 URL 강제 접근
    await page.goto('/admin/unknown-url-1234');
    // Next.js 기본 404 페이지가 뜨는지 확인 (또는 레이아웃에 포함되는지 확인)
    await expect(page.getByText('404')).toBeVisible();
  });

  test('2. 관리자 메인 페이지: 요약 데이터 렌더링 검증', async ({ page }) => {
    await page.goto('/admin');

    // 대시보드 헤딩 확인
    await expect(page.getByRole('heading', { name: '매출 조회 대시보드' })).toBeVisible();

    // Mock 데이터 렌더링 확인 (총 매출, 신규 주문, 총 유저수, 총 해석 건수)
    // admin.ts 의 Mock 데이터를 참조: 1540000원, 24건, 1520명, 3450건
    await expect(page.getByText('1,540,000원')).toBeVisible();
    await expect(page.getByText('24건')).toBeVisible();
    await expect(page.getByText('1,520명')).toBeVisible();
    await expect(page.getByText('3,450건')).toBeVisible();

    // 차트 섹션 제목 확인
    await expect(page.getByRole('heading', { name: '기간별 매출 추이' })).toBeVisible();
  });

  test('3. 주문 내역 리스트: 주문 목록 테이블 렌더링 확인', async ({ page }) => {
    await page.goto('/admin/order-list');

    await expect(page.getByRole('heading', { name: '주문 내역 리스트' })).toBeVisible();

    // Mock 데이터 행 확인 (ORD-001, ORD-002, ORD-003)
    await expect(page.getByText('ORD-001')).toBeVisible();
    await expect(page.getByText('USR-101')).toBeVisible();
    
    // 뱃지 상태 확인
    const paidBadge = page.locator('span:has-text("PAID")').first();
    await expect(paidBadge).toBeVisible();

    const pendingBadge = page.locator('span:has-text("PENDING")').first();
    await expect(pendingBadge).toBeVisible();
  });

  test('4. 상세 주문 내역: 상세 데이터 바인딩 및 액션 확인', async ({ page }) => {
    // 주문 상세 진입
    await page.goto('/admin/order-list/ORD-001');

    await expect(page.getByRole('heading', { name: '상세 주문 내역' })).toBeVisible();

    // 요약 정보 확인
    await expect(page.getByText('주문 ID:')).toBeVisible();
    await expect(page.getByText('ORD-001', { exact: true })).toBeVisible();
    await expect(page.getByText('결제 상태:')).toBeVisible();

    // 액션 버튼 존재 확인
    const regenerateBtn = page.getByRole('button', { name: '결과 재생성하기' });
    await expect(regenerateBtn).toBeVisible();

    const refundBtn = page.getByRole('button', { name: '주문 취소 및 환불 처리' });
    await expect(refundBtn).toBeVisible();

    // 더미 마크다운 텍스트 확인
    await expect(page.getByText('타고난 리더십과 직관력')).toBeVisible();
    
    // 돌아가기 버튼 클릭 테스트
    const backBtn = page.getByRole('link', { name: '돌아가기' });
    await backBtn.click();
    await page.waitForURL('/admin/order-list');
  });

  test('5. 유저 리스트: 유저 목록 렌더링 확인', async ({ page }) => {
    await page.goto('/admin/user-list');

    await expect(page.getByRole('heading', { name: '유저 리스트' })).toBeVisible();

    // Mock 데이터 행 확인 (USR-101, USR-102, USR-103)
    await expect(page.getByText('USR-101')).toBeVisible();
    await expect(page.getByText('010-1234-5678')).toBeVisible();

    // Role 뱃지 확인
    const adminBadge = page.locator('span:has-text("ADMIN")').first();
    await expect(adminBadge).toBeVisible();
    
    const userBadge = page.locator('span:has-text("USER")').first();
    await expect(userBadge).toBeVisible();
  });

  test('6. 모바일 관리자 레이아웃: 사이드바가 상단 네비게이션으로 전환된다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin');

    const layout = page.getByTestId('admin-layout');
    const sidebar = page.getByTestId('admin-sidebar');

    await expect(layout).toHaveClass(/flex-col/);
    await expect(sidebar).toHaveClass(/w-full/);
    await expect(sidebar).toHaveClass(/h-auto/);
    await expect(page.getByRole('heading', { name: '매출 조회 대시보드' })).toBeVisible();
  });

  test('7. 모바일 관리자 리스트: 테이블 대신 카드 목록을 표시한다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/admin/order-list');
    await expect(page.getByTestId('admin-order-mobile-list')).toBeVisible();
    await expect(page.getByTestId('admin-order-table')).toBeHidden();

    await page.goto('/admin/user-list');
    await expect(page.getByTestId('admin-user-mobile-list')).toBeVisible();
    await expect(page.getByTestId('admin-user-table')).toBeHidden();
  });
});
