import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { routes } from '@/config/routes';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROLE_VENDOR } from '@/features/auth/roleAccess';
import { Button } from '../../../components/ui/Button';
import PoiTable from '../components/PoiTable';
import PoiFormModal from '../components/PoiFormModal';

const lifecycleChips = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ duyệt', value: '0' },
  { label: 'Đã duyệt', value: '1' },
  { label: 'Chờ thanh toán', value: '2' },
  { label: 'Đang hoạt động', value: '3' },
  { label: 'Bị từ chối', value: '5' },
  { label: 'Hết hạn', value: '4' },
];

export function PoiPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isVendorMode = user?.role === ROLE_VENDOR || location.pathname === routes.registerPoi;
  const autoOpenedRegisterRef = useRef<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | undefined>();

  const [draftSearch, setDraftSearch] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftIsActive, setDraftIsActive] = useState('');
  const [draftLifecycleStatus, setDraftLifecycleStatus] = useState('');

  const [search, setSearch] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<string | undefined>(undefined);
  const [lifecycleStatus, setLifecycleStatus] = useState<string | undefined>(undefined);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const nextLifecycleStatus = queryParams.get('lifecycleStatus') ?? '';

    setDraftLifecycleStatus(nextLifecycleStatus);
    setLifecycleStatus(nextLifecycleStatus || undefined);
  }, [location.search]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (
      isVendorMode &&
      queryParams.get('view') === 'register' &&
      autoOpenedRegisterRef.current !== location.search
    ) {
      setEditTarget(undefined);
      setFormOpen(true);
      autoOpenedRegisterRef.current = location.search;
    }
  }, [isVendorMode, location.search]);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      isActive: isActive === '' ? undefined : isActive,
      lifecycleStatus: lifecycleStatus === '' ? undefined : lifecycleStatus,
      includeDeleted: isVendorMode ? false : showDeleted,
    }),
    [category, isActive, isVendorMode, lifecycleStatus, search, showDeleted],
  );

  const applyFilters = () => {
    setSearch(draftSearch || undefined);
    setCategory(draftCategory || undefined);
    setIsActive(draftIsActive === '' ? undefined : draftIsActive);
    setLifecycleStatus(draftLifecycleStatus === '' ? undefined : draftLifecycleStatus);
  };

  const resetFilters = () => {
    setDraftSearch('');
    setDraftCategory('');
    setDraftIsActive('');
    setDraftLifecycleStatus('');
    setSearch(undefined);
    setCategory(undefined);
    setIsActive(undefined);
    setLifecycleStatus(undefined);
    setShowDeleted(false);
  };

  const pageTitle = isVendorMode ? 'Sạp của tôi' : 'Quản lý POI & sạp';
  const pageDescription = isVendorMode
    ? 'Theo dõi đăng ký, trạng thái duyệt, thanh toán và nội dung cho địa điểm/sạp của bạn.'
    : 'Duyệt POI, quản lý thanh toán, nội dung, bản dịch và trạng thái hiển thị công khai.';

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">{pageDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }}>
            {isVendorMode ? 'Đăng ký địa điểm/sạp' : 'Thêm POI'}
          </Button>
          {!isVendorMode ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(event) => setShowDeleted(event.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              Hiển thị POI đã xóa
            </label>
          ) : null}
        </div>
      </div>

      {isVendorMode ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Trạng thái sạp sẽ đi theo các bước: gửi đăng ký, chờ duyệt, chờ yêu cầu thanh toán, chờ thanh toán, rồi hoạt động.
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {lifecycleChips.map((chip) => {
            const active = draftLifecycleStatus === chip.value;
            return (
              <button
                key={chip.value || 'all'}
                type="button"
                onClick={() => {
                  setDraftLifecycleStatus(chip.value);
                  setLifecycleStatus(chip.value || undefined);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên POI"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={draftCategory}
            onChange={(event) => setDraftCategory(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Tất cả danh mục</option>
            <option value="landmark">Điểm tham quan</option>
            <option value="restaurant">Nhà hàng</option>
            <option value="museum">Bảo tàng</option>
          </select>
          <select
            value={draftIsActive}
            onChange={(event) => setDraftIsActive(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Mọi hiển thị</option>
            <option value="true">Đang bật</option>
            <option value="false">Tạm tắt</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={applyFilters}>Tìm kiếm</Button>
            <Button variant="secondary" onClick={resetFilters}>Làm mới</Button>
          </div>
        </div>
      </div>

      <PoiTable
        onEdit={(poi) => { setEditTarget(poi); setFormOpen(true); }}
        isVendorMode={isVendorMode}
        filters={filters}
      />

      <PoiFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={() => setFormOpen(false)}
        loading={false}
        editPoi={editTarget}
        isVendorMode={isVendorMode}
      />
    </section>
  );
}

export default PoiPage;
