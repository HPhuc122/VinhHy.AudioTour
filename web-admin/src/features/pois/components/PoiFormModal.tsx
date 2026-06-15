import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { poisApi } from '../api/poisApi';
import { useToast } from '../../../components/ui/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import MapPickerOverlay from './MapPickerOverlay';

const createSchema = z.object({
  // Part 1: POIs table fields (general info)
  code: z.string().min(1, 'Mã địa điểm là bắt buộc'),
  // image will be uploaded as file
  imageFile: z.any().optional(),
  category: z.string().optional(),
  audioUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  latitude: z.coerce.number().refine((v) => !Number.isNaN(v), { message: 'Latitude là bắt buộc' }),
  longitude: z.coerce.number().refine((v) => !Number.isNaN(v), { message: 'Longitude là bắt buộc' }),

  // Technical specs (POIs table columns)
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
  { value: 'landmark', label: 'Landmark' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'museum', label: 'Museum' },
];

export function PoiFormModal({ open, onClose, loading, editPoi }: Props) {
  const isEdit = !!editPoi;
  const qc = useQueryClient();
  const toast = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => poisApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => poisApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pois'] }),
  });
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
    defaultValues: isEdit
      ? {
          code: editPoi?.code ?? '',
  // preview from existing image url when editing
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
      : { isActive: true, radiusMeters: 30, priority: 1, cooldownSeconds: 300, minDwellSeconds: 5 },
  });

  useEffect(() => {
    if (open) {
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
          : { isActive: true, radiusMeters: 30, priority: 1, cooldownSeconds: 300, minDwellSeconds: 5 },
      );
    }
  }, [open, editPoi]);

  const handleSubmit = async (data: CreateForm | EditForm) => {
    try {
      // Build FormData for multipart upload matching C# API field names
      const formData = new FormData();
      const d: any = data as any;
      formData.append('Code', d.code ?? '');
      formData.append('Category', d.category ?? '');

      // Numbers and booleans must be strings in FormData
      formData.append('Latitude', d.latitude !== undefined && d.latitude !== null ? String(d.latitude) : '');
      formData.append('Longitude', d.longitude !== undefined && d.longitude !== null ? String(d.longitude) : '');
      formData.append('RadiusMeters', d.radiusMeters !== undefined && d.radiusMeters !== null ? String(d.radiusMeters) : '30');
      formData.append('Priority', d.priority !== undefined && d.priority !== null ? String(d.priority) : '1');
      formData.append('CooldownSeconds', d.cooldownSeconds !== undefined && d.cooldownSeconds !== null ? String(d.cooldownSeconds) : '300');
      formData.append('MinDwellSeconds', d.minDwellSeconds !== undefined && d.minDwellSeconds !== null ? String(d.minDwellSeconds) : '5');
      formData.append('IsActive', d.isActive ? 'true' : 'false');

      // Image file (use File object stored in form state)
      const imageFile = d.imageFile ?? null;
      if (imageFile) {
        formData.append('Image', imageFile);
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm mới'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Huỷ
          </Button>
          <Button onClick={form.handleSubmit(handleSubmit as any)} loading={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo địa điểm'}
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
          className={isEdit ? 'bg-gray-100 cursor-not-allowed' : undefined}
          required
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Ảnh địa điểm</label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-lime-400 file:text-lime-900 hover:file:bg-lime-500 cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                form.setValue('imageFile', f);
                const url = URL.createObjectURL(f);
                setPreview(url);
              }
            }}
          />
          {preview && <img src={preview} alt="preview" className="mt-2 max-h-40 object-contain" />}
        </div>

        <Select
          label="Phân loại"
          options={CATEGORY_OPTIONS}
          placeholder="-- Chọn phân loại --"
          {...form.register('category')}
        />

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
            {...form.register('isActive')}
          />
          Đang hoạt động
        </label>

        {/* Latitude & Longitude area — inputs row and map picker button below */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              label="Latitude"
              placeholder="Vd: 12.345678"
              error={(form.formState.errors as any).latitude?.message}
              {...form.register('latitude')}
              required
            />
          </div>
          <div className="flex-1">
            <Input
              label="Longitude"
              placeholder="Vd: 109.123456"
              error={(form.formState.errors as any).longitude?.message}
              {...form.register('longitude')}
              required
            />
          </div>
        </div>

        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsMapPickerOpen(true)}
            className="w-full mt-3"
          >
            🗺️ Chọn trên bản đồ
          </Button>
        </div>

        <MapPickerOverlay
          open={isMapPickerOpen}
          initialPosition={
            form.getValues('latitude') && form.getValues('longitude')
              ? { lat: Number(form.getValues('latitude')), lng: Number(form.getValues('longitude')) }
              : null
          }
          onClose={() => setIsMapPickerOpen(false)}
          onConfirm={(lat, lng) => {
            // set form values only when user confirms selection
            form.setValue('latitude', lat, { shouldValidate: true });
            form.setValue('longitude', lng, { shouldValidate: true });
            setIsMapPickerOpen(false);
          }}
        />
        {/* Technical specs grid */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="RadiusMeters"
            type="number"
            {...form.register('radiusMeters')}
          />
          <Input
            label="Priority"
            type="number"
            {...form.register('priority')}
          />
          <Input
            label="CooldownSeconds"
            type="number"
            {...form.register('cooldownSeconds')}
          />
          <Input
            label="MinDwellSeconds"
            type="number"
            {...form.register('minDwellSeconds')}
          />
        </div>
      </div>
    </Modal>
  );
}

export default PoiFormModal;
