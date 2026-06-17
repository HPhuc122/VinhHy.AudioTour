import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { routes } from '@/config/routes';
import { useAuth } from '@/features/auth/context/AuthContext';
import { roleMatches } from '@/features/auth/roleAccess';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <Spinner label="Restoring session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={routes.login} replace state={{ from: location.pathname }} />;
  }

  if (!roleMatches(user?.role, allowedRoles)) {
    return <Navigate to={routes.dashboard} replace />;
  }

  return <Outlet />;
}
