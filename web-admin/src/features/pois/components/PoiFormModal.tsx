import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { poisApi } from '../api/poisApi';
import { useToast } from '../../../components/ui/Toast';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import MapPickerOverlay from './MapPickerOverlay';

const createSchema = z.object({
  code: z.string().min(1, 'Mã địa điểm là bắt buộc'),
  imageFile: z.any().optional(),
  category: z.string().optional(),
  audioUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  latitude: z.coerce.number().refine((v) => !Number.isNaN(v), {
    message: 'Vĩ độ là bắt buộc',
  }),
  longitude: z.coerce.number().refine((v) => !Number.isNaN(v), {
    message: 'Kinh độ là bắt buộc',
  }),
  radiusMeters: z.coerce.number().optional(),
  priority: z.coerce.number().optional(),
  cooldownSeconds: z.coerce.number().optional(),
  minDwellSeconds: z.coerce.number().optional(),
});

const editSchema = createSchema.partial();

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForm | EditForm) => void;
  loading?: boolean;
  editPoi?: any;
}

const CATEGORY_OPTIONS = [
  { value: 'landmark', label: 'Điểm tham quan' },
  { value: 'restaurant', label: 'Nhà hàng' },
  { value: 'museum', label: 'Bảo tàng' },
];

const defaultValues = {
  isActive: true,
  radiusMeters: 30,
  priority: 1,
  cooldownSeconds: 300,
  minDwellSeconds: 5,
};

export function PoiFormModal({ open, onClose, loading, editPoi }: Props) {
  const isEdit = !!editPoi;
  const qc = useQueryClient();
  const toast = useToast();
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => poisApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => poisApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const form = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
    defaultValues: isEdit
      ? {
          code: editPoi?.code ?? '',
          imageFile: undefined,
          category: editPoi?.category ?? '',
          isActive: editPoi?.isActive ?? true,
          latitude: editPoi?.latitude,
          longitude: editPoi?.longitude,
          radiusMeters: editPoi?.radiusMeters ?? 30,
          priority: editPoi?.priority ?? 1,
          cooldownSeconds: editPoi?.cooldownSeconds ?? 300,
          minDwellSeconds: editPoi?.minDwellSeconds ?? 5,
        }
      : defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      isEdit
        ? {
            code: editPoi?.code ?? '',
            imageFile: undefined,
            category: editPoi?.category ?? '',
            isActive: editPoi?.isActive ?? true,
            latitude: editPoi?.latitude,
            longitude: editPoi?.longitude,
            radiusMeters: editPoi?.radiusMeters ?? 30,
            priority: editPoi?.priority ?? 1,
            cooldownSeconds: editPoi?.cooldownSeconds ?? 300,
            minDwellSeconds: editPoi?.minDwellSeconds ?? 5,
          }
        : defaultValues,
    );
    setPreview(null);
  }, [open, editPoi]);

  const handleSubmit = async (data: CreateForm | EditForm) => {
    try {
      const formData = new FormData();
      const d: any = data as any;
      formData.append('Code', d.code ?? '');
      formData.append('Category', d.category ?? '');
      formData.append('Latitude', d.latitude !== undefined && d.latitude !== null ? String(d.latitude) : '');
      formData.append('Longitude', d.longitude !== undefined && d.longitude !== null ? String(d.longitude) : '');
      formData.append('RadiusMeters', d.radiusMeters !== undefined && d.radiusMeters !== null ? String(d.radiusMeters) : '30');
      formData.append('Priority', d.priority !== undefined && d.priority !== null ? String(d.priority) : '1');
      formData.append('CooldownSeconds', d.cooldownSeconds !== undefined && d.cooldownSeconds !== null ? String(d.cooldownSeconds) : '300');
      formData.append('MinDwellSeconds', d.minDwellSeconds !== undefined && d.minDwellSeconds !== null ? String(d.minDwellSeconds) : '5');
      formData.append('IsActive', d.isActive ? 'true' : 'false');

      if (d.imageFile) {
        formData.append('Image', d.imageFile);
      }

      if (isEdit && editPoi?.id) {
        await updateMutation.mutateAsync({ id: editPoi.id, data: formData });
        toast('Cập nhật địa điểm thành công', 'success');
      } else {
        await createMutation.mutateAsync(formData);
        toast('Tạo địa điểm thành công', 'success');
      }

      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Lỗi khi lưu địa điểm';
      toast(msg, 'error');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm mới'}
      size="lg"
      scrollable
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading || isSaving}>
            Hủy
          </Button>
          <Button onClick={form.handleSubmit(handleSubmit as any)} loading={isSaving}>
            {isSaving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo địa điểm'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Mã địa điểm"
          error={(form.formState.errors as any).code?.message}
          {...form.register('code')}
          disabled={isEdit}
          className={isEdit ? 'cursor-not-allowed bg-gray-100' : undefined}
          required
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Ảnh địa điểm</label>
          <input
            type="file"
            accept="image/*"
            className="block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-lime-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-lime-900 hover:file:bg-lime-500"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                form.setValue('imageFile', f);
                setPreview(URL.createObjectURL(f));
              }
            }}
          />
          {preview ? <img src={preview} alt="Xem trước" className="mt-2 max-h-40 object-contain" /> : null}
        </div>

        <Select
          label="Phân loại"
          options={CATEGORY_OPTIONS}
          placeholder="-- Chọn phân loại --"
          {...form.register('category')}
        />

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
            {...form.register('isActive')}
          />
          Đang hoạt động
        </label>

        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              label="Vĩ độ"
              placeholder="Ví dụ: 12.345678"
              error={(form.formState.errors as any).latitude?.message}
              {...form.register('latitude')}
              required
            />
          </div>
          <div className="flex-1">
            <Input
              label="Kinh độ"
              placeholder="Ví dụ: 109.123456"
              error={(form.formState.errors as any).longitude?.message}
              {...form.register('longitude')}
              required
            />
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsMapPickerOpen(true)}
          className="mt-1 w-full"
        >
          Chọn trên bản đồ
        </Button>

        <MapPickerOverlay
          open={isMapPickerOpen}
          initialPosition={
            form.getValues('latitude') && form.getValues('longitude')
              ? { lat: Number(form.getValues('latitude')), lng: Number(form.getValues('longitude')) }
              : null
          }
          onClose={() => setIsMapPickerOpen(false)}
          onConfirm={(lat, lng) => {
            form.setValue('latitude', lat, { shouldValidate: true });
            form.setValue('longitude', lng, { shouldValidate: true });
            setIsMapPickerOpen(false);
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Bán kính (m)" type="number" {...form.register('radiusMeters')} />
          <Input label="Độ ưu tiên" type="number" {...form.register('priority')} />
          <Input label="Thời gian chờ (giây)" type="number" {...form.register('cooldownSeconds')} />
          <Input label="Thời gian dừng tối thiểu (giây)" type="number" {...form.register('minDwellSeconds')} />
        </div>
      </div>
    </Modal>
  );
}

export default PoiFormModal;
