import { Link, Navigate, useLocation } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { routes } from '@/config/routes';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getDefaultRouteForRole } from '@/features/auth/roleAccess';

interface LoginLocationState {
  message?: string;
}

export function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const state = location.state as LoginLocationState | null;

  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
            K
          </div>
          <h1 className="text-xl font-bold text-gray-900">KhanhHoi AudioTour</h1>
          <p className="mt-1 text-sm text-gray-500">CMS Admin</p>
        </div>

        {state?.message ? (
          <div className="mb-4">
            <Alert message={state.message} />
          </div>
        ) : null}

        <LoginForm />

        <div className="mt-5 text-center">
          <Link
            to={routes.registerVendor}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Đăng ký tài khoản chủ sạp
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} KhanhHoi AudioTour
        </p>
      </div>
    </div>
  );
}
