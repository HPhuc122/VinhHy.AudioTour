import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { routes } from '@/config/routes';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROLE_VENDOR } from '@/features/auth/roleAccess';
import { Button } from '../../../components/ui/Button';
import PoiTable from '../components/PoiTable';
import PoiFormModal from '../components/PoiFormModal';

export function PoiPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isVendorMode = user?.role === ROLE_VENDOR || location.pathname === routes.registerPoi;
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | undefined>();

  const [draftSearch, setDraftSearch] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftIsActive, setDraftIsActive] = useState('');
  const [draftApprovalStatus, setDraftApprovalStatus] = useState('');
  const [draftLifecycleStatus, setDraftLifecycleStatus] = useState('');

  const [search, setSearch] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<string | undefined>(undefined);
  const [approvalStatus, setApprovalStatus] = useState<string | undefined>(undefined);
  const [lifecycleStatus, setLifecycleStatus] = useState<string | undefined>(undefined);
  const [showDeleted, setShowDeleted] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isVendorMode ? 'Đăng ký địa điểm sạp' : 'Quản lý địa điểm tham quan'}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isVendorMode
              ? 'Gửi thông tin POI để chờ quản trị viên duyệt và yêu cầu thanh toán.'
              : 'Quản lý POI, thuyết minh và cấu hình geofence.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }}>
            {isVendorMode ? '+ Đăng ký sạp' : '+ Thêm mới'}
          </Button>
          {!isVendorMode ? (
            <label className="flex cursor-pointer items-center gap-2 text-red-600">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium">Hiển thị POI đã xóa</span>
            </label>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Tìm theo mã hoặc tên POI"
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
        <select
          value={draftApprovalStatus}
          onChange={(e) => setDraftApprovalStatus(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">Tất cả duyệt cũ</option>
          <option value="0">Chờ duyệt</option>
          <option value="1">Đã duyệt</option>
          <option value="2">Từ chối</option>
        </select>
        <select
          value={draftLifecycleStatus}
          onChange={(e) => setDraftLifecycleStatus(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">Tất cả vòng đời</option>
          <option value="0">Chờ duyệt</option>
          <option value="1">Đã duyệt</option>
          <option value="2">Chờ thanh toán</option>
          <option value="3">Đang hoạt động</option>
          <option value="4">Hết hạn</option>
          <option value="5">Từ chối</option>
        </select>

        <div className="ml-2 flex items-center gap-2">
          <Button
            onClick={() => {
              setSearch(draftSearch || undefined);
              setCategory(draftCategory || undefined);
              setIsActive(draftIsActive === '' ? undefined : draftIsActive);
              setApprovalStatus(draftApprovalStatus === '' ? undefined : draftApprovalStatus);
              setLifecycleStatus(draftLifecycleStatus === '' ? undefined : draftLifecycleStatus);
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
              setDraftApprovalStatus('');
              setDraftLifecycleStatus('');
              setSearch(undefined);
              setCategory(undefined);
              setIsActive(undefined);
              setApprovalStatus(undefined);
              setLifecycleStatus(undefined);
              setShowDeleted(false);
            }}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {isVendorMode ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sau khi admin yêu cầu thanh toán, mỗi sạp sẽ có nút Thanh toán MoMo mô phỏng riêng để kích hoạt.
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <PoiTable
          onEdit={(p) => { setEditTarget(p); setFormOpen(true); }}
          isVendorMode={isVendorMode}
          filters={{
            search: search || undefined,
            category: category || undefined,
            isActive: isActive === '' ? undefined : isActive,
            approvalStatus: approvalStatus === '' ? undefined : approvalStatus,
            lifecycleStatus: lifecycleStatus === '' ? undefined : lifecycleStatus,
            includeDeleted: isVendorMode ? false : showDeleted,
          }}
        />
      </div>

      <PoiFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={() => setFormOpen(false)}
        loading={false}
        editPoi={editTarget}
        isVendorMode={isVendorMode}
      />
    </div>
  );
}

export default PoiPage;
