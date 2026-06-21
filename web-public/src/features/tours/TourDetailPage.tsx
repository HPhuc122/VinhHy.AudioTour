import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { toursApi } from '../../api/toursApi';
import { Spinner } from '../../components/ui/Spinner';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';
import { useI18n } from '../../i18n/I18nContext';

export function TourDetailPage({ lang }: { lang: Lang }) {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { data: tour, isLoading, isError } = useQuery({ queryKey: ['tour', id, lang], queryFn: () => toursApi.getById(Number(id), lang), enabled: !!id });
  if (isLoading) return <Spinner />;
  if (isError || !tour) return <div className="py-32 text-center text-gray-500"><p>{t('notFoundTour')}</p><Link to={ROUTES.TOURS} className="mt-4 inline-block text-emerald-400">{t('backToTours')}</Link></div>;
  return <div className="mx-auto max-w-4xl px-4 py-12"><Link to={ROUTES.TOURS} className="mb-6 inline-flex text-sm text-emerald-400">← {t('backToTours')}</Link>
    <div className="mb-8 rounded-2xl border border-gray-700 bg-emerald-950/30 p-8"><h1 className="mb-3 text-3xl font-bold text-white">{tour.name}</h1><div className="flex flex-wrap gap-4 text-sm text-gray-300">{tour.estimatedMinutes ? <span>{tour.estimatedMinutes} {t('minutes')}</span> : null}<span>{tour.pois.length} {t('stops')}</span></div>{tour.description ? <p className="mt-4 leading-relaxed text-gray-300">{tour.description}</p> : null}</div>
    {tour.pois.length ? <div><h2 className="mb-6 text-xl font-bold text-white">{t('route')}</h2><div className="space-y-4">{tour.pois.map((poi, index) => <div key={poi.id} className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">{index + 1}</div><Link to={ROUTES.POI_DETAIL.replace(':id', String(poi.id))} className="flex-1 rounded-xl border border-gray-700 bg-gray-800 p-4 hover:border-emerald-500/50"><h3 className="font-semibold text-white">{poi.name}</h3>{poi.shortDescription ? <p className="mt-1 line-clamp-2 text-xs text-gray-400">{poi.shortDescription}</p> : null}</Link></div>)}</div><div className="mt-8 grid gap-3 sm:grid-cols-2"><Link to={ROUTES.TOUR_ROUTE.replace(':id', String(tour.id))} className="rounded-xl bg-emerald-600 py-3 text-center font-medium text-white">{t('startTour')}</Link><Link to={`${ROUTES.MAP}?tour=${tour.id}`} className="rounded-xl border border-gray-700 bg-gray-800 py-3 text-center font-medium text-white">{t('viewMap')}</Link></div></div> : null}
  </div>;
}
