import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { extractApiError } from '@/api/apiError';
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
  latitude: z.coerce
    .number()
    .refine((value) => Number.isFinite(value), {
      message: 'Vĩ độ là bắt buộc',
    })
    .min(-90, 'Vĩ độ phải từ -90 đến 90')
    .max(90, 'Vĩ độ phải từ -90 đến 90'),
  longitude: z.coerce
    .number()
    .refine((value) => Number.isFinite(value), {
      message: 'Kinh độ là bắt buộc',
    })
    .min(-180, 'Kinh độ phải từ -180 đến 180')
    .max(180, 'Kinh độ phải từ -180 đến 180'),
  radiusMeters: z.coerce.number().positive('Bán kính phải lớn hơn 0').optional(),
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

const vendorWizardSteps = [
  'Thông tin cơ bản',
  'Vị trí',
  'Hình ảnh đăng ký',
  'Xác nhận gửi duyệt',
];

export function PoiFormModal({ open, onClose, loading, editPoi, isVendorMode = false }: Props) {
  const isEdit = Boolean(editPoi);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [vendorStep, setVendorStep] = useState(0);

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
    setVendorStep(0);
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
      toast(extractApiError(err), 'error');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleVendorNext = async () => {
    if (vendorStep === 0) {
      const validName = await form.trigger(['name'] as any);
      const category = String(form.getValues('category') ?? '').trim();
      if (!category) {
        form.setError('category' as any, {
          type: 'manual',
          message: 'Vui lòng chọn danh mục.',
        });
        return;
      }
      if (!validName) return;
    }

    if (vendorStep === 1) {
      const validLocation = await form.trigger(['latitude', 'longitude'] as any);
      if (!validLocation) return;
    }

    setVendorStep((current) => Math.min(current + 1, vendorWizardSteps.length - 1));
  };

  if (isVendorMode) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Chỉnh sửa đăng ký sạp' : 'Đăng ký địa điểm/sạp'}
        size="xl"
        scrollable
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={loading || isSaving}>
              Hủy
            </Button>
            {vendorStep > 0 ? (
              <Button
                variant="secondary"
                onClick={() => setVendorStep((current) => Math.max(current - 1, 0))}
                disabled={loading || isSaving}
              >
                Quay lại
              </Button>
            ) : null}
            {vendorStep < vendorWizardSteps.length - 1 ? (
              <Button onClick={() => void handleVendorNext()} disabled={loading || isSaving}>
                Tiếp tục
              </Button>
            ) : (
              <Button onClick={form.handleSubmit(handleSubmit as any)} loading={isSaving}>
                {isSaving ? 'Đang gửi...' : isEdit ? 'Gửi lại hồ sơ' : 'Gửi duyệt'}
              </Button>
            )}
          </>
        }
      >
        <VendorPoiRegistrationWizard
          step={vendorStep}
          form={form}
          editPoi={editPoi}
          previews={previews}
          setPreviews={setPreviews}
          onOpenMap={() => setIsMapPickerOpen(true)}
        />

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
      </Modal>
    );
  }

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

