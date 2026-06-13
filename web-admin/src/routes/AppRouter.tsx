import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { UsersPage } from '../features/users/pages/UsersPage';
import { RolesPage } from '../features/roles/pages/RolesPage';
import { PoiPage } from '../features/pois/pages/PoiPage';
import { ROUTES } from './routeConstants';

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      {/* Protected — any authenticated staff */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />

          {/* SuperAdmin only */}
          <Route
            element={<ProtectedRoute allowedRoles={['SuperAdmin']} />}
          >
            <Route path={ROUTES.USERS} element={<UsersPage />} />
            <Route path={ROUTES.ROLES} element={<RolesPage />} />
          </Route>

          {/* SuperAdmin + ContentAdmin */}
          <Route element={<ProtectedRoute allowedRoles={['SuperAdmin', 'ContentAdmin']} />}>
            <Route path={ROUTES.POIS} element={<PoiPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
