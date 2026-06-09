import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createTourApi } from '@/features/tours/api/tourApi';
import { tourQueryKeys } from '@/features/tours/hooks/useToursQuery';

export function useTourQuery(id: number | null) {
  const { httpClient } = useAuth();
  const tourApi = useMemo(() => createTourApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: id === null ? [...tourQueryKeys.all, 'detail', 'missing'] : tourQueryKeys.detail(id),
    queryFn: () => {
      if (id === null) {
        throw new Error('Tour id is required.');
      }
      return tourApi.getTour(id);
    },
    enabled: id !== null,
  });
}
