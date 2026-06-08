import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { routes } from '@/config/routes';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={routes.login} element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path={routes.dashboard} element={<DashboardPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
