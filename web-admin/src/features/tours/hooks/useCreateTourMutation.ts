import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createTourApi, type CreateTourRequest } from '@/features/tours/api/tourApi';
import { tourQueryKeys } from '@/features/tours/hooks/useToursQuery';

export function useCreateTourMutation() {
  const { httpClient } = useAuth();
  const queryClient = useQueryClient();
  const tourApi = useMemo(() => createTourApi(httpClient), [httpClient]);

  return useMutation({
    mutationKey: ['tours', 'create'],
    mutationFn: (request: CreateTourRequest) => tourApi.createTour(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tourQueryKeys.all });
    },
  });
}
