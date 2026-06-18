import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createMediaApi, type MediaSearchFilter } from '@/features/media/api/mediaApi';

export const mediaQueryKeys = {
  all: ['media'] as const,
  list: (filter: MediaSearchFilter) => [...mediaQueryKeys.all, 'list', filter] as const,
};

export function useMediaQuery(filter: MediaSearchFilter = {}, options?: { enabled?: boolean }) {
  const { httpClient } = useAuth();
  const mediaApi = useMemo(() => createMediaApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: mediaQueryKeys.list(filter),
    queryFn: () => mediaApi.searchMedia(filter),
    enabled: options?.enabled ?? true,
  });
}
