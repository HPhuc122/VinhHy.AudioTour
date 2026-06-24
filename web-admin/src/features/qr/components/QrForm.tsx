import { type FormEvent, useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { usePoisQuery } from '@/features/pois/hooks/usePoisQuery';
import type { QrFormValues, QrKind } from '@/features/qr/api/qrApi';
import { useToursQuery } from '@/features/tours/hooks/useToursQuery';

interface Props {
  mode: 'create' | 'edit';
  initialValues?: QrFormValues;
  allowedKinds?: QrKind[];
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: QrFormValues) => void;
  onCancel: () => void;
}

interface State {
  name: string;
  qrKind: QrKind;
  targetId: string;
  isActive: boolean;
  requiresPayment: boolean;
  priceAmount: string;
  accessDurationMinutes: string;
}

const defaults: State = {
  name: '', qrKind: 'Poi', targetId: '', isActive: true, requiresPayment: false,
  priceAmount: '0', accessDurationMinutes: '60',
};

export function QrForm({
  initialValues,
  allowedKinds,
  isSubmitting = false,
  errorMessage,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<State>(() => toState(initialValues));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pois = usePoisQuery({ pageSize: 500, includeDeleted: false });
  const tours = useToursQuery({ pageSize: 500 });
  const isPackage = values.qrKind === 'AudioPackage';
  const allowedKindKey = allowedKinds?.join('|') ?? '';
  const kindOptions = [
    { value: 'Poi' as QrKind, label: 'Đường dẫn đến POI' },
    { value: 'Tour' as QrKind, label: 'Đường dẫn đến Tour' },
    { value: 'AudioPackage' as QrKind, label: 'Thanh toán gói Audio' },
  ].filter((option) => !allowedKinds || allowedKinds.includes(option.value));

  useEffect(() => {
    setValues((current) => {
      const next = toState(initialValues);
      if (!allowedKinds?.length || allowedKinds.includes(next.qrKind)) {
        return next;
      }

      return { ...next, qrKind: allowedKinds[0] ?? current.qrKind, targetId: current.targetId };
    });
  }, [allowedKindKey, initialValues]);

  const targetOptions = values.qrKind === 'Poi'
    ? (pois.data?.items ?? []).map((poi) => ({ value: String(poi.id), label: `${poi.name || poi.code} (${poi.code})` }))
    : (tours.data?.items ?? []).map((tour) => ({ value: String(tour.id), label: `${tour.translations?.[0]?.name || tour.code} (${tour.code})` }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    const nextErrors: Record<string, string> = {};
    const targetId = Number(values.targetId);
    const price = Number(values.priceAmount);
    const duration = Number(values.accessDurationMinutes);
    if (!values.name.trim()) nextErrors.name = 'Vui lòng nhập tên QR.';
    if (values.name.trim().length > 200) nextErrors.name = 'Tên QR không được vượt quá 200 ký tự.';
    if (!isPackage && (!Number.isInteger(targetId) || targetId <= 0)) nextErrors.targetId = 'Vui lòng chọn nội dung đích.';
    if (isPackage && values.requiresPayment && (!Number.isFinite(price) || price <= 0)) nextErrors.priceAmount = 'Giá phải lớn hơn 0.';
    if (isPackage && (!Number.isInteger(duration) || duration <= 0 || duration > 1440)) nextErrors.accessDurationMinutes = 'Thời lượng từ 1 đến 1440 phút.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit({
      name: values.name.trim(),
      qrKind: values.qrKind,
      poiId: values.qrKind === 'Poi' ? targetId : null,
      tourId: values.qrKind === 'Tour' ? targetId : null,
      isActive: values.isActive,
      requiresPayment: isPackage ? values.requiresPayment : false,
      priceAmount: isPackage && values.requiresPayment ? price : 0,
      accessDurationMinutes: isPackage ? duration : 60,
    });
  };

  return <form className="space-y-5" onSubmit={submit} noValidate>
    {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}
    <FormField label="Tên QR" htmlFor="qr-name" error={errors.name}>
      <Input id="qr-name" value={values.name} maxLength={200} placeholder="Ví dụ: QR Tour phố ẩm thực Khánh Hội" disabled={isSubmitting} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}/>
    </FormField>
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="Loại mã QR" htmlFor="qr-kind">
        <Select id="qr-kind" value={values.qrKind} disabled={isSubmitting || kindOptions.length <= 1} options={kindOptions} onChange={(e) => setValues((v) => ({ ...v, qrKind: e.target.value as QrKind, targetId: '' }))}/>
      </FormField>
      <FormField label="Trạng thái" htmlFor="qr-status">
        <Select id="qr-status" value={String(values.isActive)} disabled={isSubmitting} options={[{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Tạm tắt' }]} onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.value === 'true' }))}/>
      </FormField>
      {!isPackage ? <FormField label={values.qrKind === 'Poi' ? 'POI đích' : 'Tour đích'} htmlFor="qr-target" error={errors.targetId}>
        <Select id="qr-target" value={values.targetId} disabled={isSubmitting || pois.isLoading || tours.isLoading} placeholder="-- Chọn nội dung --" options={targetOptions} onChange={(e) => setValues((v) => ({ ...v, targetId: e.target.value }))}/>
      </FormField> : null}
    </div>
    {!isPackage ? <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">QR sẽ mở trực tiếp trang public của {values.qrKind === 'Poi' ? 'POI' : 'Tour'}. Loại này không cấu hình giá và thời lượng.</div> : <div className="grid gap-4 md:grid-cols-2">
      <FormField label="Thanh toán" htmlFor="qr-payment"><label className="flex min-h-[38px] items-center gap-3 rounded-md border border-gray-300 px-3 py-2 text-sm"><input id="qr-payment" type="checkbox" checked={values.requiresPayment} onChange={(e) => setValues((v) => ({ ...v, requiresPayment: e.target.checked }))}/>Yêu cầu thanh toán</label></FormField>
      <FormField label="Giá (VND)" htmlFor="qr-price" error={errors.priceAmount}><Input id="qr-price" type="number" min="0" step="1000" value={values.priceAmount} disabled={!values.requiresPayment || isSubmitting} onChange={(e) => setValues((v) => ({ ...v, priceAmount: e.target.value }))}/></FormField>
      <FormField label="Thời lượng truy cập (phút)" htmlFor="qr-duration" error={errors.accessDurationMinutes}><Input id="qr-duration" type="number" min="1" max="1440" value={values.accessDurationMinutes} disabled={isSubmitting} onChange={(e) => setValues((v) => ({ ...v, accessDurationMinutes: e.target.value }))}/></FormField>
    </div>}
    <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>Hủy</Button><Button type="submit" isLoading={isSubmitting}>Lưu mã QR</Button></div>
  </form>;
}

function toState(values?: QrFormValues): State {
  if (!values) return defaults;
  return {
    name: values.name,
    qrKind: values.qrKind,
    targetId: String(values.qrKind === 'Poi' ? values.poiId ?? '' : values.qrKind === 'Tour' ? values.tourId ?? '' : ''),
    isActive: values.isActive,
    requiresPayment: values.requiresPayment ?? false,
    priceAmount: String(values.priceAmount ?? 0),
    accessDurationMinutes: String(values.accessDurationMinutes ?? 60),
  };
}
