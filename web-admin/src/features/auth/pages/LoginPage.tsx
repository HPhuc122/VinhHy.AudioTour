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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">VinhHy CMS</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to manage audio tour content</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
