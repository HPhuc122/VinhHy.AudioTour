import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { routes } from '@/config/routes';
import { useAuth } from '@/features/auth/context/AuthContext';

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(routes.login, { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold text-slate-900">VinhHy Audio Tour CMS</p>
              {user ? (
                <p className="text-xs text-slate-500">
                  {user.username} - {user.role}
                </p>
              ) : null}
            </div>
            <nav className="flex flex-wrap gap-2 text-sm" aria-label="Main navigation">
              <NavLink
                to={routes.dashboard}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 font-medium transition ${
                    isActive ? 'bg-sky-50 text-sky-900' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to={routes.tours}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 font-medium transition ${
                    isActive ? 'bg-sky-50 text-sky-900' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                Tours
              </NavLink>
              <NavLink
                to={routes.qr}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 font-medium transition ${
                    isActive ? 'bg-sky-50 text-sky-900' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                QR
              </NavLink>
            </nav>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
