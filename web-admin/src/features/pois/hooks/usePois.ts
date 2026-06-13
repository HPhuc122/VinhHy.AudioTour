import { useQuery } from '@tanstack/react-query';
import { httpClient } from '../../../api/httpClient';
import type { ApiResponse, PagedResult } from '../../../types/api';
import { poisApi } from '../api/poisApi';

export const POI_KEYS = {
  all: ['pois'] as const,
  list: (page: number, pageSize: number) => ['pois', 'list', page, pageSize] as const,
  detail: (id: number) => ['pois', id] as const,
};

export function usePois(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: POI_KEYS.list(page, pageSize),
    queryFn: async () => {
      return poisApi.getAll(page, pageSize);
    },
  });
}

export default usePois;
