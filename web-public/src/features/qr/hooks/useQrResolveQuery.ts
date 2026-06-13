import { useQuery } from '@tanstack/react-query';
import { resolveQr } from '@/features/qr/api/qrApi';

export const qrQueryKeys = {
  all: ['qr'] as const,
  resolve: (code: string) => [...qrQueryKeys.all, 'resolve', code] as const,
};

export function useQrResolveQuery(code: string) {
  return useQuery({
    queryKey: qrQueryKeys.resolve(code),
    queryFn: () => resolveQr(code),
    enabled: code.trim().length > 0,
  });
}
