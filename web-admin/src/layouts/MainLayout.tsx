import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { routes } from '@/config/routes';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  ROLE_ANALYTICS_VIEWER,
  ROLE_CONTENT_ADMIN,
  ROLE_TOUR_OPERATOR,
  ROLE_VENDOR,
  displayRoleName,
  isVendorRole,
  roleMatches,
} from '@/features/auth/roleAccess';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
}

interface NavSection {
  title?: string;
  roles?: string[];
  items: NavItem[];
}

const ADMIN_DASHBOARD_ROLES = [
  'Admin',
  'SuperAdmin',
  ROLE_CONTENT_ADMIN,
  ROLE_TOUR_OPERATOR,
  ROLE_ANALYTICS_VIEWER,
];
const SYSTEM_ROLES = ['Admin', 'SuperAdmin'];
const CONTENT_ROLES = ['Admin', 'SuperAdmin', ROLE_CONTENT_ADMIN, ROLE_TOUR_OPERATOR];
const MEDIA_ROLES = ['Admin', 'SuperAdmin', ROLE_CONTENT_ADMIN, ROLE_VENDOR];
const VENDOR_ROLES = [ROLE_VENDOR];

const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: routes.dashboard, label: 'Tong quan', icon: 'T', roles: ADMIN_DASHBOARD_ROLES },
    ],
  },
  {
    title: 'Dia diem va sap',
    roles: CONTENT_ROLES,
    items: [
      { to: routes.pois, label: 'Danh sach POI', icon: 'P', roles: CONTENT_ROLES },
      { to: `${routes.pois}?lifecycleStatus=0`, label: 'Cho duyet', icon: 'D', roles: CONTENT_ROLES },
      { to: `${routes.pois}?lifecycleStatus=2`, label: 'Cho thanh toan', icon: 'C', roles: CONTENT_ROLES },
    ],
  },
  {
    title: 'Noi dung',
    roles: MEDIA_ROLES,
    items: [
      { to: `${routes.media}?tab=images`, label: 'Thu vien anh', icon: 'A', roles: MEDIA_ROLES },
      { to: `${routes.media}?tab=narrations`, label: 'Ban thuyet minh', icon: 'N', roles: MEDIA_ROLES },
      { to: `${routes.pois}?workspace=translations`, label: 'Ban dich', icon: 'B', roles: CONTENT_ROLES },
    ],
  },
  {
    title: 'Tour va ban do',
    roles: CONTENT_ROLES,
    items: [
      { to: routes.tours, label: 'Tour', icon: 'R', roles: CONTENT_ROLES },
      { to: `${routes.dashboard}?panel=map`, label: 'Ban do', icon: 'M', roles: CONTENT_ROLES },
    ],
  },
  {
    title: 'Goi nghe va QR',
    roles: CONTENT_ROLES,
    items: [
      { to: `${routes.qr}?view=packages`, label: 'Goi thuyet minh', icon: 'G', roles: CONTENT_ROLES },
      { to: `${routes.qr}?view=access`, label: 'QR truy cap', icon: 'Q', roles: CONTENT_ROLES },
    ],
  },
  {
    title: 'He thong',
    roles: SYSTEM_ROLES,
    items: [
      { to: routes.users, label: 'Nguoi dung', icon: 'U', roles: SYSTEM_ROLES },
      { to: routes.roles, label: 'Vai tro', icon: 'V', roles: SYSTEM_ROLES },
      { to: routes.languages, label: 'Ngon ngu', icon: 'L', roles: SYSTEM_ROLES },
    ],
  },
  {
    items: [
      { to: routes.profile, label: 'Ho so', icon: 'H', roles: ADMIN_DASHBOARD_ROLES },
    ],
  },
];

const VENDOR_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: routes.dashboard, label: 'Tong quan', icon: 'T', roles: VENDOR_ROLES },
      { to: `${routes.registerPoi}?view=mine`, label: 'Sap cua toi', icon: 'S', roles: VENDOR_ROLES },
      { to: `${routes.registerPoi}?view=register`, label: 'Dang ky dia diem/sap', icon: 'D', roles: VENDOR_ROLES },
    ],
  },
  {
    title: 'Thu vien',
    roles: VENDOR_ROLES,
    items: [
      { to: `${routes.media}?tab=images`, label: 'Hinh anh', icon: 'A', roles: VENDOR_ROLES },
      { to: `${routes.media}?tab=narrations`, label: 'Ban thuyet minh', icon: 'N', roles: VENDOR_ROLES },
      { to: `${routes.registerPoi}?workspace=translations`, label: 'Ban dich', icon: 'B', roles: VENDOR_ROLES },
    ],
  },
  {
    items: [
      { to: `${routes.registerPoi}?lifecycleStatus=2`, label: 'Thanh toan', icon: 'P', roles: VENDOR_ROLES },
      { to: routes.profile, label: 'Ho so', icon: 'H', roles: VENDOR_ROLES },
    ],
  },
];

export function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(routes.login, { replace: true });
  };

  const navSections = (isVendorRole(user?.role) ? VENDOR_NAV_SECTIONS : ADMIN_NAV_SECTIONS)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => roleMatches(user?.role, item.roles)),
    }))
    .filter((section) => roleMatches(user?.role, section.roles) && section.items.length > 0);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <aside className="flex w-72 flex-shrink-0 flex-col bg-gray-900 text-gray-100">
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
          <div className="flex flex-col gap-5">
            {navSections.map((section, sectionIndex) => (
              <section key={section.title ?? `section-${sectionIndex}`}>
                {section.title ? (
                  <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {section.title}
                  </h2>
                ) : null}
                <ul className="flex flex-col gap-0.5">
                  {section.items.map((item) => (
                    <li key={`${section.title ?? 'root'}-${item.to}-${item.label}`}>
                      <Link
                        to={item.to}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                          isNavItemActive(item.to, location.pathname, location.search)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-800 text-[11px] font-semibold">
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </nav>

        <div className="border-t border-gray-700 p-4">
          <div
            className="mb-2 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            role="link"
            onClick={() => navigate(routes.profile)}
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
            Dang xuat
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

function isNavItemActive(to: string, pathname: string, search: string): boolean {
  const [targetPath, targetSearch = ''] = to.split('?');
  const normalizedTargetSearch = targetSearch ? `?${targetSearch}` : '';

  return pathname === targetPath && search === normalizedTargetSearch;
}
