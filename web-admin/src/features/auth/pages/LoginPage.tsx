import { Navigate } from 'react-router-dom';
import { routes } from '@/config/routes';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/context/AuthContext';

export function LoginPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={routes.dashboard} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
            V
          </div>
          <h1 className="text-xl font-bold text-gray-900">VinhHy AudioTour</h1>
          <p className="mt-1 text-sm text-gray-500">CMS Admin</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} VinhHy AudioTour
        </p>
      </div>
    </div>
  );
}
