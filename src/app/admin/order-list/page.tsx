import Link from 'next/link';
import { fetchOrders } from '@/lib/api/admin';

export const metadata = {
  title: '주문 내역 리스트 | Orbit Admin',
};

export default async function AdminOrderListPage(
  props: { searchParams?: Promise<{ filter?: string }> }
) {
  const searchParams = await props.searchParams;
  const currentFilter = searchParams?.filter || 'all';

  const allOrders = await fetchOrders();
  const orders = allOrders.filter(order => {
    if (currentFilter === 'paid') return order.status === 'paid';
    if (currentFilter === 'pending') return order.status === 'pending';
    return true; // 'all' 또는 기타
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">주문 내역 리스트</h1>
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
          <Link 
            href="/admin/order-list?filter=all" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentFilter === 'all' ? 'bg-[#FF6B35] text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            전체
          </Link>
          <Link 
            href="/admin/order-list?filter=paid" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentFilter === 'paid' ? 'bg-[#FF6B35] text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            결제 완료
          </Link>
          <Link 
            href="/admin/order-list?filter=pending" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentFilter === 'pending' ? 'bg-[#FF6B35] text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            결제 대기
          </Link>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-gray-400 uppercase font-medium border-b border-white/10">
              <tr>
                <th className="px-6 py-4">주문 ID</th>
                <th className="px-6 py-4">주문 시간</th>
                <th className="px-6 py-4">연락처</th>
                <th className="px-6 py-4">선택 테마</th>
                <th className="px-6 py-4">결제 금액</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">
                    {order.status !== 'pending' ? (
                      <Link href={`/admin/order-list/${order.id}`} className="hover:text-[#FFAB40] transition-colors">
                        {order.id}
                      </Link>
                    ) : (
                      <span className="text-gray-400">{order.id}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{new Date(order.createdAt).toLocaleString('ko-KR')}</td>
                  <td className="px-6 py-4">{order.phoneNumber}</td>
                  <td className="px-6 py-4">
                    {order.theme === 'career' && '커리어'}
                    {order.theme === 'love' && '연애/매력'}
                    {order.theme === 'hobby' && '여가/웰니스'}
                  </td>
                  <td className="px-6 py-4">{order.amount.toLocaleString()}원</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.status !== 'pending' ? (
                      <Link 
                        href={`/admin/order-list/${order.id}`}
                        className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors inline-block"
                      >
                        상세 보기
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {orders.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              조회된 주문 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
