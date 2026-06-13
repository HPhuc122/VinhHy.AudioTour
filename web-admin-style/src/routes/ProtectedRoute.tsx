import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { ROUTES } from './routeConstants';

interface Props {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
