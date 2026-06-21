import { Link } from 'react-router-dom';
import type { PublicPoiDto } from '../../types/api';
import { ROUTES } from '../../routes/routeConstants';
import { useI18n } from '../../i18n/I18nContext';

export function PoiCard({ poi }: { poi: PublicPoiDto }) {
  const { t } = useI18n();
  return (
    <Link to={ROUTES.POI_DETAIL.replace(':id', String(poi.id))} className="group block overflow-hidden rounded-xl border border-gray-700 bg-gray-800 transition-all hover:-translate-y-0.5 hover:border-emerald-500/50">
      <div className="relative h-44 overflow-hidden bg-gray-700">
        {poi.imageUrl ? <img src={poi.imageUrl} alt={poi.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-500">V</div>}
        {poi.category ? <span className="absolute left-2 top-2 rounded-full bg-gray-950/80 px-2 py-0.5 text-xs font-medium text-gray-200">{poi.category}</span> : null}
      </div>
      <div className="p-4"><h3 className="mb-1 line-clamp-1 text-sm font-semibold text-white group-hover:text-emerald-400">{poi.name}</h3><p className="line-clamp-2 text-xs leading-relaxed text-gray-400">{poi.shortDescription ?? poi.description}</p><div className="mt-3 text-xs text-emerald-500">{t('viewDetails')} →</div></div>
    </Link>
  );
}
