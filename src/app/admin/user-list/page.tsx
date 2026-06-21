import { fetchUsers } from '@/lib/api/admin';

export const metadata = {
  title: '유저 리스트 | Orbit Admin',
};

export default async function AdminUserListPage() {
  const users = await fetchUsers();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">유저 리스트</h1>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-gray-400 uppercase font-medium border-b border-white/10">
              <tr>
                <th className="px-6 py-4">전화번호</th>
                <th className="px-6 py-4">권한 (Role)</th>
                <th className="px-6 py-4">가입 시간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">{user.phoneNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
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
