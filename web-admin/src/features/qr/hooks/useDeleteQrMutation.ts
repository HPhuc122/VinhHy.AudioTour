import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createQrApi } from '@/features/qr/api/qrApi';
import { qrQueryKeys } from '@/features/qr/hooks/useQrsQuery';

export function useDeleteQrMutation() {
  const { httpClient } = useAuth();
  const queryClient = useQueryClient();
  const qrApi = useMemo(() => createQrApi(httpClient), [httpClient]);

  return useMutation({
    mutationKey: ['qr', 'delete'],
    mutationFn: (id: number) => qrApi.deleteQr(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qrQueryKeys.all });
    },
  });
}
