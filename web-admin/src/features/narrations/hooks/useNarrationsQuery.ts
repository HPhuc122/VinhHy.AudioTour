import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  createNarrationsApi,
  type NarrationSearchFilter,
} from '@/features/narrations/api/narrationsApi';

export const narrationQueryKeys = {
  all: ['narrations'] as const,
  list: (filter: NarrationSearchFilter) => [...narrationQueryKeys.all, 'list', filter] as const,
};

export function useNarrationsQuery(filter: NarrationSearchFilter = {}, options?: { enabled?: boolean }) {
  const { httpClient } = useAuth();
  const narrationsApi = useMemo(() => createNarrationsApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: narrationQueryKeys.list(filter),
    queryFn: () => narrationsApi.searchNarrations(filter),
    enabled: options?.enabled ?? true,
  });
}
