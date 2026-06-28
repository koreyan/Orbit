import { fetchUsers } from '@/lib/api/admin';
import type { User } from '@/lib/api/admin';

export const metadata = {
  title: '유저 리스트 | Orbit Admin',
};

const getUserRoleClassName = (role: User['role']) => {
  if (role === 'admin') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
};

export default async function AdminUserListPage() {
  const users = await fetchUsers();

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl font-bold text-white md:text-3xl">유저 리스트</h1>

      <div data-testid="admin-user-mobile-list" className="space-y-3 md:hidden">
        {users.map((user) => (
          <article key={user.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-xs text-gray-500">전화번호</p>
                <p className="break-all font-medium text-white">{user.phoneNumber}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getUserRoleClassName(user.role)}`}>
                {user.role.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">가입 시간</span>
              <span className="text-right text-white">{new Date(user.createdAt).toLocaleString('ko-KR')}</span>
            </div>
          </article>
        ))}

        {users.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
            가입된 유저가 없습니다.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:block">
        <div data-testid="admin-user-table" className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="border-b border-white/10 bg-white/5 font-medium uppercase text-gray-400">
              <tr>
                <th className="px-6 py-4">전화번호</th>
                <th className="px-6 py-4">권한 (Role)</th>
                <th className="px-6 py-4">가입 시간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="group transition-colors hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{user.phoneNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getUserRoleClassName(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(user.createdAt).toLocaleString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              가입된 유저가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
