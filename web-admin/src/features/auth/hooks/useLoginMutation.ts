import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { LoginRequest } from '@/types/auth';

export function useLoginMutation() {
  const { login } = useAuth();

  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: (credentials: LoginRequest) => login(credentials),
  });
}
