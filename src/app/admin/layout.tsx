import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { verifyAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Orbit Admin',
  description: 'Orbit 관리자 페이지',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    // 관리자 권한 검증 (세션이 없거나 admin 권한이 아니면 에러 발생)
    await verifyAdmin();
  } catch {
    // 권한이 없으면 관리자 로그인 페이지로 튕겨냅니다.
    redirect('/admin-login');
  }

  return (
    <div data-testid="admin-layout" className="flex min-h-screen flex-col bg-[#050510] text-white font-sans md:h-screen md:flex-row md:overflow-hidden">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-[#050510] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
