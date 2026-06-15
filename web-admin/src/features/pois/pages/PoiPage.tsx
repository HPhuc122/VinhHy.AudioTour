import { Button } from '../../../components/ui/Button';
import PoiTable from '../components/PoiTable';
import PoiFormModal from '../components/PoiFormModal';
import { useState } from 'react';

export function PoiPage() {
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<any | undefined>();

    // Draft states bound to inputs (Các ô nhập liệu)
    const [draftSearch, setDraftSearch] = useState('');
    const [draftCategory, setDraftCategory] = useState('');
    const [draftIsActive, setDraftIsActive] = useState(''); // '', 'true', 'false'

    // Applied filters used for queries (Dữ liệu gửi xuống API)
    const [search, setSearch] = useState<string | undefined>(undefined);
    const [category, setCategory] = useState<string | undefined>(undefined);
    const [isActive, setIsActive] = useState<string | undefined>(undefined);

    // SỬA Ở ĐÂY 1: Dùng state này trực tiếp cho ô Checkbox để "tick là ăn ngay"
    const [showDeleted, setShowDeleted] = useState(false);

    return (
        <div>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Địa điểm tham quan</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Quản lý POI, thuyết minh và cấu hình geofence</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }}>+ Thêm mới</Button>
                    <label className="flex items-center gap-2 text-red-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showDeleted} // SỬA Ở ĐÂY 2: Bỏ draft
                            onChange={(e) => setShowDeleted(e.target.checked)} // Cập nhật trực tiếp
                            className="text-red-600 focus:ring-red-500 w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="font-medium text-sm">Hiển thị POI đã xóa</span>
                    </label>
                </div>
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

                <div className="ml-2 flex items-center gap-2">
                    <Button onClick={() => {
                        // Apply drafts to active filters
                        setSearch(draftSearch || undefined);
                        setCategory(draftCategory || undefined);
                        setIsActive(draftIsActive === '' ? undefined : draftIsActive);
                    }}>
                        Tìm kiếm
                    </Button>
                    <Button variant="secondary" onClick={() => {
                        // Reset drafts and applied filters
                        setDraftSearch(''); setDraftCategory(''); setDraftIsActive('');
                        setSearch(undefined); setCategory(undefined); setIsActive(undefined);
                        setShowDeleted(false); // SỬA Ở ĐÂY 3: Tắt nút Checkbox khi làm mới
                    }}>
                        Làm mới
                    </Button>
                </div>
            </div>

            <div className="mt-6 rounded-xl bg-white shadow-sm border border-gray-100 p-6">
                <PoiTable
                    onEdit={(p) => { setEditTarget(p); setFormOpen(true); }}
                    // SỬA Ở ĐÂY 4: Đổi tên biến truyền đi thành 'includeDeleted' để khớp C# Backend
                    filters={{ search: search || undefined, category: category || undefined, isActive: isActive === '' ? undefined : isActive, includeDeleted: showDeleted }}
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