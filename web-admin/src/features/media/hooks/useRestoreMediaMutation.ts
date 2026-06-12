import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createMediaApi } from '@/features/media/api/mediaApi';
import { mediaQueryKeys } from '@/features/media/hooks/useMediaQuery';

export function useRestoreMediaMutation() {
  const { httpClient } = useAuth();
  const queryClient = useQueryClient();
  const mediaApi = useMemo(() => createMediaApi(httpClient), [httpClient]);

  return useMutation({
    mutationFn: (id: number) => mediaApi.restoreMedia(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
    },
  });
}
