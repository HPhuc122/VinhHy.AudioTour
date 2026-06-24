import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useRoles } from '../../roles/hooks/useRoles';
import { displayRoleName, getAssignableRoles } from '../../auth/roleAccess';
import type { UserDto } from '../types/user';

const createSchema = z.object({
  username: z.string().min(2, 'Tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  roleId: z.coerce.number().min(1, 'Chọn vai trò'),
  preferredLanguage: z.string().optional(),
});

const editSchema = z.object({
  roleId: z.coerce.number().min(1).optional(),
  preferredLanguage: z.string().optional(),
  isActive: z.boolean().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForm | EditForm) => void;
  loading?: boolean;
  editUser?: UserDto;
}

const LANGUAGES = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '日本語' },
  { value: 'fr', label: 'Français' },
];

export function UserFormModal({ open, onClose, onSubmit, loading, editUser }: Props) {
  const isEdit = !!editUser;
  const { data: roles = [] } = useRoles();

  const form = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
    defaultValues: isEdit
      ? {
          roleId: editUser?.roleId,
          preferredLanguage: editUser?.preferredLanguage ?? 'vi',
          isActive: editUser?.isActive ?? true,
        }
      : { preferredLanguage: 'vi' },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        isEdit
          ? {
              roleId: editUser?.roleId,
              preferredLanguage: editUser?.preferredLanguage ?? 'vi',
              isActive: editUser?.isActive ?? true,
            }
          : { preferredLanguage: 'vi' },
      );
    }
  }, [open, editUser, isEdit, form]);

  const roleOptions = getAssignableRoles(roles).map((r) => ({
    value: r.id,
    label: displayRoleName(r.name),
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit as any)}
            loading={loading}
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo người dùng'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!isEdit && (
          <Input
            label="Tên đăng nhập"
            placeholder="vd: admin_khanhhoi"
            error={(form.formState.errors as any).username?.message}
            {...form.register('username')}
          />
        )}

        {!isEdit && (
          <Input
            label="Email"
            type="email"
            placeholder="email@example.com"
            error={(form.formState.errors as any).email?.message}
            {...form.register('email')}
          />
        )}

        {!isEdit && (
          <Input
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            error={(form.formState.errors as any).password?.message}
            {...form.register('password')}
          />
        )}

        <Select
          label="Vai trò"
          options={roleOptions}
          placeholder="-- Chọn vai trò --"
          error={(form.formState.errors as any).roleId?.message}
          {...form.register('roleId')}
        />

        <Select
          label="Ngôn ngữ mặc định"
          options={LANGUAGES}
          {...form.register('preferredLanguage')}
        />

        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
              {...form.register('isActive')}
            />
            Tài khoản đang hoạt động
          </label>
        )}
      </div>
    </Modal>
  );
}
