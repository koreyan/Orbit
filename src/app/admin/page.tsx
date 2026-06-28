import { fetchDashboardData } from '@/lib/api/admin';

export const metadata = {
  title: '매출 조회 | Orbit Admin',
};

export default async function AdminDashboardPage() {
  const data = await fetchDashboardData();

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl font-bold text-white md:text-3xl">매출 조회 대시보드</h1>
      
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <p className="mb-2 text-sm font-medium text-gray-400">총 매출</p>
          <p className="break-keep text-2xl font-bold text-[#FFAB40] sm:text-3xl">{data.totalRevenue.toLocaleString()}원</p>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <p className="mb-2 text-sm font-medium text-gray-400">신규 주문</p>
          <p className="text-2xl font-bold text-white sm:text-3xl">{data.newOrders.toLocaleString()}건</p>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <p className="mb-2 text-sm font-medium text-gray-400">총 유저수</p>
          <p className="text-2xl font-bold text-white sm:text-3xl">{data.totalUsers.toLocaleString()}명</p>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <p className="mb-2 text-sm font-medium text-gray-400">총 해석 건수</p>
          <p className="text-2xl font-bold text-white sm:text-3xl">{data.totalReports.toLocaleString()}건</p>
        </div>
      </div>

      {/* 기간별 매출 차트 (더미 UI) */}
      <div className="flex h-80 flex-col rounded-2xl border border-white/10 bg-white/5 p-4 sm:h-96 sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">기간별 매출 추이</h2>
        {/* TODO: Recharts 등 차트 라이브러리 도입 필요 (현재는 CSS 막대 그래프로 대체) */}
        <div className="mt-auto flex min-w-0 flex-1 items-end justify-between gap-2 overflow-x-auto pt-4 sm:gap-4">
          {data.revenueByPeriod.map((item, idx) => {
            const maxAmount = Math.max(...data.revenueByPeriod.map(d => d.amount));
            const height = `${(item.amount / maxAmount) * 100}%`;
            return (
              <div key={idx} className="group relative flex h-full min-w-8 flex-1 flex-col items-center justify-end">
                <div 
                  className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-[#FF6B35]/50 to-[#FFAB40] opacity-80 transition-opacity group-hover:opacity-100 sm:max-w-[40px]" 
                  style={{ height }}
                />
                <span className="mt-2 text-[10px] text-gray-400 sm:mt-3 sm:text-[11px]">{item.date.slice(5)}</span>
                <div className="pointer-events-none absolute -top-10 z-10 whitespace-nowrap rounded-lg border border-white/10 bg-black/80 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                  {item.amount.toLocaleString()}원
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
