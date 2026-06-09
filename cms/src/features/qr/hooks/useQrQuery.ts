import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createQrApi } from '@/features/qr/api/qrApi';
import { qrQueryKeys } from '@/features/qr/hooks/useQrsQuery';

export function useQrQuery(id: number | null) {
  const { httpClient } = useAuth();
  const qrApi = useMemo(() => createQrApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: id === null ? [...qrQueryKeys.all, 'detail', 'missing'] : qrQueryKeys.detail(id),
    queryFn: () => {
      if (id === null) {
        throw new Error('QR id is required.');
      }
      return qrApi.getQr(id);
    },
    enabled: id !== null,
  });
}
