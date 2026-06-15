import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { ROUTES } from '../routes/routeConstants';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: '📊' },
  { to: ROUTES.USERS, label: 'Người dùng', icon: '👤', roles: ['SuperAdmin'] },
  { to: ROUTES.ROLES, label: 'Phân quyền', icon: '🔐', roles: ['SuperAdmin'] },
  { to: ROUTES.POIS, label: 'Địa điểm (POI)', icon: '📍' },
  { to: ROUTES.LANGUAGES, label: 'Ngôn ngữ', icon: '🗣️', },

];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="flex w-60 flex-shrink-0 flex-col bg-gray-900 text-gray-100">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            V
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">VinhHy</p>
            <p className="text-xs text-gray-400">AudioTour CMS</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="flex flex-col gap-0.5">
            {visibleNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === ROUTES.DASHBOARD}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info + logout */}
        <div className="border-t border-gray-700 p-4">
          <NavLink
            to={ROUTES.PROFILE}
            className="mb-2 flex items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-xs font-bold uppercase text-white">
              {user?.username?.[0] ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-200">
                {user?.username}
              </p>
              <p className="truncate text-xs text-gray-500">{user?.role}</p>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors"
          >
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
