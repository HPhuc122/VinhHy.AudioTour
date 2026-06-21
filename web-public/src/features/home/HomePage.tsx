import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { poisApi } from '../../api/poisApi';
import { toursApi } from '../../api/toursApi';
import { PoiCard } from '../../components/ui/PoiCard';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';
import { useI18n } from '../../i18n/I18nContext';

export function HomePage({ lang }: { lang: Lang }) {
  const { t } = useI18n();
  const { data: poisData } = useQuery({ queryKey: ['pois', lang, 1, 6], queryFn: () => poisApi.getAll(1, 6, lang) });
  const { data: tours } = useQuery({ queryKey: ['tours', lang], queryFn: () => toursApi.getAll(lang) });
  const heroPoi = poisData?.items.find((poi) => poi.imageUrl) ?? poisData?.items[0];
  return <div>
    <section className="relative overflow-hidden border-b border-gray-800">{heroPoi?.imageUrl ? <img src={heroPoi.imageUrl} alt={heroPoi.name} className="absolute inset-0 h-full w-full object-cover opacity-35" /> : null}<div className="absolute inset-0 bg-gray-950/75" />
      <div className="relative mx-auto flex min-h-[70vh] max-w-6xl items-center px-4 py-12"><div><p className="mb-3 text-sm font-medium text-emerald-300">VinhHy AudioTour</p><h1 className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">{t('heroTitle')}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">{t('heroText')}</p><div className="mt-7 flex flex-wrap gap-3"><Link to={ROUTES.POIS} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">{t('explorePlaces')}</Link><Link to={ROUTES.TOURS} className="rounded-xl border border-gray-700 bg-gray-900 px-5 py-3 text-sm font-semibold text-white">{t('exploreTours')}</Link><Link to={ROUTES.PACKAGES} className="rounded-xl border border-gray-700 bg-gray-900 px-5 py-3 text-sm font-semibold text-white">{t('packages')}</Link></div></div></div>
    </section>
    {poisData?.items.length ? <section className="mx-auto max-w-6xl px-4 py-12"><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-bold text-white">{t('featuredPlaces')}</h2><Link to={ROUTES.POIS} className="text-sm text-emerald-300">{t('viewAll')}</Link></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{poisData.items.map((poi) => <PoiCard key={poi.id} poi={poi} />)}</div></section> : null}
    {tours?.length ? <section className="border-y border-gray-800 bg-gray-900/50"><div className="mx-auto max-w-6xl px-4 py-12"><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-bold text-white">{t('featuredTours')}</h2><Link to={ROUTES.TOURS} className="text-sm text-emerald-300">{t('viewAll')}</Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{tours.slice(0, 3).map((tour) => <Link key={tour.id} to={ROUTES.TOUR_DETAIL.replace(':id', String(tour.id))} className="rounded-xl border border-gray-800 bg-gray-950 p-5 hover:border-emerald-500/60"><h3 className="text-lg font-semibold text-white">{tour.name}</h3>{tour.estimatedMinutes ? <p className="mt-2 text-sm text-gray-400">{tour.estimatedMinutes} {t('minutes')}</p> : null}{tour.description ? <p className="mt-3 line-clamp-2 text-sm text-gray-400">{tour.description}</p> : null}</Link>)}</div></div></section> : null}
  </div>;
}
