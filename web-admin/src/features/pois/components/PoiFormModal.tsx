import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { poisApi } from '../api/poisApi';
import { usersApi } from '../../users/api/usersApi';
import { languagesApi, type LanguageDto } from '../../languages/api/languagesApi';
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

const editSchema = createSchema.extend({
  reTranslateAdditionalLanguages: z.boolean().optional(),
}).partial();

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

const REQUIRED_LANGUAGE_CODE = 'en';
const REQUIRED_LANGUAGE_FALLBACK: LanguageDto = {
  code: 'en',
  name: 'English',
  nativeName: 'English',
  isActive: true,
  sortOrder: 2,
};
const BASE_TRANSLATION_PRICE = 200_000;
const EXTRA_LANGUAGE_PRICE = 100_000;

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
  reTranslateAdditionalLanguages: true,
};

export function PoiFormModal({ open, onClose, loading, editPoi, isVendorMode = false }: Props) {
  const isEdit = Boolean(editPoi);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLanguageCodes, setSelectedLanguageCodes] = useState<string[]>([REQUIRED_LANGUAGE_CODE]);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const { data: usersData } = useQuery({
    queryKey: ['users', 'poi-owner-options'],
    queryFn: () => usersApi.getAll(1, 100),
    enabled: open && !isVendorMode,
  });

  const { data: activeLanguages = [], isLoading: isLoadingLanguages } = useQuery({
    queryKey: ['languages', 'active', 'poi-create'],
    queryFn: languagesApi.getActive,
    enabled: open && !isEdit && isVendorMode,
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
          reTranslateAdditionalLanguages: true,
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
            reTranslateAdditionalLanguages: true,
          }
        : defaultValues,
    );
    setPreviews([]);
    setStep(1);
    setSelectedLanguageCodes([REQUIRED_LANGUAGE_CODE]);
  }, [open, editPoi]);

  const buildFormData = (data: CreateForm | EditForm) => {
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
    formData.append('IsActive', values.isActive ? 'true' : 'false');

    const imageFiles = Array.isArray(values.imageFiles) ? values.imageFiles : [];
    if (imageFiles.length > 0) {
      imageFiles.forEach((file: File) => formData.append('Images', file));
    } else if (values.imageFile) {
      formData.append('Image', values.imageFile);
    }

    if (!isEdit) {
      selectedLanguageCodes.forEach((languageCode, index) => {
        formData.append('SelectedLanguageCodes', languageCode);
        formData.append(`SelectedLanguageCodes[${index}]`, languageCode);
      });
      formData.append('SelectedLanguageCodesJson', JSON.stringify(selectedLanguageCodes));
      formData.append('ApprovalStatus', isVendorMode ? '0' : '1');
    } else {
      formData.append(
        'ReTranslateAdditionalLanguages',
        values.reTranslateAdditionalLanguages === false ? 'false' : 'true',
      );
    }

    return formData;
  };

  const savePoi = async (data: CreateForm | EditForm) => {
    const formData = buildFormData(data);

    if (isEdit && editPoi?.id) {
      await updateMutation.mutateAsync({ id: editPoi.id, data: formData });
      toast('Cập nhật địa điểm thành công', 'success');
    } else {
      await createMutation.mutateAsync(formData);
      toast('Tạo địa điểm thành công', 'success');
    }
  };

  const handleSubmit = async (data: CreateForm | EditForm) => {
    if (!isEdit) {
      setStep(2);
      return;
    }

    try {
      await savePoi(data);
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Lỗi khi lưu địa điểm';
      toast(message, 'error');
    }
  };

  const handleFinalSubmit = async () => {
    try {
      const values = form.getValues();
      await savePoi(values);
      form.reset(defaultValues);
      setPreviews([]);
      setStep(1);
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Lỗi khi lưu địa điểm';
      toast(message, 'error');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const poiName = form.watch('name');
  const selectableLanguages = getSelectablePoiLanguages(activeLanguages);
  const selectedExtraLanguageCodes = selectedLanguageCodes.filter((code) => code !== REQUIRED_LANGUAGE_CODE);
  const totalPaymentAmount = BASE_TRANSLATION_PRICE + (selectedExtraLanguageCodes.length * EXTRA_LANGUAGE_PRICE);

  const toggleLanguage = (languageCode: string) => {
    if (languageCode === REQUIRED_LANGUAGE_CODE) {
      return;
    }

    setSelectedLanguageCodes((current) =>
      current.includes(languageCode)
        ? current.filter((code) => code !== languageCode)
        : [...current, languageCode],
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa địa điểm' : step === 1 ? 'Thêm địa điểm mới' : 'Thanh toán đăng ký POI'}
      size="lg"
      scrollable
      footer={
        step === 2 && !isEdit ? (
          <>
            <Button variant="secondary" onClick={() => setStep(1)} disabled={isSaving}>
              Quay lại chỉnh sửa
            </Button>
            <Button onClick={() => void handleFinalSubmit()} loading={isSaving}>
              Xác nhận đã thanh toán & Lưu
            </Button>
          </>
        ) : (
          <>
            {!isEdit && isVendorMode ? (
              <div className="mr-auto text-sm">
                <span className="text-gray-500">Tổng thanh toán: </span>
                <span className="font-semibold text-gray-900">{formatCurrency(totalPaymentAmount)}</span>
              </div>
            ) : null}
            <Button variant="secondary" onClick={onClose} disabled={loading || isSaving}>
              Hủy
            </Button>
            <Button onClick={form.handleSubmit(handleSubmit as any)} loading={isSaving}>
              {isSaving
                ? isEdit && form.getValues('reTranslateAdditionalLanguages')
                  ? 'Đang lưu và cập nhật bản dịch...'
                  : 'Đang lưu...'
                : isEdit
                  ? 'Lưu thay đổi'
                  : 'Tiếp tục thanh toán'}
            </Button>
          </>
        )
      }
    >
      {step === 2 && !isEdit ? (
        <div className="space-y-5">
          <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Vui lòng hoàn tất chuyển khoản trước khi lưu POI vào hệ thống.
          </div>

          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-48 w-48 rounded-md border border-gray-200 bg-white p-3 shadow-sm"
                role="img"
                aria-label="QR Code thanh toán giả"
              >
                <div className="h-full w-full rounded bg-[repeating-linear-gradient(45deg,#111_0_6px,#fff_6px_12px),repeating-linear-gradient(-45deg,transparent_0_10px,#111_10px_14px)] bg-blend-multiply" />
              </div>
              <span className="text-xs text-gray-500">QR Code thanh toán mẫu</span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Số tiền cần thanh toán</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalPaymentAmount)}
                </p>
              </div>

              <div className="rounded-md border border-gray-200">
                <div className="grid grid-cols-[140px_1fr] border-b border-gray-100 px-4 py-3 text-sm">
                  <span className="text-gray-500">Ngân hàng</span>
                  <span className="font-medium text-gray-900">VinhHy Demo Bank</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] border-b border-gray-100 px-4 py-3 text-sm">
                  <span className="text-gray-500">Số tài khoản</span>
                  <span className="font-medium text-gray-900">123456789</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] px-4 py-3 text-sm">
                  <span className="text-gray-500">Nội dung</span>
                  <span className="font-medium text-gray-900">
                    POI {poiName?.trim() || 'DIA DIEM MOI'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Sau khi chuyển khoản, bấm xác nhận để gửi thông tin POI cho hệ thống.
              </p>
              {isSaving ? (
                <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                  Đang khởi tạo địa điểm và biên dịch đa ngôn ngữ...
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
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

        {!isEdit && isVendorMode ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Gói ngôn ngữ bản dịch</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Tiếng Việt là nội dung gốc. Tiếng Anh là mặc định; các ngôn ngữ khác là mua thêm.
                </p>
              </div>
              <div className="whitespace-nowrap rounded bg-white px-3 py-2 text-right text-sm shadow-sm">
                <div className="text-gray-500">Tổng tiền</div>
                <div className="font-semibold text-gray-900">{formatCurrency(totalPaymentAmount)}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {isLoadingLanguages ? (
                <div className="col-span-full text-sm text-gray-500">Đang tải ngôn ngữ...</div>
              ) : selectableLanguages.length === 0 ? (
                <div className="col-span-full text-sm text-red-600">
                  Chưa có ngôn ngữ đang hoạt động để chọn.
                </div>
              ) : (
                selectableLanguages.map((language) => {
                  const isRequired = language.code === REQUIRED_LANGUAGE_CODE;
                  const isSelected = selectedLanguageCodes.includes(language.code);
                  return (
                    <label
                      key={language.code}
                      className={`flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm ${
                        isRequired ? 'border-blue-200' : 'border-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isRequired}
                          onChange={() => toggleLanguage(language.code)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <span>
                          {language.name} - {language.nativeName}
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          isRequired
                            ? 'bg-blue-100 text-blue-700'
                            : isSelected
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isRequired ? 'Mặc định' : isSelected ? '+100.000đ' : 'Mua thêm'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
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

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
            {...form.register('isActive')}
          />
          Đang hoạt động
        </label>

        {isEdit ? (
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
              {...form.register('reTranslateAdditionalLanguages')}
            />
            <span>
              <span className="font-medium">
                Tự động cập nhật lại toàn bộ bản dịch đa ngôn ngữ
              </span>
              <span className="mt-1 block text-blue-700">
                Hệ thống sẽ dịch lại tên và mô tả sang các ngôn ngữ đã có sau khi lưu nội dung Tiếng Việt.
              </span>
            </span>
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
      )}
    </Modal>
  );
}

export default PoiFormModal;

function comparePoiLanguageOptions(a: LanguageDto, b: LanguageDto): number {
  if (a.code === REQUIRED_LANGUAGE_CODE) {
    return -1;
  }

  if (b.code === REQUIRED_LANGUAGE_CODE) {
    return 1;
  }

  return (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name);
}

function getSelectablePoiLanguages(activeLanguages: LanguageDto[]): LanguageDto[] {
  const languages = activeLanguages.filter((language) => language.code !== 'vi');
  if (!languages.some((language) => language.code === REQUIRED_LANGUAGE_CODE)) {
    languages.push(REQUIRED_LANGUAGE_FALLBACK);
  }

  return languages.sort(comparePoiLanguageOptions);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
