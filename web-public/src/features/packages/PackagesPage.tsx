import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { publicPackagesApi, type PublicPackageDto } from '../../api/publicPackagesApi';
import { publicAccessApi } from '../../api/publicAccessApi';
import { AccessCountdown } from '../access/AccessCountdown';
import { guestAccessStore, type GuestAccessRecord } from '../access/guestAccessStore';
import type { Lang } from '../../hooks/useLanguage';
import { useI18n } from '../../i18n/I18nContext';
import { ROUTES } from '../../routes/routeConstants';

interface PackageState { isProcessing: boolean; error: string | null; access: GuestAccessRecord | null; }
export function PackagesPage({ lang }: { lang: Lang }) {
  const { t } = useI18n();
  const packagesQuery = useQuery({ queryKey: ['public-packages'], queryFn: () => publicPackagesApi.getAll() });
  const [states, setStates] = useState<Record<string, PackageState>>({});
  const setPackageState = (code: string, next: Partial<PackageState>) => setStates((current) => ({ ...current, [code]: { ...current[code], isProcessing: false, error: null, access: guestAccessStore.get(code), ...next } }));
  useEffect(() => {
    let cancelled = false;
    const storedPasses = guestAccessStore.getAllActive();

    void Promise.allSettled(storedPasses.map(async (storedPass) => {
      try {
        const validation = await publicAccessApi.validate(storedPass.accessToken);
        if (cancelled) return;

        if (!validation.isValid || !validation.expiresAt) {
          guestAccessStore.remove(storedPass.qrCode);
          setPackageState(storedPass.qrCode, { access: null });
          return;
        }

        const restoredPass: GuestAccessRecord = {
          ...storedPass,
          expiresAt: validation.expiresAt,
          poiId: validation.poiId,
          tourId: validation.tourId,
        };
        guestAccessStore.set(restoredPass);
        setPackageState(restoredPass.qrCode, { access: restoredPass });
      } catch {
        // Keep the locally stored pass when validation cannot run because of a network error.
      }
    }));

    return () => { cancelled = true; };
  }, []);
  const purchaseMutation = useMutation({ mutationFn: async (pkg: PublicPackageDto) => { setPackageState(pkg.code, { isProcessing: true, error: null }); const started = await publicAccessApi.start(pkg.code); if (!started.requiresPayment && started.accessToken && started.expiresAt) return { qrCode: pkg.code, accessToken: started.accessToken, expiresAt: started.expiresAt, poiId: started.qr.poiId, tourId: started.qr.tourId } satisfies GuestAccessRecord; if (!started.paymentSessionId) throw new Error(); const paid = await publicAccessApi.simulatePayment(started.paymentSessionId, true); if (!paid.accessToken || !paid.expiresAt) throw new Error(); return { qrCode: pkg.code, accessToken: paid.accessToken, expiresAt: paid.expiresAt, poiId: paid.poiId, tourId: paid.tourId } satisfies GuestAccessRecord; }, onSuccess: (access) => { guestAccessStore.set(access); setPackageState(access.qrCode, { access }); }, onError: (_, pkg) => setPackageState(pkg.code, { error: t('cannotPlay') }) });
  const packages = packagesQuery.data ?? [];
  return <main className="min-h-screen bg-gray-950 px-4 py-24 text-white"><div className="mx-auto max-w-6xl"><div className="mb-8"><p className="mb-2 text-sm font-medium text-emerald-300">VinhHy AudioTour</p><h1 className="text-3xl font-bold">{t('passesTitle')}</h1><p className="mt-3 max-w-2xl text-sm text-gray-300">{t('passesText')}</p></div>{packagesQuery.isLoading ? <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">{t('loadingPasses')}</div> : null}{packagesQuery.error || (!packagesQuery.isLoading && !packages.length) ? <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">{t('noPasses')}</div> : null}<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{packages.map((pkg) => <PackageCard key={pkg.code} pkg={pkg} lang={lang} state={states[pkg.code]} onBuy={() => purchaseMutation.mutate(pkg)} onExpired={() => { guestAccessStore.remove(pkg.code); setPackageState(pkg.code, { access: null }); }} />)}</div></div></main>;
}

function PackageCard({ pkg, lang, state, onBuy, onExpired }: { pkg: PublicPackageDto; lang: Lang; state?: PackageState; onBuy: () => void; onExpired: () => void }) {
  const { t } = useI18n(); const storedAccess = useMemo(() => guestAccessStore.get(pkg.code), [pkg.code, state?.access]); const access = state?.access ?? storedAccess; const isProcessing = state?.isProcessing ?? false;
  return <article className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl"><div className="mb-5"><p className="text-xs font-medium uppercase text-emerald-300">{pkg.requiresPayment ? t('pay') : t('free')}</p><h2 className="mt-2 text-xl font-semibold">{t('passesTitle')}</h2><p className="mt-2 text-sm text-gray-400">{pkg.code}</p></div><div className="mb-5 flex items-end gap-2"><span className="text-3xl font-bold">{pkg.requiresPayment ? formatCurrency(pkg.priceAmount, lang) : t('free')}</span><span className="pb-1 text-sm text-gray-400">/ {pkg.accessDurationMinutes} {t('minutes')}</span></div><ul className="mb-6 space-y-2 text-sm text-gray-300"><li>{t('passBenefitArea')}</li><li>{t('passBenefitPoi')}</li><li>{t('passBenefitLanguage')}</li></ul>{access ? <div className="space-y-3"><AccessCountdown expiresAt={access.expiresAt} onExpired={onExpired} /><Link to={ROUTES.TOURS} className="block rounded-xl bg-emerald-600 py-3 text-center text-sm font-medium text-white">{t('startListening')}</Link></div> : <button type="button" disabled={isProcessing} onClick={onBuy} className="w-full rounded-xl bg-pink-600 py-3 text-sm font-medium text-white disabled:opacity-60">{isProcessing ? t('processing') : t('pay')}</button>}{state?.error ? <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-100">{state.error}</div> : null}</article>;
}
function formatCurrency(amount: number, lang: Lang): string { return new Intl.NumberFormat(lang, { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount); }
