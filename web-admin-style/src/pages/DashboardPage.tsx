import { useAuth } from '../features/auth/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Xin chào, <span className="font-medium text-gray-700">{user?.username}</span>!
        Bạn đang đăng nhập với quyền{' '}
        <span className="font-medium text-blue-600">{user?.role}</span>.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Vai trò', value: user?.role ?? '—', color: 'bg-blue-50 text-blue-700' },
          { label: 'Ngôn ngữ', value: user?.preferredLanguage?.toUpperCase() ?? '—', color: 'bg-green-50 text-green-700' },
          { label: 'Trạng thái', value: 'Hoạt động', color: 'bg-emerald-50 text-emerald-700' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {card.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${card.color} inline-block rounded px-2 py-0.5`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Truy cập nhanh</h2>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5">
          <li>Quản lý người dùng → <span className="text-blue-600">Menu &gt; Người dùng</span></li>
          <li>Quản lý phân quyền → <span className="text-blue-600">Menu &gt; Phân quyền</span></li>
          <li>Cập nhật thông tin cá nhân → <span className="text-blue-600">Menu &gt; Profile</span></li>
        </ul>
      </div>
    </div>
  );
}
