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
      <div className="app-card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-lg font-semibold text-[var(--app-accent-strong)]">
            V
          </div>
          <h1 className="text-2xl font-semibold text-[var(--app-heading)]">VinhHy CMS</h1>
          <p className="mt-1 text-sm text-[var(--app-text)]">Sign in to manage audio tour content</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
