import Link from 'next/link';
import { fetchOrderDetail } from '@/lib/api/admin';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RegenerateButton from './RegenerateButton';

export const metadata = {
  title: '주문 상세 내역 | Orbit Admin',
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ 'report-id': string }> }) {
  const resolvedParams = await params;
  const reportId = resolvedParams['report-id'];

  const orderDetail = await fetchOrderDetail(reportId);

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
                <span className="text-white font-medium">{orderDetail.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">주문 시간:</span>
                <span className="text-white font-medium">{new Date(orderDetail.createdAt).toLocaleString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">연락처:</span>
                <span className="text-white font-medium">{orderDetail.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">결제 금액:</span>
                <span className="text-white font-medium">{orderDetail.amount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">주문 상태:</span>
                <span className={`font-medium ${
                  orderDetail.status === 'paid' ? 'text-emerald-400' :
                  orderDetail.status === 'pending' ? 'text-amber-400' : 'text-gray-400'
                }`}>
                  {orderDetail.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">선택 테마:</span>
                <span className="text-white font-medium">
                  {orderDetail.theme === 'career' && '커리어'}
                  {orderDetail.theme === 'love' && '연애/매력'}
                  {orderDetail.theme === 'hobby' && '여가/웰니스'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">리포트 상태:</span>
                <span className={`font-medium ${
                  orderDetail.reportStatus === 'completed' ? 'text-emerald-400' :
                  orderDetail.reportStatus === 'failed' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {orderDetail.reportStatus ? orderDetail.reportStatus.toUpperCase() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">관리자 액션</h2>
            <div className="space-y-3">
              <RegenerateButton orderId={orderDetail.id} />
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
            
            <div className="bg-black/20 p-6 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed">
              {orderDetail.reportStatus === 'completed' && orderDetail.reportContent ? (
                <div className="prose prose-invert prose-orange max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {orderDetail.reportContent.replace(/^```markdown\s*/i, '').replace(/```\s*$/i, '')}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {orderDetail.reportStatus === 'failed' ? '리포트 생성에 실패했습니다.' : '아직 리포트가 생성되지 않았거나 진행 중입니다.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
