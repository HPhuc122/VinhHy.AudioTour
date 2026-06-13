import { useState } from 'react';
import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from '../hooks/useRoles';
import { RoleFormModal } from '../components/RoleFormModal';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { extractApiError } from '../../../api/apiError';
import type { RoleDto } from '../types/role';

const SYSTEM_ROLES = ['SuperAdmin', 'ContentAdmin', 'TourOperator', 'AnalyticsViewer', 'Guest'];

export function RolesPage() {
  const { data: roles = [], isLoading, isError } = useRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoleDto | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<RoleDto | undefined>();
  const [editId, setEditId] = useState(0);
  const updateRole = useUpdateRole(editId);
  const toast = useToast();

  const handleCreate = async (data: any) => {
    try {
      await createRole.mutateAsync(data);
      toast('Tạo vai trò thành công', 'success');
      setFormOpen(false);
    } catch (err) {
      toast(extractApiError(err), 'error');
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateRole.mutateAsync(data);
      toast('Cập nhật thành công', 'success');
      setEditTarget(undefined);
    } catch (err) {
      toast(extractApiError(err), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole.mutateAsync(deleteTarget.id);
      toast('Đã xoá vai trò', 'success');
      setDeleteTarget(undefined);
    } catch (err) {
      toast(extractApiError(err), 'error');
    }
  };

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-title">Phân quyền</h1>
          <p className="app-subtitle">Quản lý vai trò hệ thống</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>+ Thêm vai trò</Button>
      </div>

      <div className="app-table-shell">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[var(--app-text)] text-sm">Đang tải...</div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20 text-red-500 text-sm">Không thể tải danh sách vai trò</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="app-table-head text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Tên vai trò</th>
                <th className="px-5 py-3 text-left">Mô tả</th>
                <th className="px-5 py-3 text-left">Loại</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {roles.map((role) => {
                const isSystem = SYSTEM_ROLES.includes(role.name);
                return (
                  <tr key={role.id} className="hover:bg-[var(--app-surface-muted)] transition-colors">
                    <td className="px-5 py-3 text-[var(--app-text)] font-mono text-xs">{role.id}</td>
                    <td className="px-5 py-3 font-medium text-[var(--app-heading)]">{role.name}</td>
                    <td className="px-5 py-3 text-[var(--app-text)]">{role.description ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${isSystem ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]' : 'bg-[var(--app-surface-muted)] text-[var(--app-text)]'}`}>
                        {isSystem ? 'Hệ thống' : 'Tuỳ chỉnh'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setEditTarget(role); setEditId(role.id); }}
                        >
                          Sửa
                        </Button>
                        {!isSystem && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(role)}
                          >
                            Xoá
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <RoleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        loading={createRole.isPending}
      />

      <RoleFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(undefined)}
        onSubmit={handleUpdate}
        loading={updateRole.isPending}
        editRole={editTarget}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        title="Xác nhận xoá vai trò"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(undefined)}>Huỷ</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteRole.isPending}>Xoá</Button>
          </>
        }
      >
        <p className="text-sm text-[var(--app-text)]">
          Bạn có chắc muốn xoá vai trò{' '}
          <span className="font-semibold text-[var(--app-heading)]">{deleteTarget?.name}</span>?
          Người dùng đang dùng vai trò này có thể bị ảnh hưởng.
        </p>
      </Modal>
    </div>
  );
}
