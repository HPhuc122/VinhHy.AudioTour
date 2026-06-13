import { NavLink, Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-950">Vinh Hy Audio Tour</p>
            <p className="text-sm text-slate-600">Self-guided tour routes and QR experiences</p>
          </div>
          <nav className="flex gap-2 text-sm font-medium">
            <NavLink
              to="/tours"
              className={({ isActive }) =>
                `rounded-md px-3 py-2 transition ${
                  isActive ? 'bg-sky-100 text-sky-900' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              Tours
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
