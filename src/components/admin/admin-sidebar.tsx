'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListOrdered, Users } from 'lucide-react';

const navItems = [
  { name: '매출 조회', href: '/admin', icon: LayoutDashboard },
  { name: '주문 내역 리스트', href: '/admin/order-list', icon: ListOrdered },
  { name: '유저 리스트', href: '/admin/user-list', icon: Users },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside data-testid="admin-sidebar" className="flex h-auto w-full shrink-0 flex-col border-b border-white/10 bg-[#050510] text-white md:h-full md:w-64 md:border-b-0 md:border-r">
      <div className="border-b border-white/10 p-4 md:p-6">
        <Link href="/admin">
          <h2 className="bg-gradient-to-r from-[#FF6B35] to-[#FFAB40] bg-clip-text text-lg font-bold text-transparent md:text-xl">
            Orbit Admin
          </h2>
        </Link>
      </div>
      <nav className="flex gap-2 overflow-x-auto p-3 md:flex-1 md:flex-col md:space-y-2 md:overflow-y-auto md:p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors md:gap-3 md:px-4 md:py-3 ${
                isActive ? 'bg-[#FF6B35]/10 text-[#FF6B35] font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4 md:h-5 md:w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
