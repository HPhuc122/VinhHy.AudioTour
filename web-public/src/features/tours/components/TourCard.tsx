import { Link } from 'react-router-dom';
import { selectTourTranslation, type PublicTourDto } from '@/features/tours/api/toursApi';

interface TourCardProps {
  tour: PublicTourDto;
}

export function TourCard({ tour }: TourCardProps) {
  const translation = selectTourTranslation(tour);
  const title = translation?.name ?? tour.code;
  const description = translation?.description ?? 'Route details are available on the tour page.';

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{tour.code}</p>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {tour.estimatedMinutes ?? '-'} minutes
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {tour.defaultLanguage.toUpperCase()}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {tour.pois.length} stops
            </span>
          </div>
        </div>
        <Link
          to={`/tours/${tour.id}`}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-sky-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-900"
        >
          View tour
        </Link>
      </div>
    </article>
  );
}
