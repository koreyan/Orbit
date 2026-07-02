import Link from 'next/link';
import { fetchOrders } from '@/lib/api/admin';
import type { Order } from '@/lib/api/admin';
import { formatKoreanDateTime } from '@/lib/format/korean-date-time';

export const metadata = {
  title: '주문 내역 리스트 | Orbit Admin',
};

const getThemeLabel = (theme: string) => {
  if (theme === 'career') return '커리어';
  if (theme === 'love') return '연애/매력';
  if (theme === 'hobby') return '여가/웰니스';
  return theme;
};

const getOrderStatusClassName = (status: Order['status']) => {
  if (status === 'paid') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (status === 'pending') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white md:text-3xl">주문 내역 리스트</h1>
        <div className="flex w-full overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-1 sm:w-auto">
          <Link
            href="/admin/order-list?filter=all"
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors ${currentFilter === 'all' ? 'bg-[#FF6B35] text-white shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            전체
          </Link>
          <Link
            href="/admin/order-list?filter=paid"
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors ${currentFilter === 'paid' ? 'bg-[#FF6B35] text-white shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            결제 완료
          </Link>
          <Link
            href="/admin/order-list?filter=pending"
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors ${currentFilter === 'pending' ? 'bg-[#FF6B35] text-white shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            결제 대기
          </Link>
        </div>
      </div>

      <div data-testid="admin-order-mobile-list" className="space-y-3 md:hidden">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-xs text-gray-500">주문 ID</p>
                {order.status !== 'pending' ? (
                  <Link href={`/admin/order-list/${order.id}`} className="break-all font-medium text-white transition-colors hover:text-[#FFAB40]">
                    {order.id}
                  </Link>
                ) : (
                  <span className="break-all font-medium text-gray-400">{order.id}</span>
                )}
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getOrderStatusClassName(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
            </div>

            <dl className="grid grid-cols-1 gap-3">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">주문 시간</dt>
                <dd className="text-right text-white">{formatKoreanDateTime(order.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">연락처</dt>
                <dd className="text-right text-white">{order.phoneNumber}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">선택 테마</dt>
                <dd className="text-right text-white">{getThemeLabel(order.theme)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">결제 금액</dt>
                <dd className="text-right font-medium text-white">{order.amount.toLocaleString()}원</dd>
              </div>
            </dl>

            {order.status !== 'pending' && (
              <Link
                href={`/admin/order-list/${order.id}`}
                className="mt-4 block rounded-lg bg-white/10 px-3 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-white/20"
              >
                상세 보기
              </Link>
            )}
          </article>
        ))}

        {orders.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
            조회된 주문 내역이 없습니다.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:block">
        <div data-testid="admin-order-table" className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="border-b border-white/10 bg-white/5 font-medium uppercase text-gray-400">
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
                <tr key={order.id} className="group transition-colors hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">
                    {order.status !== 'pending' ? (
                      <Link href={`/admin/order-list/${order.id}`} className="transition-colors hover:text-[#FFAB40]">
                        {order.id}
                      </Link>
                    ) : (
                      <span className="text-gray-400">{order.id}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{formatKoreanDateTime(order.createdAt)}</td>
                  <td className="px-6 py-4">{order.phoneNumber}</td>
                  <td className="px-6 py-4">{getThemeLabel(order.theme)}</td>
                  <td className="px-6 py-4">{order.amount.toLocaleString()}원</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getOrderStatusClassName(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.status !== 'pending' ? (
                      <Link
                        href={`/admin/order-list/${order.id}`}
                        className="inline-block rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
                      >
                        상세 보기
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
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
