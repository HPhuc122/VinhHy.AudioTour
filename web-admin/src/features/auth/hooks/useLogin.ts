import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { extractApiError } from '../../../api/apiError';
import { ROUTES } from '../../../routes/routeConstants';

export function useLogin() {
  const { login } = useAuthContext();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,
    onSuccess() {
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError(error) {
      return extractApiError(error);
    },
  });
}
