import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { extractApiError } from '@/api/apiError';
import { routes } from '@/config/routes';
import { useAuthContext } from '@/features/auth/context/AuthContext';

export function useLogin() {
  const { login } = useAuthContext();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,
    onSuccess() {
      navigate(routes.dashboard, { replace: true });
    },
    onError(error) {
      return extractApiError(error);
    },
  });
}
