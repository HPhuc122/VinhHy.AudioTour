import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { ROUTES } from './routeConstants';

interface Props {
  allowedRoles?: string[];
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, user, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
