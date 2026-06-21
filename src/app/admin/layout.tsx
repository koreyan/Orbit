import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export const metadata = {
  title: 'Orbit Admin',
  description: 'Orbit 관리자 페이지',
};

const AdminLayout = ({ children }: { children: ReactNode }) => {
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
};

export default AdminLayout;
