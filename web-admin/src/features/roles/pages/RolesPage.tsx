import { useState } from 'react';
import { useRoles, useUpdateRole } from '../hooks/useRoles';
import { RoleFormModal } from '../components/RoleFormModal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { extractApiError } from '../../../api/apiError';
import { displayRoleName, getCmsVisibleRoles, isSystemRole } from '../../auth/roleAccess';
import type { RoleDto } from '../types/role';

export function RolesPage() {
  const { data: roles = [], isLoading, isError } = useRoles();
  const [editTarget, setEditTarget] = useState<RoleDto | undefined>();
  const [editId, setEditId] = useState(0);
  const updateRole = useUpdateRole(editId);
  const toast = useToast();
  const visibleRoles = getCmsVisibleRoles(roles);

  const handleUpdate = async (data: any) => {
    try {
      await updateRole.mutateAsync(data);
      toast('Cập nhật vai trò thành công', 'success');
      setEditTarget(undefined);
    } catch (err) {
      toast(extractApiError(err), 'error');
    }
  };

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-title">Phân quyền</h1>
          <p className="app-subtitle">Chỉ hiển thị vai trò CMS hiện hành: Admin và Vendor.</p>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-600 text-sm">Đang tải...</div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20 text-red-500 text-sm">Không thể tải danh sách vai trò</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Tên vai trò</th>
                <th className="px-5 py-3 text-left">Mô tả</th>
                <th className="px-5 py-3 text-left">Loại</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                    Chưa có vai trò Admin hoặc Vendor.
                  </td>
                </tr>
              ) : (
                visibleRoles.map((role) => {
                  const isSystem = isSystemRole(role.name);
                  return (
                    <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-600 font-mono text-xs">{role.id}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {displayRoleName(role.name)}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{role.description ?? '-'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${isSystem ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {isSystem ? 'Hệ thống' : 'Tùy chỉnh'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setEditTarget(role); setEditId(role.id); }}
                        >
                          Sửa
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <RoleFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(undefined)}
        onSubmit={handleUpdate}
        loading={updateRole.isPending}
        editRole={editTarget}
      />
    </div>
  );
}
