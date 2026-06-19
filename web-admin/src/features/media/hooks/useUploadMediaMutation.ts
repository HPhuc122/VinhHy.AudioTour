import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createMediaApi } from '@/features/media/api/mediaApi';
import { mediaQueryKeys } from '@/features/media/hooks/useMediaQuery';

export function useUploadMediaMutation() {
  const { httpClient } = useAuth();
  const queryClient = useQueryClient();
  const mediaApi = useMemo(() => createMediaApi(httpClient), [httpClient]);

  return useMutation({
    mutationFn: ({ file, poiId }: { file: File; poiId?: number }) => mediaApi.uploadMedia({ file, poiId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
    },
  });
}
