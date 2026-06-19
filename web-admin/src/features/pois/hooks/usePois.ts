import { useQuery } from '@tanstack/react-query';
import { poisApi } from '../api/poisApi';

export const POI_KEYS = {
  all: ['pois'] as const,
  list: (page: number, pageSize: number, search?: string, category?: string, isActive?: boolean | string, approvalStatus?: number | string, lifecycleStatus?: number | string, showDeleted?: boolean) => ['pois', 'list', page, pageSize, search ?? '', category ?? '', String(isActive ?? ''), String(approvalStatus ?? ''), String(lifecycleStatus ?? ''), String(showDeleted ?? false)] as const,
  detail: (id: number) => ['pois', id] as const,
};

export function usePois(params: { page?: number; pageSize?: number; search?: string; category?: string; isActive?: boolean | string; approvalStatus?: number | string; lifecycleStatus?: number | string; includeDeleted?: boolean } = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  return useQuery({
    queryKey: POI_KEYS.list(page, pageSize, params.search, params.category, params.isActive, params.approvalStatus, params.lifecycleStatus, params.includeDeleted),
    queryFn: async () => {
      return poisApi.getAll(params);
    },
  });
}

export default usePois;
