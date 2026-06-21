import { fetchDashboardData } from '@/lib/api/admin';

export const metadata = {
  title: '매출 조회 | Orbit Admin',
};

export default async function AdminDashboardPage() {
  const data = await fetchDashboardData();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">매출 조회 대시보드</h1>
      
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-400 mb-2">총 매출</p>
          <p className="text-3xl font-bold text-[#FFAB40]">{data.totalRevenue.toLocaleString()}원</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-400 mb-2">신규 주문</p>
          <p className="text-3xl font-bold text-white">{data.newOrders.toLocaleString()}건</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-400 mb-2">총 유저수</p>
          <p className="text-3xl font-bold text-white">{data.totalUsers.toLocaleString()}명</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-400 mb-2">총 해석 건수</p>
          <p className="text-3xl font-bold text-white">{data.totalReports.toLocaleString()}건</p>
        </div>
      </div>

      {/* 기간별 매출 차트 (더미 UI) */}
      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl h-96 flex flex-col">
        <h2 className="text-xl font-semibold mb-6 text-white">기간별 매출 추이</h2>
        {/* TODO: Recharts 등 차트 라이브러리 도입 필요 (현재는 CSS 막대 그래프로 대체) */}
        <div className="flex-1 flex items-end justify-between gap-4 pt-4 mt-auto">
          {data.revenueByPeriod.map((item, idx) => {
            const maxAmount = Math.max(...data.revenueByPeriod.map(d => d.amount));
            const height = `${(item.amount / maxAmount) * 100}%`;
            return (
              <div key={idx} className="flex flex-col items-center w-full group relative h-full justify-end">
                <div 
                  className="w-full max-w-[40px] bg-gradient-to-t from-[#FF6B35]/50 to-[#FFAB40] rounded-t-md opacity-80 group-hover:opacity-100 transition-opacity" 
                  style={{ height }}
                />
                <span className="text-[11px] text-gray-400 mt-3">{item.date.slice(5)}</span>
                <div className="absolute -top-10 bg-black/80 px-3 py-1.5 rounded-lg text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-white/10 z-10 pointer-events-none">
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
