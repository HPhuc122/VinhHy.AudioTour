import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { poisApi } from '../../api/poisApi';
import { PoiCard } from '../../components/ui/PoiCard';
import { Spinner } from '../../components/ui/Spinner';
import type { Lang } from '../../hooks/useLanguage';

interface Props { lang: Lang; }

const CATEGORIES = ['Tất cả', 'Ẩm thực', 'Di tích', 'Phong cảnh', 'Mua sắm'];

export function PoisPage({ lang }: Props) {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('Tất cả');
  const PAGE_SIZE = 9;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pois', lang, page, PAGE_SIZE],
    queryFn: () => poisApi.getAll(page, PAGE_SIZE, lang),
  });

  const filtered = category === 'Tất cả'
    ? data?.items ?? []
    : (data?.items ?? []).filter(p => p.category?.toLowerCase() === category.toLowerCase());

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Địa điểm</h1>
        <p className="text-gray-400">Khám phá tất cả địa điểm tại phố ẩm thực Vĩnh Hy</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <div className="text-center py-20 text-gray-500">Không thể tải danh sách địa điểm</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Không có địa điểm nào</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((poi) => <PoiCard key={poi.id} poi={poi} />)}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >
                ← Trước
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm transition-colors ${
                    p === page ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
