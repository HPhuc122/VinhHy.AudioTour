import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import PoiTable from '../components/PoiTable';
import PoiFormModal from '../components/PoiFormModal';

export function PoiPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | undefined>();

  const [draftSearch, setDraftSearch] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftIsActive, setDraftIsActive] = useState('');

  const [search, setSearch] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<string | undefined>(undefined);
  const [showDeleted, setShowDeleted] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý địa điểm tham quan</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý POI, thuyết minh và cấu hình geofence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }}>
            + Thêm mới
          </Button>
          <label className="flex cursor-pointer items-center gap-2 text-red-600">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-medium">Hiển thị POI đã xóa</span>
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Tìm theo mã POI"
          value={draftSearch}
          onChange={(e) => setDraftSearch(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <select
          value={draftCategory}
          onChange={(e) => setDraftCategory(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">Tất cả phân loại</option>
          <option value="landmark">Landmark</option>
          <option value="restaurant">Restaurant</option>
          <option value="museum">Museum</option>
        </select>
        <select
          value={draftIsActive}
          onChange={(e) => setDraftIsActive(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Tạm tắt</option>
        </select>

        <div className="ml-2 flex items-center gap-2">
          <Button
            onClick={() => {
              setSearch(draftSearch || undefined);
              setCategory(draftCategory || undefined);
              setIsActive(draftIsActive === '' ? undefined : draftIsActive);
            }}
          >
            Tìm kiếm
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDraftSearch('');
              setDraftCategory('');
              setDraftIsActive('');
              setSearch(undefined);
              setCategory(undefined);
              setIsActive(undefined);
              setShowDeleted(false);
            }}
          >
            Làm mới
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <PoiTable
          onEdit={(p) => { setEditTarget(p); setFormOpen(true); }}
          filters={{
            search: search || undefined,
            category: category || undefined,
            isActive: isActive === '' ? undefined : isActive,
            includeDeleted: showDeleted,
          }}
        />
      </div>

      <PoiFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => {
          console.log('submit poi', data);
          setFormOpen(false);
        }}
        loading={false}
        editPoi={editTarget}
      />
    </div>
  );
}

export default PoiPage;
