import { useQuery } from '@tanstack/react-query';
import { getPublicTour, getPublicTours, type PublicTourFilter } from '@/features/tours/api/toursApi';

export const publicTourQueryKeys = {
  all: ['public-tours'] as const,
  list: (filter: PublicTourFilter) => [...publicTourQueryKeys.all, 'list', filter] as const,
  detail: (id: number) => [...publicTourQueryKeys.all, 'detail', id] as const,
};

export function usePublicToursQuery(filter: PublicTourFilter = {}) {
  return useQuery({
    queryKey: publicTourQueryKeys.list(filter),
    queryFn: () => getPublicTours(filter),
  });
}

export function usePublicTourQuery(id: number) {
  return useQuery({
    queryKey: publicTourQueryKeys.detail(id),
    queryFn: () => getPublicTour(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
