import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { extractApiError } from '@/api/apiError';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { getDefaultRouteForRole } from '@/features/auth/roleAccess';

export function useLogin() {
  const { login } = useAuthContext();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,
    onSuccess(session) {
      navigate(getDefaultRouteForRole(session.user.role), { replace: true });
    },
    onError(error) {
      return extractApiError(error);
    },
  });
}
