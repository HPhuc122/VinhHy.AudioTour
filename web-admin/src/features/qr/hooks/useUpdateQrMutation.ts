import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createQrApi, type UpdateQrRequest } from '@/features/qr/api/qrApi';
import { qrQueryKeys } from '@/features/qr/hooks/useQrsQuery';

export interface UpdateQrMutationRequest {
  id: number;
  values: UpdateQrRequest;
}

export function useUpdateQrMutation() {
  const { httpClient } = useAuth();
  const queryClient = useQueryClient();
  const qrApi = useMemo(() => createQrApi(httpClient), [httpClient]);

  return useMutation({
    mutationKey: ['qr', 'update'],
    mutationFn: ({ id, values }: UpdateQrMutationRequest) => qrApi.updateQr(id, values),
    onSuccess: (qr) => {
      void queryClient.invalidateQueries({ queryKey: qrQueryKeys.all });
      void queryClient.setQueryData(qrQueryKeys.detail(qr.id), qr);
    },
  });
}
