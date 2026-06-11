import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createQrApi } from '@/features/qr/api/qrApi';

export const qrQueryKeys = {
  all: ['qr'] as const,
  list: () => [...qrQueryKeys.all, 'list'] as const,
  detail: (id: number) => [...qrQueryKeys.all, 'detail', id] as const,
};

export function useQrsQuery() {
  const { httpClient } = useAuth();
  const qrApi = useMemo(() => createQrApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: qrQueryKeys.list(),
    queryFn: () => qrApi.getQrs(),
  });
}
