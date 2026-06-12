import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createLanguagesApi } from '@/features/languages/api/languagesApi';

export const languageQueryKeys = {
  all: ['languages'] as const,
  list: (activeOnly: boolean) => [...languageQueryKeys.all, 'list', activeOnly] as const,
};

export function useLanguagesQuery(activeOnly = true) {
  const { httpClient } = useAuth();
  const languagesApi = useMemo(() => createLanguagesApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: languageQueryKeys.list(activeOnly),
    queryFn: () => languagesApi.getLanguages(activeOnly),
  });
}
