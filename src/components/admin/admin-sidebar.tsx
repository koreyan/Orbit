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
    <aside className="w-64 bg-[#050510] border-r border-white/10 text-white flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-white/10">
        <Link href="/admin">
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#FFAB40] bg-clip-text text-transparent">
            Orbit Admin
          </h2>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                isActive ? 'bg-[#FF6B35]/10 text-[#FF6B35] font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
