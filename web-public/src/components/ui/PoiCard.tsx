import { Link } from 'react-router-dom';
import type { PublicPoiDto } from '../../types/api';
import { ROUTES } from '../../routes/routeConstants';

interface Props {
  poi: PublicPoiDto;
}

const CATEGORY_COLORS: Record<string, string> = {
  'ẩm thực': 'bg-orange-500/20 text-orange-300',
  'di tích': 'bg-purple-500/20 text-purple-300',
  'phong cảnh': 'bg-emerald-500/20 text-emerald-300',
  'mua sắm': 'bg-blue-500/20 text-blue-300',
};

export function PoiCard({ poi }: Props) {
  const catColor = poi.category ? (CATEGORY_COLORS[poi.category.toLowerCase()] ?? 'bg-gray-500/20 text-gray-300') : '';

  return (
    <Link
      to={ROUTES.POI_DETAIL.replace(':id', String(poi.id))}
      className="group block rounded-xl overflow-hidden bg-gray-800 border border-gray-700 hover:border-emerald-500/50 transition-all hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="h-44 bg-gray-700 overflow-hidden relative">
        {poi.imageUrl ? (
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">📍</div>
        )}
        {poi.category && (
          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>
            {poi.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1 group-hover:text-emerald-400 transition-colors">
          {poi.name}
        </h3>
        <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
          {poi.shortDescription ?? poi.description}
        </p>
        <div className="mt-3 flex items-center gap-1 text-xs text-emerald-500">
          <span>Xem chi tiết</span>
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}
