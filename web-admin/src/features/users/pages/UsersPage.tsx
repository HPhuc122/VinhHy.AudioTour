import { useState } from 'react';
import {
  useCreateUser,
  useUpdateUser,
  useUsers,
} from '../hooks/useUsers';
import { UserFormModal } from '../components/UserFormModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import { extractApiError } from '../../../api/apiError';
import { displayRoleName } from '../../auth/roleAccess';
import type { UserDto } from '../types/user';

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDto | undefined>();

  const { data, isLoading, isError } = useUsers(page);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(editTarget?.id ?? 0);
  const toast = useToast();

  const handleCreate = async (formData: any) => {
    try {
      await createUser.mutateAsync(formData);
      toast('Tạo người dùng thành công', 'success');
      setFormOpen(false);
    } catch (err) {
      toast(extractApiError(err), 'error');
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!editTarget) return;
    const payload: any = {};
    if (formData.roleId) payload.roleId = Number(formData.roleId);
    if (formData.preferredLanguage) payload.preferredLanguage = formData.preferredLanguage;
    if (formData.isActive !== undefined) payload.isActive = formData.isActive;
    try {
      await updateUser.mutateAsync(payload);
      toast('Cập nhật thành công', 'success');
      setEditTarget(undefined);
    } catch (err) {
      toast(extractApiError(err), 'error');
    }
  };

  const roleVariant = (role: string): 'info' | 'warning' | 'danger' | 'default' => {
    if (role === 'SuperAdmin') return 'danger';
    if (role === 'Admin') return 'danger';
    if (role === 'Vendor') return 'warning';
    if (role === 'ContentAdmin') return 'info';
    if (role === 'TourOperator') return 'warning';
    return 'default';
  };

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-title">Người dùng</h1>
          <p className="app-subtitle">Quản lý tài khoản và phân quyền hệ thống</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>+ Thêm người dùng</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-600">
            Đang tải...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20 text-sm text-red-500">
            Không thể tải danh sách người dùng
          </div>
        ) : (
          <>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 text-left">Tên đăng nhập</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Vai trò</th>
                  <th className="px-5 py-3 text-left">Ngôn ngữ</th>
                  <th className="px-5 py-3 text-left">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{user.username}</td>
                    <td className="px-5 py-3 text-gray-600">{user.email}</td>
                    <td className="px-5 py-3">
                      <Badge variant={roleVariant(user.roleName)}>
                        {displayRoleName(user.roleName)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs uppercase text-gray-600">
                      {user.preferredLanguage}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={user.isActive ? 'success' : 'default'}>
                        {user.isActive ? 'Hoạt động' : 'Tạm tắt'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditTarget(user)}>
                          Sửa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data && data.totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3 text-sm text-gray-600">
                <span>
                  Hiển thị {data.items.length} / {data.totalCount} người dùng
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <span className="px-2 py-1">
                    {page} / {data.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        loading={createUser.isPending}
      />

      <UserFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(undefined)}
        onSubmit={handleUpdate}
        loading={updateUser.isPending}
        editUser={editTarget}
      />

    </div>
  );
}
