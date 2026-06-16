import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { routes } from '@/config/routes';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { LanguagePage } from '@/features/languages/pages/LanguagePage';
import { MediaLibraryPage } from '@/features/media/pages/MediaLibraryPage';
import { PoiPage } from '@/features/pois/pages/PoiPage';
import { QrCreatePage } from '@/features/qr/pages/QrCreatePage';
import { QrEditPage } from '@/features/qr/pages/QrEditPage';
import { QrListPage } from '@/features/qr/pages/QrListPage';
import { RolesPage } from '@/features/roles/pages/RolesPage';
import { TourCreatePage } from '@/features/tours/pages/TourCreatePage';
import { TourEditPage } from '@/features/tours/pages/TourEditPage';
import { TourListPage } from '@/features/tours/pages/TourListPage';
import { UsersPage } from '@/features/users/pages/UsersPage';
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={routes.login} element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path={routes.dashboard} element={<DashboardPage />} />
            <Route path={routes.profile} element={<ProfilePage />} />
            <Route path={routes.tours} element={<TourListPage />} />
            <Route path={routes.tourCreate} element={<TourCreatePage />} />
            <Route path={routes.tourEdit} element={<TourEditPage />} />
            <Route path={routes.media} element={<MediaLibraryPage />} />
            <Route path={routes.qr} element={<QrListPage />} />
            <Route path={routes.qrCreate} element={<QrCreatePage />} />
            <Route path={routes.qrEdit} element={<QrEditPage />} />
            <Route element={<ProtectedRoute allowedRoles={['SuperAdmin', 'ContentAdmin']} />}>
              <Route path={routes.pois} element={<PoiPage />} />
              <Route path={routes.languages} element={<LanguagePage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['SuperAdmin']} />}>
              <Route path={routes.users} element={<UsersPage />} />
              <Route path={routes.roles} element={<RolesPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
