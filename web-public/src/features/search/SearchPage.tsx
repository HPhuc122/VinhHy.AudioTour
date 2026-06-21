import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { poisApi } from '../../api/poisApi';
import { PoiCard } from '../../components/ui/PoiCard';
import { Spinner } from '../../components/ui/Spinner';
import type { Lang } from '../../hooks/useLanguage';
import { useI18n } from '../../i18n/I18nContext';

export function SearchPage({ lang }: { lang: Lang }) {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('q') ?? '');
  const query = searchParams.get('q') ?? '';
  const { data, isLoading, isFetching } = useQuery({ queryKey: ['search', query, lang], queryFn: () => poisApi.search(query, lang), enabled: query.length >= 2 });
  useEffect(() => setInput(query), [query]);
  const handleSearch = (event: React.FormEvent) => { event.preventDefault(); if (input.trim().length >= 2) setSearchParams({ q: input.trim() }); };
  return <div className="mx-auto max-w-6xl px-4 py-12"><h1 className="mb-8 text-3xl font-bold text-white">{t('searchResults')}</h1><form onSubmit={handleSearch} className="mb-10 flex gap-3"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={t('searchPlaceholder')} className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-5 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none" autoFocus /><button type="submit" className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white">{t('search')}</button></form>{isLoading || isFetching ? <Spinner /> : query && !data?.length ? <div className="py-20 text-center text-gray-500">{t('noResults')}</div> : data?.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map((poi) => <PoiCard key={poi.id} poi={poi} />)}</div> : null}</div>;
}
