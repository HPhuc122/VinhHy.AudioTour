import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { routes } from '@/config/routes';
import { useAuth } from '@/features/auth/context/AuthContext';
import { displayRoleName, isVendorRole, roleMatches, ROLE_VENDOR } from '@/features/auth/roleAccess';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
}

const ADMIN_ROLES = ['Admin', 'SuperAdmin'];
const CONTENT_ROLES = ['Admin', 'SuperAdmin', 'ContentAdmin', 'TourOperator'];
const VENDOR_ROLES = [ROLE_VENDOR];

const NAV_ITEMS: NavItem[] = [
  { to: routes.dashboard, label: 'Bảng điều khiển', icon: 'D', roles: CONTENT_ROLES },
  { to: routes.users, label: 'Người dùng', icon: 'U', roles: ADMIN_ROLES },
  { to: routes.roles, label: 'Phân quyền', icon: 'R', roles: ADMIN_ROLES },
  { to: routes.pois, label: 'Địa điểm (POI)', icon: 'P', roles: CONTENT_ROLES },
  { to: routes.registerPoi, label: 'Đăng ký POI', icon: 'S', roles: VENDOR_ROLES },
  { to: routes.languages, label: 'Ngôn ngữ', icon: 'L', roles: ADMIN_ROLES },
  { to: routes.tours, label: 'Tour', icon: 'T', roles: CONTENT_ROLES },
  { to: routes.qr, label: 'Mã QR', icon: 'Q', roles: CONTENT_ROLES },
  { to: routes.media, label: 'Thư viện', icon: 'M', roles: CONTENT_ROLES },
];

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(routes.login, { replace: true });
  };

  const visibleNav = NAV_ITEMS.filter((item) => roleMatches(user?.role, item.roles));
  const isVendor = isVendorRole(user?.role);

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
            {visibleNav.map((item) => (
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
                  <span className="flex h-5 w-5 items-center justify-center text-xs font-semibold">
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-700 p-4">
          <div
            className={`mb-2 flex items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-400 ${
              isVendor ? '' : 'transition-colors hover:bg-gray-800 hover:text-white'
            }`}
            role={isVendor ? undefined : 'link'}
            onClick={() => {
              if (!isVendor) {
                navigate(routes.profile);
              }
            }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-xs font-bold uppercase text-white">
              {user?.username?.[0] ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-200">{user?.username}</p>
              <p className="truncate text-xs text-gray-500">{displayRoleName(user?.role)}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-red-900/40 hover:text-red-400"
          >
            <span className="flex h-5 w-5 items-center justify-center text-xs font-semibold">X</span>
            Đăng xuất
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
