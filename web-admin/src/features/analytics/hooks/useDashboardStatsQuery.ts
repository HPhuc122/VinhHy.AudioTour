import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createAnalyticsApi } from '@/features/analytics/api/analyticsApi';

export const analyticsQueryKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsQueryKeys.all, 'dashboard'] as const,
};

export function useDashboardStatsQuery(options?: { enabled?: boolean }) {
  const { httpClient } = useAuth();
  const analyticsApi = useMemo(() => createAnalyticsApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: analyticsQueryKeys.dashboard(),
    queryFn: () => analyticsApi.getDashboard(),
    enabled: options?.enabled ?? true,
  });
}
