import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { poisApi } from '../api/poisApi';
import { usersApi } from '../../users/api/usersApi';
import { useToast } from '../../../components/ui/Toast';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import MapPickerOverlay from './MapPickerOverlay';

const createSchema = z.object({
  name: z.string().trim().min(1, 'Tên địa điểm là bắt buộc'),
  userId: z.coerce.number().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  imageFile: z.any().optional(),
  imageFiles: z.any().optional(),
  category: z.string().optional(),
  audioUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  latitude: z.coerce.number().refine((value) => !Number.isNaN(value), {
    message: 'Vĩ độ là bắt buộc',
  }),
  longitude: z.coerce.number().refine((value) => !Number.isNaN(value), {
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
  isVendorMode?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'landmark', label: 'Điểm tham quan' },
  { value: 'restaurant', label: 'Nhà hàng' },
  { value: 'museum', label: 'Bảo tàng' },
];

const defaultValues = {
  name: '',
  userId: 0,
  shortDescription: '',
  description: '',
  isActive: true,
  radiusMeters: 30,
  priority: 1,
  cooldownSeconds: 300,
  minDwellSeconds: 5,
};

export function PoiFormModal({ open, onClose, loading, editPoi, isVendorMode = false }: Props) {
  const isEdit = Boolean(editPoi);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const { data: usersData } = useQuery({
    queryKey: ['users', 'poi-owner-options'],
    queryFn: () => usersApi.getAll(1, 100),
    enabled: open && !isVendorMode,
  });

  const ownerOptions = [
    { value: 0, label: '-- Thuộc hệ thống (Admin) --' },
    ...(usersData?.items ?? []).map((user) => ({
      value: user.id,
      label: user.username || user.email,
    })),
  ];

  const createMutation = useMutation({
    mutationFn: (data: FormData) => poisApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pois'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => poisApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pois'] }),
  });

  const form = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
    defaultValues: isEdit
      ? {
          name: editPoi?.name ?? '',
          userId: editPoi?.userId ?? 0,
          shortDescription: editPoi?.shortDescription ?? '',
          description: editPoi?.description ?? '',
          imageFile: undefined,
          imageFiles: undefined,
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
            name: editPoi?.name ?? '',
            userId: editPoi?.userId ?? 0,
            shortDescription: editPoi?.shortDescription ?? '',
            description: editPoi?.description ?? '',
            imageFile: undefined,
            imageFiles: undefined,
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
    setPreviews([]);
  }, [open, editPoi]);

  const handleSubmit = async (data: CreateForm | EditForm) => {
    try {
      const formData = new FormData();
      const values = data as any;
      formData.append('Name', values.name ?? '');
      if (!isVendorMode && Number(values.userId) > 0) {
        formData.append('UserId', String(values.userId));
      }

      formData.append('ShortDescription', values.shortDescription ?? '');
      formData.append('Description', values.description ?? '');
      formData.append('Category', values.category ?? '');
      formData.append(
        'Latitude',
        values.latitude !== undefined && values.latitude !== null ? String(values.latitude) : '',
      );
      formData.append(
        'Longitude',
        values.longitude !== undefined && values.longitude !== null ? String(values.longitude) : '',
      );
      formData.append(
        'RadiusMeters',
        values.radiusMeters !== undefined && values.radiusMeters !== null
          ? String(values.radiusMeters)
          : '30',
      );
      formData.append(
        'Priority',
        values.priority !== undefined && values.priority !== null ? String(values.priority) : '1',
      );
      formData.append(
        'CooldownSeconds',
        values.cooldownSeconds !== undefined && values.cooldownSeconds !== null
          ? String(values.cooldownSeconds)
          : '300',
      );
      formData.append(
        'MinDwellSeconds',
        values.minDwellSeconds !== undefined && values.minDwellSeconds !== null
          ? String(values.minDwellSeconds)
          : '5',
      );
      formData.append('IsActive', isVendorMode ? 'false' : values.isActive ? 'true' : 'false');

      const imageFiles = Array.isArray(values.imageFiles) ? values.imageFiles : [];
      if (imageFiles.length > 0) {
        imageFiles.forEach((file: File) => formData.append('Images', file));
      } else if (values.imageFile) {
        formData.append('Image', values.imageFile);
      }

      if (isEdit && editPoi?.id) {
        await updateMutation.mutateAsync({ id: editPoi.id, data: formData });
        toast(
          isVendorMode ? 'Đã cập nhật đăng ký và chuyển về trạng thái chờ duyệt' : 'Cập nhật địa điểm thành công',
          'success',
        );
      } else {
        formData.append('ApprovalStatus', isVendorMode ? '0' : '1');
        await createMutation.mutateAsync(formData);
        toast(isVendorMode ? 'Đã gửi đăng ký địa điểm sạp chờ duyệt' : 'Tạo địa điểm thành công', 'success');
      }

      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Lỗi khi lưu địa điểm';
      toast(message, 'error');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isVendorMode ? (isEdit ? 'Chỉnh sửa đăng ký sạp' : 'Đăng ký địa điểm sạp') : isEdit ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm mới'}
      size="lg"
      scrollable
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading || isSaving}>
            Hủy
          </Button>
          <Button onClick={form.handleSubmit(handleSubmit as any)} loading={isSaving}>
            {isSaving ? 'Đang lưu...' : isVendorMode ? 'Gửi đăng ký' : isEdit ? 'Lưu thay đổi' : 'Tạo địa điểm'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {isEdit ? <Input label="Mã địa điểm" value={editPoi?.code ?? ''} disabled /> : null}

        <Input
          label="Tên địa điểm"
          placeholder="Nhập tên địa điểm"
          error={(form.formState.errors as any).name?.message}
          {...form.register('name')}
          required
        />

        {!isVendorMode ? (
          <Select
            label="Chủ sở hữu (Tùy chọn)"
            options={ownerOptions}
            {...form.register('userId')}
          />
        ) : null}

        <FormField
          label="Mô tả ngắn"
          htmlFor="poi-short-description"
          error={(form.formState.errors as any).shortDescription?.message}
        >
          <textarea
            id="poi-short-description"
            rows={2}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mô tả ngắn"
            {...form.register('shortDescription')}
          />
        </FormField>

        <FormField
          label="Mô tả chi tiết"
          htmlFor="poi-description"
          error={(form.formState.errors as any).description?.message}
        >
          <textarea
            id="poi-description"
            rows={4}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mô tả chi tiết"
            {...form.register('description')}
          />
        </FormField>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Ảnh địa điểm</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-lime-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-lime-900 hover:file:bg-lime-500"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) {
                form.setValue('imageFiles', files);
                form.setValue('imageFile', files[0]);
                setPreviews(files.map((file) => URL.createObjectURL(file)));
              }
            }}
          />
          {previews.length > 0 ? (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {previews.map((previewUrl, index) => (
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt={`Xem trước ${index + 1}`}
                  className="h-24 w-full rounded-md border object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>

        <Select
          label="Phân loại"
          options={CATEGORY_OPTIONS}
          placeholder="-- Chọn phân loại --"
          {...form.register('category')}
        />

        {!isVendorMode ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
              {...form.register('isActive')}
            />
            Đang hoạt động
          </label>
        ) : null}

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
          <Input
            label="Bán kính (m)"
            type="number"
            disabled={isVendorMode}
            {...form.register('radiusMeters')}
          />
          <Input
            label="Độ ưu tiên"
            type="number"
            disabled={isVendorMode}
            {...form.register('priority')}
          />
          <Input
            label="Thời gian chờ (giây)"
            type="number"
            disabled={isVendorMode}
            {...form.register('cooldownSeconds')}
          />
          <Input
            label="Thời gian dừng tối thiểu (giây)"
            type="number"
            disabled={isVendorMode}
            {...form.register('minDwellSeconds')}
          />
        </div>
      </div>
    </Modal>
  );
}

export default PoiFormModal;
