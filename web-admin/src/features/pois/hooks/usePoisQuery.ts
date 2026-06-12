import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPoisApi, type PoiListFilter } from '@/features/pois/api/poisApi';

export const poiQueryKeys = {
  all: ['pois'] as const,
  list: (filter: PoiListFilter) => [...poiQueryKeys.all, 'list', filter] as const,
};

export function usePoisQuery(filter: PoiListFilter = {}) {
  const { httpClient } = useAuth();
  const poisApi = useMemo(() => createPoisApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: poiQueryKeys.list(filter),
    queryFn: () => poisApi.getPois(filter),
  });
}
