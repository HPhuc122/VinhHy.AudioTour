import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { routes } from '@/config/routes';
import { useAuth } from '@/features/auth/context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: routes.dashboard, label: 'Dashboard', icon: '📊' },
  { to: routes.tours, label: 'Tours', icon: '🗺️' },
  { to: routes.qr, label: 'QR', icon: '▦' },
  { to: routes.media, label: 'Media', icon: '◉' },
];

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(routes.login, { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <aside className="flex w-60 flex-shrink-0 flex-col bg-gray-900 text-gray-100">
        <div className="flex h-16 items-center gap-3 border-b border-gray-700 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            V
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">VinhHy</p>
            <p className="text-xs text-gray-400">AudioTour CMS</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === routes.dashboard}
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

        <div className="border-t border-gray-700 p-4">
          <div className="mb-2 flex items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-xs font-bold uppercase text-white">
              {user?.username?.[0] ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-200">{user?.username}</p>
              <p className="truncate text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-red-900/40 hover:text-red-400"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
