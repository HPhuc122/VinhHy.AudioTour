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
      <header className="border-b border-[var(--app-border)] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-[var(--app-heading)]">VinhHy Audio Tour CMS</p>
              {user ? (
                <p className="text-xs text-[var(--app-text)]">
                  {user.username} - {user.role}
                </p>
              ) : null}
            </div>
            <nav className="flex flex-wrap gap-2 text-sm" aria-label="Main navigation">
              <NavLink
                to={routes.dashboard}
                className={({ isActive }) =>
                  `rounded-md border px-3 py-2 font-medium transition ${
                    isActive
                      ? 'border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]'
                      : 'border-transparent text-[var(--app-text)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-heading)]'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to={routes.tours}
                className={({ isActive }) =>
                  `rounded-md border px-3 py-2 font-medium transition ${
                    isActive
                      ? 'border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]'
                      : 'border-transparent text-[var(--app-text)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-heading)]'
                  }`
                }
              >
                Tours
              </NavLink>
              <NavLink
                to={routes.qr}
                className={({ isActive }) =>
                  `rounded-md border px-3 py-2 font-medium transition ${
                    isActive
                      ? 'border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]'
                      : 'border-transparent text-[var(--app-text)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-heading)]'
                  }`
                }
              >
                QR
              </NavLink>
              <NavLink
                to={routes.media}
                className={({ isActive }) =>
                  `rounded-md border px-3 py-2 font-medium transition ${
                    isActive
                      ? 'border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]'
                      : 'border-transparent text-[var(--app-text)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-heading)]'
                  }`
                }
              >
                Media
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
