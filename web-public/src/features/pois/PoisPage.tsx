import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { poisApi } from '../../api/poisApi';
import { PoiCard } from '../../components/ui/PoiCard';
import { Spinner } from '../../components/ui/Spinner';
import type { Lang } from '../../hooks/useLanguage';
import { useI18n } from '../../i18n/I18nContext';

interface Props { lang: Lang; }
const categories = [
  { value: '', labels: { vi: 'Tất cả', en: 'All', zh: '全部', ko: '전체', ja: 'すべて', fr: 'Tous' } },
  { value: 'restaurant', labels: { vi: 'Ẩm thực', en: 'Food', zh: '美食', ko: '음식', ja: 'グルメ', fr: 'Gastronomie' } },
  { value: 'landmark', labels: { vi: 'Tham quan', en: 'Landmarks', zh: '景观', ko: '명소', ja: '名所', fr: 'Sites' } },
  { value: 'museum', labels: { vi: 'Văn hóa', en: 'Culture', zh: '文化', ko: '문화', ja: '文化', fr: 'Culture' } },
] as const;

export function PoisPage({ lang }: Props) {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const { t } = useI18n();
  const pageSize = 9;
  const { data, isLoading, isError } = useQuery({ queryKey: ['pois', lang, page, pageSize, category], queryFn: () => poisApi.getAll(page, pageSize, lang, category || undefined) });
  const items = data?.items ?? [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10"><h1 className="mb-2 text-3xl font-bold text-white">{t('placesTitle')}</h1><p className="text-gray-400">{t('placesSubtitle')}</p></div>
      <div className="mb-8 flex flex-wrap gap-2">{categories.map((item) => <button key={item.value} onClick={() => { setCategory(item.value); setPage(1); }} className={`rounded-full px-4 py-1.5 text-sm font-medium ${category === item.value ? 'bg-emerald-600 text-white' : 'border border-gray-700 bg-gray-800 text-gray-400'}`}>{item.labels[lang]}</button>)}</div>
      {isLoading ? <Spinner /> : isError || items.length === 0 ? <div className="py-20 text-center text-gray-500">{t('noResults')}</div> : <>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((poi) => <PoiCard key={poi.id} poi={poi} />)}</div>
        {data && data.totalPages > 1 ? <div className="mt-10 flex justify-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg bg-gray-800 px-4 py-2 text-gray-300 disabled:opacity-40">←</button>{Array.from({ length: data.totalPages }, (_, index) => index + 1).map((value) => <button key={value} onClick={() => setPage(value)} className={`h-9 w-9 rounded-lg ${value === page ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'}`}>{value}</button>)}<button disabled={page >= data.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg bg-gray-800 px-4 py-2 text-gray-300 disabled:opacity-40">→</button></div> : null}
      </>}
    </div>
  );
}
