import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createTourApi, type UpdateTourRequest } from '@/features/tours/api/tourApi';
import { tourQueryKeys } from '@/features/tours/hooks/useToursQuery';

export interface UpdateTourMutationRequest {
  id: number;
  values: UpdateTourRequest;
}

export function useUpdateTourMutation() {
  const { httpClient } = useAuth();
  const queryClient = useQueryClient();
  const tourApi = useMemo(() => createTourApi(httpClient), [httpClient]);

  return useMutation({
    mutationKey: ['tours', 'update'],
    mutationFn: ({ id, values }: UpdateTourMutationRequest) => tourApi.updateTour(id, values),
    onSuccess: (tour) => {
      void queryClient.invalidateQueries({ queryKey: tourQueryKeys.all });
      void queryClient.setQueryData(tourQueryKeys.detail(tour.id), tour);
    },
  });
}
