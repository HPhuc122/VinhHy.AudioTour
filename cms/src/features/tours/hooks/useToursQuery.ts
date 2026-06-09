import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createTourApi, type TourListFilter } from '@/features/tours/api/tourApi';

export const tourQueryKeys = {
  all: ['tours'] as const,
  list: (filter: TourListFilter) => [...tourQueryKeys.all, 'list', filter] as const,
  detail: (id: number) => [...tourQueryKeys.all, 'detail', id] as const,
};

export function useToursQuery(filter: TourListFilter = {}) {
  const { httpClient } = useAuth();
  const tourApi = useMemo(() => createTourApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: tourQueryKeys.list(filter),
    queryFn: () => tourApi.getTours(filter),
  });
}
