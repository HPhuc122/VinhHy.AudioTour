import { Button } from '../../../components/ui/Button';
import PoiTable from '../components/PoiTable';
import PoiFormModal from '../components/PoiFormModal';
import { useState } from 'react';


export function PoiPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | undefined>();
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Địa điểm tham quan</h1>
          <p className="mt-0.5 text-sm text-gray-500">Quản lý POI, thuyết minh và cấu hình geofence</p>
        </div>
        <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }}>+ Thêm mới</Button>
      </div>

      <div className="mt-6 rounded-xl bg-white shadow-sm border border-gray-100 p-6">
        <PoiTable onEdit={(p) => { setEditTarget(p); setFormOpen(true); }} />
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