function VendorPoiRegistrationWizard({
  step,
  form,
  editPoi,
  previews,
  setPreviews,
  onOpenMap,
}: {
  step: number;
  form: UseFormReturn<CreateForm | EditForm>;
  editPoi?: any;
  previews: string[];
  setPreviews: (previews: string[]) => void;
  onOpenMap: () => void;
}) {
  const values = form.watch() as any;
  const errors = form.formState.errors as any;

  return (
    <div className="space-y-5">
      <VendorWizardHeader step={step} />

      {editPoi ? (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
          <p className="font-semibold text-gray-900">Đang chỉnh sửa hồ sơ</p>
          <p className="mt-1 text-gray-600">Mã địa điểm: {editPoi.code ?? `#${editPoi.id}`}</p>
        </div>
      ) : null}

      {step === 0 ? (
        <div className="grid gap-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Điền thông tin khách sẽ nhìn thấy khi sạp được duyệt, thanh toán và kích hoạt.
          </div>

          <Input
            label="Tên sạp/địa điểm"
            placeholder="Ví dụ: Sạp hải sản Cô Ba"
            error={errors.name?.message}
            {...form.register('name')}
            required
          />

          <Select
            label="Danh mục"
            value={String(values.category ?? '')}
            error={errors.category?.message}
            options={CATEGORY_OPTIONS}
            placeholder="-- Chọn danh mục --"
            onChange={(event) => {
              form.setValue('category', event.target.value, { shouldValidate: true });
              form.clearErrors('category' as any);
            }}
          />

          <FormField
            label="Mô tả ngắn"
            htmlFor="vendor-poi-short-description"
            error={errors.shortDescription?.message}
          >
            <textarea
              id="vendor-poi-short-description"
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Một câu ngắn giúp khách hiểu sạp/địa điểm này có gì nổi bật."
              {...form.register('shortDescription')}
            />
          </FormField>

          <FormField
            label="Mô tả chi tiết"
            htmlFor="vendor-poi-description"
            error={errors.description?.message}
          >
            <textarea
              id="vendor-poi-description"
              rows={6}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Kể thêm về sản phẩm, câu chuyện, trải nghiệm hoặc thông tin khách nên biết."
              {...form.register('description')}
            />
          </FormField>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Chọn vị trí chính xác để khách có thể tìm sạp trên bản đồ và hệ thống nhận diện theo vùng gần đúng.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Vĩ độ"
              placeholder="Ví dụ: 12.345678"
              error={errors.latitude?.message}
              {...form.register('latitude')}
              required
            />
            <Input
              label="Kinh độ"
              placeholder="Ví dụ: 109.123456"
              error={errors.longitude?.message}
              {...form.register('longitude')}
              required
            />
          </div>

          <Button type="button" variant="secondary" onClick={onOpenMap} className="w-full sm:w-auto">
            Chọn vị trí trên bản đồ
          </Button>

          <div className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2">
            <RegistrationSummaryItem label="Bán kính nhận diện" value={`${values.radiusMeters ?? 30} m`} />
            <RegistrationSummaryItem
              label="Ghi chú"
              value="Thông số nhận diện do hệ thống quản lý, vendor không tự kích hoạt công khai."
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4">
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Ảnh tải lên trong bước này dùng cho hồ sơ đăng ký. Ảnh chỉ hiển thị công khai sau khi admin duyệt
            và sạp đủ điều kiện hoạt động.
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Hình ảnh đăng ký</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) {
                  form.setValue('imageFiles', files as any);
                  form.setValue('imageFile', files[0] as any);
                  setPreviews(files.map((file) => URL.createObjectURL(file)));
                }
              }}
            />
          </div>

          {previews.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {previews.map((previewUrl, index) => (
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt={`Xem trước ${index + 1}`}
                  className="h-28 w-full rounded-lg border object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Bạn có thể gửi hồ sơ trước và bổ sung ảnh sau trong Thư viện.
            </div>
          )}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
            Sau khi gửi, admin sẽ duyệt. Nếu được duyệt, bạn sẽ nhận yêu cầu thanh toán trước khi sạp hiển thị công khai.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <RegistrationSummaryItem label="Tên sạp/địa điểm" value={values.name || 'Chưa nhập'} />
            <RegistrationSummaryItem label="Danh mục" value={getCategoryLabel(values.category)} />
            <RegistrationSummaryItem label="Tọa độ" value={formatCoordinates(values.latitude, values.longitude)} />
            <RegistrationSummaryItem label="Ảnh đăng ký" value={`${previews.length} ảnh mới`} />
          </div>

          <div className="rounded-lg border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-900">Mô tả ngắn</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
              {values.shortDescription || 'Chưa nhập mô tả ngắn.'}
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-900">Mô tả chi tiết</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
              {values.description || 'Chưa nhập mô tả chi tiết.'}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VendorWizardHeader({ step }: { step: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {vendorWizardSteps.map((label, index) => {
        const done = index < step;
        const current = index === step;
        return (
          <div
            key={label}
            className={`rounded-lg border px-3 py-3 ${
              current
                ? 'border-blue-200 bg-blue-50'
                : done
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-100 bg-gray-50'
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? 'bg-green-600 text-white'
                  : current
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-400'
              }`}
            >
              {done ? '✓' : index + 1}
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

function RegistrationSummaryItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-gray-900">{value || '-'}</p>
    </div>
  );
}

function getCategoryLabel(value?: string | null): string {
  return CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? 'Chưa chọn';
}

function formatCoordinates(latitude?: number | string | null, longitude?: number | string | null): string {
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    return 'Chưa chọn';
  }

  return `${latitude}, ${longitude}`;
}

export default PoiFormModal;
