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
    <div className="flex h-screen bg-[#050510] text-white overflow-hidden font-sans">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 bg-[#050510]">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
