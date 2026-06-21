import Link from 'next/link';

export const metadata = {
  title: '주문 상세 내역 | Orbit Admin',
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ 'report-id': string }> }) {
  const resolvedParams = await params;
  const reportId = resolvedParams['report-id'];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/order-list"
          className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
        >
          &larr; 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-white">상세 주문 내역</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 요약 정보 영역 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">주문 정보 요약</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">주문 ID:</span>
                <span className="text-white font-medium">{reportId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">결제 상태:</span>
                <span className="text-emerald-400 font-medium">PAID</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">선택 테마:</span>
                <span className="text-white font-medium">커리어</span>
              </div>
              {/* TODO: 백엔드 API가 완성되면 실제 데이터 바인딩 필요 */}
            </div>
          </div>
          
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">관리자 액션</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2.5 text-sm font-medium bg-[#FF6B35] hover:bg-[#FFAB40] text-white rounded-lg transition-colors flex justify-center items-center gap-2">
                {/* FIX: 결과 재생성 API 연동 필요 */}
                결과 재생성하기
              </button>
              <button className="w-full px-4 py-2.5 text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex justify-center items-center border border-red-500/20">
                주문 취소 및 환불 처리
              </button>
            </div>
          </div>
        </div>

        {/* 결과 상세 영역 */}
        <div className="lg:col-span-2">
          <div className="p-8 bg-white/5 border border-white/10 rounded-2xl h-full min-h-[500px]">
            <h2 className="text-xl font-bold text-white mb-6">유저의 자미두수 결과</h2>
            
            <div className="bg-black/20 p-6 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {/* TODO: 리포트 API 연동 후 마크다운 내용 렌더링 필요 */}
              [해독된 명반의 상세 리포트가 이곳에 표시됩니다.]
              
              당신의 진짜 모습은... 
              타고난 리더십과 직관력이 돋보이는 성향입니다.
              
              올해의 커리어 흐름은...
              새로운 프로젝트나 책임 있는 역할을 맡게 될 가능성이 높습니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
