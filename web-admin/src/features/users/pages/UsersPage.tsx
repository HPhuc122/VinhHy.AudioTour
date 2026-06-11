import { useState } from 'react';
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '../hooks/useUsers';
import { UserFormModal } from '../components/UserFormModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { extractApiError } from '../../../api/apiError';
import type { UserDto } from '../types/user';

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDto | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<UserDto | undefined>();

  const { data, isLoading, isError } = useUsers(page);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(editTarget?.id ?? 0);
  const deleteUser = useDeleteUser();
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
    if (formData.email) payload.email = formData.email;
    if (formData.password) payload.password = formData.password;
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast('Đã xoá người dùng', 'success');
      setDeleteTarget(undefined);
    } catch (err) {
      toast(extractApiError(err), 'error');
    }
  };

  const roleVariant = (role: string): 'info' | 'warning' | 'danger' | 'default' => {
    if (role === 'SuperAdmin') return 'danger';
    if (role === 'ContentAdmin') return 'info';
    if (role === 'TourOperator') return 'warning';
    return 'default';
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý tài khoản và phân quyền hệ thống
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>+ Thêm người dùng</Button>
      </div>

      <div className="mt-6 rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Đang tải...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20 text-red-500 text-sm">
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
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{user.email}</td>
                    <td className="px-5 py-3">
                      <Badge variant={roleVariant(user.roleName)}>
                        {user.roleName}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-500 uppercase text-xs">
                      {user.preferredLanguage}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={user.isActive ? 'success' : 'default'}>
                        {user.isActive ? 'Hoạt động' : 'Vô hiệu'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditTarget(user)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteTarget(user)}
                        >
                          Xoá
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
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
                    ← Trước
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
                    Sau →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal */}
      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        loading={createUser.isPending}
      />

      {/* Edit modal */}
      <UserFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(undefined)}
        onSubmit={handleUpdate}
        loading={updateUser.isPending}
        editUser={editTarget}
      />

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        title="Xác nhận xoá người dùng"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(undefined)}
            >
              Huỷ
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteUser.isPending}
            >
              Xoá
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Bạn có chắc muốn xoá người dùng{' '}
          <span className="font-semibold text-gray-900">
            {deleteTarget?.username}
          </span>
          ? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
}
