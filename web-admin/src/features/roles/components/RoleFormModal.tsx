import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { RoleDto } from '../types/role';

const schema = z.object({
  name: z.string().min(2, 'Tên vai trò tối thiểu 2 ký tự'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  loading?: boolean;
  editRole?: RoleDto;
}

export function RoleFormModal({ open, onClose, onSubmit, loading, editRole }: Props) {
  const isEdit = !!editRole;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: editRole?.name ?? '', description: editRole?.description ?? '' },
  });

  useEffect(() => {
    if (open) {
      reset({ name: editRole?.name ?? '', description: editRole?.description ?? '' });
    }
  }, [open, editRole, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo vai trò'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Tên vai trò"
          placeholder="vd: Vendor"
          error={errors.name?.message}
          {...register('name')}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Mô tả</label>
          <textarea
            placeholder="Mô tả vai trò (tùy chọn)"
            rows={3}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('description')}
          />
        </div>
      </div>
    </Modal>
  );
}
