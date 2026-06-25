import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createAnalyticsApi, type AnalyticsQueryFilter } from '@/features/analytics/api/analyticsApi';

export const analyticsQueryKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsQueryKeys.all, 'dashboard'] as const,
  daily: (filter: AnalyticsQueryFilter) => [...analyticsQueryKeys.all, 'daily', filter] as const,
  summary: (filter: AnalyticsQueryFilter) => [...analyticsQueryKeys.all, 'summary', filter] as const,
  grouped: (filter: AnalyticsQueryFilter) => [...analyticsQueryKeys.all, 'grouped', filter] as const,
};

export function useDashboardStatsQuery(options?: { enabled?: boolean }) {
  const { httpClient } = useAuth();
  const analyticsApi = useMemo(() => createAnalyticsApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: analyticsQueryKeys.dashboard(),
    queryFn: () => analyticsApi.getDashboard(),
    enabled: options?.enabled ?? true,
    staleTime: 0,           // always consider stale — rely on refetchInterval for freshness
    refetchInterval: options?.enabled === false ? false : 10000,
  });
}

export function useAnalyticsDailyQuery(filter: AnalyticsQueryFilter, options?: { enabled?: boolean }) {
  const { httpClient } = useAuth();
  const analyticsApi = useMemo(() => createAnalyticsApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: analyticsQueryKeys.daily(filter),
    queryFn: () => analyticsApi.getDaily(filter),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.enabled === false ? false : 10000,
  });
}

export function useAnalyticsSummaryQuery(filter: AnalyticsQueryFilter, options?: { enabled?: boolean }) {
  const { httpClient } = useAuth();
  const analyticsApi = useMemo(() => createAnalyticsApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: analyticsQueryKeys.summary(filter),
    queryFn: () => analyticsApi.getSummary(filter),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.enabled === false ? false : 10000,
  });
}

export function useAnalyticsGroupedQuery(filter: AnalyticsQueryFilter, options?: { enabled?: boolean }) {
  const { httpClient } = useAuth();
  const analyticsApi = useMemo(() => createAnalyticsApi(httpClient), [httpClient]);

  return useQuery({
    queryKey: analyticsQueryKeys.grouped(filter),
    queryFn: () => analyticsApi.getGrouped(filter),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.enabled === false ? false : 10000,
  });
}
