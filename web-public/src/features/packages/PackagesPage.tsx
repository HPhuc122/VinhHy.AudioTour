import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { publicPackagesApi, type PublicPackageDto } from '../../api/publicPackagesApi';
import { publicAccessApi } from '../../api/publicAccessApi';
import { AccessCountdown } from '../access/AccessCountdown';
import { guestAccessStore, type GuestAccessRecord } from '../access/guestAccessStore';
import type { Lang } from '../../hooks/useLanguage';

interface PackagesPageProps {
  lang: Lang;
}

interface PackageState {
  isProcessing: boolean;
  error: string | null;
  access: GuestAccessRecord | null;
}

export function PackagesPage({ lang }: PackagesPageProps) {
  const packagesQuery = useQuery({
    queryKey: ['public-packages'],
    queryFn: () => publicPackagesApi.getAll(),
  });
  const [states, setStates] = useState<Record<string, PackageState>>({});

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PublicPackageDto) => {
      setPackageState(pkg.code, { isProcessing: true, error: null });
      const started = await publicAccessApi.start(pkg.code);

      if (!started.requiresPayment && started.accessToken && started.expiresAt) {
        return {
          qrCode: pkg.code,
          accessToken: started.accessToken,
          expiresAt: started.expiresAt,
          poiId: started.qr.poiId,
          tourId: started.qr.tourId,
        } satisfies GuestAccessRecord;
      }

      if (!started.paymentSessionId) {
        throw new Error('Không thể tạo phiên thanh toán.');
      }

      const paid = await publicAccessApi.simulatePayment(started.paymentSessionId, true);
      if (!paid.accessToken || !paid.expiresAt) {
        throw new Error('Thanh toán chưa cấp quyền truy cập.');
      }

      return {
        qrCode: pkg.code,
        accessToken: paid.accessToken,
        expiresAt: paid.expiresAt,
        poiId: paid.poiId,
        tourId: paid.tourId,
      } satisfies GuestAccessRecord;
    },
    onSuccess: (access) => {
      guestAccessStore.set(access);
      setPackageState(access.qrCode, { isProcessing: false, error: null, access });
    },
    onError: (error, pkg) => {
      setPackageState(pkg.code, {
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Không thể thanh toán gói.',
      });
    },
  });

  const packages = packagesQuery.data ?? [];

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-emerald-300">AudioTour Vĩnh Hy</p>
          <h1 className="text-3xl font-bold">Gói thuyết minh toàn khu</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-300">
            Chọn gói, thanh toán MoMo mô phỏng và sử dụng AudioTour trong thời gian được cấp.
          </p>
        </div>

        {packagesQuery.isLoading ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-gray-300">
            Đang tải gói thuyết minh...
          </div>
        ) : null}

        {packagesQuery.error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
            Không thể tải danh sách gói.
          </div>
        ) : null}

        {!packagesQuery.isLoading && packages.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-gray-300">
            Chưa có gói AudioTour đang hoạt động.
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.code}
              pkg={pkg}
              lang={lang}
              state={states[pkg.code]}
              onBuy={() => purchaseMutation.mutate(pkg)}
              onExpired={() => {
                guestAccessStore.remove(pkg.code);
                setPackageState(pkg.code, { access: null });
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );

  function setPackageState(code: string, next: Partial<PackageState>): void {
    setStates((current) => ({
      ...current,
      [code]: {
        ...current[code],
        isProcessing: false,
        error: null,
        access: guestAccessStore.get(code),
        ...next,
      },
    }));
  }
}

function PackageCard({
  pkg,
  state,
  onBuy,
  onExpired,
}: {
  pkg: PublicPackageDto;
  lang: Lang;
  state?: PackageState;
  onBuy: () => void;
  onExpired: () => void;
}) {
  const storedAccess = useMemo(() => guestAccessStore.get(pkg.code), [pkg.code, state?.access]);
  const access = state?.access ?? storedAccess;
  const isProcessing = state?.isProcessing ?? false;

  return (
    <article className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">
          {pkg.requiresPayment ? 'Thanh toán MoMo mô phỏng' : 'Miễn phí'}
        </p>
        <h2 className="mt-2 text-xl font-semibold">Gói thuyết minh toàn khu</h2>
        <p className="mt-2 text-sm text-gray-400">Mã gói: {pkg.code}</p>
      </div>

      <div className="mb-5 flex items-end gap-2">
        <span className="text-3xl font-bold">
          {pkg.requiresPayment ? formatCurrency(pkg.priceAmount) : 'Miễn phí'}
        </span>
        <span className="pb-1 text-sm text-gray-400">/ {pkg.accessDurationMinutes} phút</span>
      </div>

      <ul className="mb-6 space-y-2 text-sm text-gray-300">
        <li>Sử dụng AudioTour trong toàn khu</li>
        <li>Nghe thuyết minh tại POI và lộ trình tour</li>
        <li>Đổi ngôn ngữ trên website công khai</li>
      </ul>

      {access ? (
        <div className="space-y-3">
          <AccessCountdown expiresAt={access.expiresAt} onExpired={onExpired} />
          <a
            href="/tours"
            className="block rounded-xl bg-emerald-600 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Bắt đầu AudioTour
          </a>
        </div>
      ) : (
        <button
          type="button"
          disabled={isProcessing}
          onClick={onBuy}
          className="w-full rounded-xl bg-pink-600 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-900"
        >
          {isProcessing ? 'Đang xử lý...' : 'Thanh toán MoMo'}
        </button>
      )}

      {state?.error ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {state.error}
        </div>
      ) : null}
    </article>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
