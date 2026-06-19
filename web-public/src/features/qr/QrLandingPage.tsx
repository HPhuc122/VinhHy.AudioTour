import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { publicAccessApi } from '../../api/publicAccessApi';
import { qrApi } from '../../api/qrApi';
import { Spinner } from '../../components/ui/Spinner';
import { AccessCountdown } from '../access/AccessCountdown';
import { guestAccessStore } from '../access/guestAccessStore';
import { PaymentRequiredPanel } from '../access/PaymentRequiredPanel';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';

interface Props {
  lang: Lang;
}

export function QrLandingPage({ lang }: Props) {
  const { code } = useParams<{ code: string }>();
  const [clientExpired, setClientExpired] = useState(false);
  const [storedAccess, setStoredAccess] = useState(() =>
    code ? guestAccessStore.get(code) : null,
  );

  useEffect(() => {
    setClientExpired(false);
    setStoredAccess(code ? guestAccessStore.get(code) : null);
  }, [code]);

  const validateQuery = useQuery({
    queryKey: ['guest-access-validate', code, storedAccess?.accessToken],
    queryFn: () => publicAccessApi.validate(storedAccess!.accessToken),
    enabled: !!code && !!storedAccess?.accessToken,
    retry: false,
  });

  useEffect(() => {
    if (code && validateQuery.data && !validateQuery.data.isValid) {
      guestAccessStore.remove(code);
      setStoredAccess(null);
    }
  }, [code, validateQuery.data]);

  const shouldStartAccess =
    !!code &&
    (!storedAccess?.accessToken ||
      (validateQuery.isSuccess && validateQuery.data?.isValid === false));

  const startAccessQuery = useQuery({
    queryKey: ['guest-access-start', code],
    queryFn: () => publicAccessApi.start(code!),
    enabled: shouldStartAccess,
    retry: false,
  });

  useEffect(() => {
    if (!code || !startAccessQuery.data?.accessToken || !startAccessQuery.data.expiresAt) {
      return;
    }

    const nextAccess = {
      qrCode: code,
      accessToken: startAccessQuery.data.accessToken,
      expiresAt: startAccessQuery.data.expiresAt,
      poiId: startAccessQuery.data.qr.poiId,
      tourId: startAccessQuery.data.qr.tourId,
    };
    guestAccessStore.set(nextAccess);
    setStoredAccess(nextAccess);
  }, [code, startAccessQuery.data]);

  const paymentMutation = useMutation({
    mutationFn: () => publicAccessApi.simulatePayment(startAccessQuery.data!.paymentSessionId!, true),
    onSuccess: (data) => {
      if (!code || !data.accessToken || !data.expiresAt) {
        return;
      }

      const nextAccess = {
        qrCode: code,
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
        poiId: data.poiId,
        tourId: data.tourId,
      };
      guestAccessStore.set(nextAccess);
      setStoredAccess(nextAccess);
    },
  });

  const activeAccess = useMemo(() => {
    if (validateQuery.data?.isValid && storedAccess) {
      return {
        token: storedAccess.accessToken,
        expiresAt: validateQuery.data.expiresAt ?? storedAccess.expiresAt,
      };
    }

    if (startAccessQuery.data?.accessToken && startAccessQuery.data.expiresAt) {
      return {
        token: startAccessQuery.data.accessToken,
        expiresAt: startAccessQuery.data.expiresAt,
      };
    }

    if (paymentMutation.data?.accessToken && paymentMutation.data.expiresAt) {
      return {
        token: paymentMutation.data.accessToken,
        expiresAt: paymentMutation.data.expiresAt,
      };
    }

    return null;
  }, [paymentMutation.data, startAccessQuery.data, storedAccess, validateQuery.data]);

  const visibleAccess = clientExpired ? null : activeAccess;

  const contentQuery = useQuery({
    queryKey: ['qr', code, lang, visibleAccess?.token],
    queryFn: () => qrApi.scan(code!, lang),
    enabled: !!code && !!visibleAccess,
    retry: false,
  });

  const handleExpired = () => {
    if (!code) {
      return;
    }

    guestAccessStore.remove(code);
    setStoredAccess(null);
    setClientExpired(true);
  };

  if (validateQuery.isLoading || startAccessQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-sm text-gray-400">Đang chuẩn bị vé thuyết minh toàn khu...</p>
        </div>
      </div>
    );
  }

  if (!code || startAccessQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mb-4 text-6xl">!</div>
          <h1 className="mb-2 text-xl font-bold text-white">Invalid QR code</h1>
          <p className="mb-6 text-sm text-gray-400">This QR code is inactive or does not exist.</p>
          <Link
            to={ROUTES.HOME}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm text-white transition-colors hover:bg-emerald-700"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  if (!visibleAccess && !clientExpired && startAccessQuery.data?.requiresPayment) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <span className="inline-block rounded-full border border-pink-500/30 bg-pink-500/20 px-3 py-1 text-xs font-medium text-pink-300">
              Vé thuyết minh toàn khu
            </span>
          </div>
          <PaymentRequiredPanel
            amount={startAccessQuery.data.amount}
            currency={startAccessQuery.data.currency}
            durationMinutes={startAccessQuery.data.accessDurationMinutes}
            isPaying={paymentMutation.isPending}
            errorMessage={paymentMutation.isError ? 'Simulated payment failed.' : null}
            onPay={() => paymentMutation.mutate()}
          />
          <div className="mt-6 text-center">
            <Link to={ROUTES.HOME} className="text-xs text-gray-500 transition-colors hover:text-gray-300">
              Về VinhHy AudioTour
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (contentQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-sm text-gray-400">Đang tải quyền truy cập AudioTour...</p>
        </div>
      </div>
    );
  }

  if (contentQuery.isError || !contentQuery.data || !visibleAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mb-4 text-6xl">!</div>
          <h1 className="mb-2 text-xl font-bold text-white">Access unavailable</h1>
          <p className="mb-6 text-sm text-gray-400">This access pass is expired or invalid.</p>
          <Link
            to={ROUTES.HOME}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm text-white transition-colors hover:bg-emerald-700"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  const result = contentQuery.data;
  const poi = result.poi;
  const tour = result.tour;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            Vé thuyết minh toàn khu đang hoạt động
          </span>
        </div>

        <div className="mb-4">
          <AccessCountdown expiresAt={visibleAccess.expiresAt} onExpired={handleExpired} />
        </div>

        {!tour && !poi ? (
          <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-6 text-center shadow-2xl">
            <h1 className="mb-3 text-2xl font-bold text-white">Sử dụng AudioTour trong toàn khu</h1>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              Vé của bạn có hiệu lực với mọi nội dung thuyết minh trong khu vực cho đến khi hết thời gian.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                to={ROUTES.TOURS}
                className="block rounded-xl bg-emerald-600 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Xem danh sách tour
              </Link>
              <Link
                to={ROUTES.MAP}
                className="block rounded-xl bg-gray-700 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-600"
              >
                Mở bản đồ
              </Link>
            </div>
          </div>
        ) : null}

        {tour ? (
          <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
            <div className="flex h-52 items-center justify-center bg-gradient-to-br from-emerald-900/50 to-gray-800 text-7xl">
              T
            </div>
            <div className="p-6">
              <p className="mb-2 text-sm font-medium text-emerald-300">Tour</p>
              <h1 className="mb-2 text-2xl font-bold text-white">{tour.name}</h1>
              {tour.description ? (
                <p className="mb-6 text-sm leading-relaxed text-gray-400">{tour.description}</p>
              ) : null}
              <div className="flex flex-col gap-2">
                <Link
                  to={ROUTES.TOUR_DETAIL.replace(':id', String(tour.id))}
                  className="block rounded-xl bg-emerald-600 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  View tour details
                </Link>
                <Link
                  to={ROUTES.TOUR_ROUTE.replace(':id', String(tour.id))}
                  className="block rounded-xl bg-gray-700 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-600"
                >
                  View route
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {poi ? (
          <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
            {poi.imageUrl ? (
              <img src={poi.imageUrl} alt={poi.name} className="h-52 w-full object-cover" />
            ) : (
              <div className="flex h-52 items-center justify-center bg-gradient-to-br from-emerald-900/50 to-gray-800 text-7xl">
                P
              </div>
            )}
            <div className="p-6">
              <h1 className="mb-2 text-2xl font-bold text-white">{poi.name}</h1>
              {poi.shortDescription ? (
                <p className="mb-4 text-sm text-emerald-300">{poi.shortDescription}</p>
              ) : null}
              {poi.description ? (
                <p className="mb-6 text-sm leading-relaxed text-gray-400">{poi.description}</p>
              ) : null}
              <Link
                to={ROUTES.POI_DETAIL.replace(':id', String(poi.poiId))}
                className="block rounded-xl bg-emerald-600 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                View POI details
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-6 text-center">
          <Link to={ROUTES.HOME} className="text-xs text-gray-500 transition-colors hover:text-gray-300">
            Về VinhHy AudioTour
          </Link>
        </div>
      </div>
    </div>
  );
}
