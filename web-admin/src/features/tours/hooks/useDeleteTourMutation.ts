import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createTourApi } from '@/features/tours/api/tourApi';
import { tourQueryKeys } from '@/features/tours/hooks/useToursQuery';

export function useDeleteTourMutation() {
  const { httpClient } = useAuth();
  const queryClient = useQueryClient();
  const tourApi = useMemo(() => createTourApi(httpClient), [httpClient]);

  return useMutation({
    mutationKey: ['tours', 'delete'],
    mutationFn: (id: number) => tourApi.deleteTour(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tourQueryKeys.all });
    },
  });
}
