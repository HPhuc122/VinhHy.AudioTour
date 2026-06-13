import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthContext } from '../context/AuthContext';
import { extractApiError } from '../../../api/apiError';
import { ROUTES } from '../../../routes/routeConstants';

export function useLogin() {
  const { login } = useAuthContext();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess(data) {
      login(data);
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError(error) {
      return extractApiError(error);
    },
  });
}
