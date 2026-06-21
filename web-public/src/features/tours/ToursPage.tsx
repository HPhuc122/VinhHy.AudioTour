import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toursApi } from '../../api/toursApi';
import { Spinner } from '../../components/ui/Spinner';
import { ROUTES } from '../../routes/routeConstants';
import type { Lang } from '../../hooks/useLanguage';
import { useI18n } from '../../i18n/I18nContext';

interface Props { lang: Lang; }
export function ToursPage({ lang }: Props) {
  const { t } = useI18n();
  const { data: tours, isLoading, isError } = useQuery({ queryKey: ['tours', lang], queryFn: () => toursApi.getAll(lang) });
  return <div className="mx-auto max-w-6xl px-4 py-12"><div className="mb-10"><h1 className="mb-2 text-3xl font-bold text-white">{t('toursTitle')}</h1><p className="text-gray-400">{t('toursSubtitle')}</p></div>
    {isLoading ? <Spinner /> : isError || !tours?.length ? <div className="py-20 text-center text-gray-500">{t('noResults')}</div> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{tours.map((tour) => <Link key={tour.id} to={ROUTES.TOUR_DETAIL.replace(':id', String(tour.id))} className="group overflow-hidden rounded-xl border border-gray-700 bg-gray-800 hover:border-emerald-500/50"><div className="flex h-32 items-center justify-center bg-emerald-950/40 text-3xl font-bold text-emerald-400">{tour.code}</div><div className="p-5"><h3 className="mb-2 text-lg font-bold text-white group-hover:text-emerald-400">{tour.name}</h3>{tour.estimatedMinutes ? <p className="mb-3 text-xs text-gray-400">~{tour.estimatedMinutes} {t('minutes')}</p> : null}{tour.description ? <p className="line-clamp-3 text-sm text-gray-400">{tour.description}</p> : null}<div className="mt-4 text-sm text-emerald-500">{t('viewDetails')} →</div></div></Link>)}</div>}
  </div>;
}
