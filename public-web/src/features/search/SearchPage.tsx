import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { poisApi } from '../../api/poisApi';
import { PoiCard } from '../../components/ui/PoiCard';
import { Spinner } from '../../components/ui/Spinner';
import type { Lang } from '../../hooks/useLanguage';

interface Props { lang: Lang; }

export function SearchPage({ lang }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('q') ?? '');
  const q = searchParams.get('q') ?? '';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', q, lang],
    queryFn: () => poisApi.search(q, lang),
    enabled: q.length >= 2,
  });

  useEffect(() => {
    setInput(q);
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length >= 2) {
      setSearchParams({ q: input.trim() });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Tìm kiếm</h1>

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tìm kiếm địa điểm, tên quán..."
          className="flex-1 bg-gray-800 text-white rounded-xl px-5 py-3 border border-gray-700 focus:outline-none focus:border-emerald-500 text-sm"
          autoFocus
        />
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors"
        >
          Tìm
        </button>
      </form>

      {/* Results */}
      {!q ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">🔍</div>
          <p>Nhập từ khoá để tìm kiếm địa điểm</p>
        </div>
      ) : isLoading || isFetching ? (
        <Spinner />
      ) : !data?.length ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">😕</div>
          <p>Không tìm thấy kết quả cho "<span className="text-white">{q}</span>"</p>
        </div>
      ) : (
        <>
          <p className="text-gray-400 text-sm mb-6">
            Tìm thấy <span className="text-white font-medium">{data.length}</span> kết quả cho "<span className="text-white">{q}</span>"
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map((poi) => <PoiCard key={poi.id} poi={poi} />)}
          </div>
        </>
      )}
    </div>
  );
}
