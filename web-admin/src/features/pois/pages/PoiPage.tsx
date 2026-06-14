import { Button } from '../../../components/ui/Button';
import PoiTable from '../components/PoiTable';
import PoiFormModal from '../components/PoiFormModal';
import { useState } from 'react';

// Filters
import usePois from '../hooks/usePois';


export function PoiPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | undefined>();

  // Draft states bound to inputs
  const [draftSearch, setDraftSearch] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftIsActive, setDraftIsActive] = useState(''); // '', 'true', 'false'
  const [draftShowDeleted, setDraftShowDeleted] = useState(false);

  // Applied filters used for queries
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<string | undefined>(undefined);
  const [showDeleted, setShowDeleted] = useState(false);

  const poisQuery = usePois({ search: search ?? undefined, category: category ?? undefined, isActive: isActive === undefined ? undefined : isActive, includeDeleted: showDeleted });
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Địa điểm tham quan</h1>
          <p className="mt-0.5 text-sm text-gray-500">Quản lý POI, thuyết minh và cấu hình geofence</p>
        </div>
        <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }}>+ Thêm mới</Button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input type="text" placeholder="Tìm theo mã POI" value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">Tất cả phân loại</option>
          <option value="landmark">Landmark</option>
          <option value="restaurant">Restaurant</option>
          <option value="museum">Museum</option>
        </select>
        <select value={draftIsActive} onChange={(e) => setDraftIsActive(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Vô hiệu</option>
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draftShowDeleted} onChange={(e) => setDraftShowDeleted(e.target.checked)} />
          Hiển thị POI đã xóa
        </label>

        <div className="ml-2 flex items-center gap-2">
          <Button onClick={() => {
            // Apply drafts to active filters
            setSearch(draftSearch || undefined);
            setCategory(draftCategory || undefined);
            setIsActive(draftIsActive === '' ? undefined : draftIsActive);
            setShowDeleted(draftShowDeleted);
          }}>
            Tìm kiếm
          </Button>
          <Button variant="secondary" onClick={() => {
            // Reset drafts and applied filters
            setDraftSearch(''); setDraftCategory(''); setDraftIsActive(''); setDraftShowDeleted(false);
            setSearch(undefined); setCategory(undefined); setIsActive(undefined); setShowDeleted(false);
          }}>
            Làm mới
          </Button>
        </div>
      </div>
          <div className="mt-6 rounded-xl bg-white shadow-sm border border-gray-100 p-6">
              <PoiTable
                  onEdit={(p) => { setEditTarget(p); setFormOpen(true); }}
                  // SỬA Ở DÒNG DƯỚI NÀY: Đổi chữ searchCode (thứ 2) thành search
                  filters={{ searchCode: search || undefined, category: category || undefined, isActive: isActive === '' ? undefined : isActive, showDeleted }}
              />
          </div>

      <PoiFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => {
          // TODO: wire create/update API calls (use mutations)
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