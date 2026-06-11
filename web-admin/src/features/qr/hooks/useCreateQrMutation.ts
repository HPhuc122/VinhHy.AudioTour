import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createQrApi, type CreateQrRequest } from '@/features/qr/api/qrApi';
import { qrQueryKeys } from '@/features/qr/hooks/useQrsQuery';

export function useCreateQrMutation() {
  const { httpClient } = useAuth();
  const queryClient = useQueryClient();
  const qrApi = useMemo(() => createQrApi(httpClient), [httpClient]);

  return useMutation({
    mutationKey: ['qr', 'create'],
    mutationFn: (request: CreateQrRequest) => qrApi.createQr(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qrQueryKeys.all });
    },
  });
}
