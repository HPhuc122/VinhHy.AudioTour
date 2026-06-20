import { type FormEvent, useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { QrFormValues } from '@/features/qr/api/qrApi';

interface QrFormProps {
  mode: 'create' | 'edit';
  initialValues?: QrFormValues;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: QrFormValues) => void;
  onCancel: () => void;
}

interface QrFormState {
  isActive: boolean;
  requiresPayment: boolean;
  priceAmount: string;
  accessDurationMinutes: string;
}

const defaultValues: QrFormState = {
  isActive: true,
  requiresPayment: false,
  priceAmount: '0',
  accessDurationMinutes: '60',
};

export function QrForm({
  initialValues,
  isSubmitting = false,
  errorMessage,
  onSubmit,
  onCancel,
}: QrFormProps) {
  const [values, setValues] = useState<QrFormState>(() => toFormState(initialValues));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(toFormState(initialValues));
  }, [initialValues]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const priceAmount = Number(values.priceAmount);
    const accessDurationMinutes = Number(values.accessDurationMinutes);

    if (!Number.isFinite(priceAmount) || priceAmount < 0) {
      nextErrors.priceAmount = 'Nhập giá hợp lệ.';
    }

    if (values.requiresPayment && (!Number.isFinite(priceAmount) || priceAmount <= 0)) {
      nextErrors.priceAmount = 'Nhập giá lớn hơn 0 khi yêu cầu thanh toán.';
    }

    if (!Number.isInteger(accessDurationMinutes) || accessDurationMinutes <= 0) {
      nextErrors.accessDurationMinutes = 'Thời lượng phải lớn hơn 0.';
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      poiId: null,
      tourId: null,
      isActive: values.isActive,
      requiresPayment: values.requiresPayment,
      priceAmount,
      accessDurationMinutes,
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Mã QR dịch vụ AudioTour mở quyền truy cập toàn khu trong thời lượng cấu hình.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Trạng thái" htmlFor="qr-status">
          <Select
            id="qr-status"
            name="isActive"
            options={[
              { value: 'true', label: 'Hoạt động' },
              { value: 'false', label: 'Tạm tắt' },
            ]}
            value={String(values.isActive)}
            disabled={isSubmitting}
            onChange={(event) =>
              setValues((current) => ({ ...current, isActive: event.target.value === 'true' }))
            }
          />
        </FormField>

        <FormField label="Thanh toán" htmlFor="qr-requires-payment">
          <label className="flex min-h-[38px] items-center gap-3 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
            <input
              id="qr-requires-payment"
              name="requiresPayment"
              type="checkbox"
              checked={values.requiresPayment}
              disabled={isSubmitting}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  requiresPayment: event.target.checked,
                }))
              }
            />
            Yêu cầu thanh toán mô phỏng
          </label>
        </FormField>

        <FormField label="Giá" htmlFor="qr-price-amount" error={fieldErrors.priceAmount}>
          <Input
            id="qr-price-amount"
            name="priceAmount"
            type="number"
            min="0"
            step="1000"
            value={values.priceAmount}
            disabled={isSubmitting}
            error={fieldErrors.priceAmount}
            onChange={(event) =>
              setValues((current) => ({ ...current, priceAmount: event.target.value }))
            }
          />
        </FormField>

        <FormField
          label="Thời lượng truy cập (phút)"
          htmlFor="qr-access-duration"
          error={fieldErrors.accessDurationMinutes}
        >
          <Input
            id="qr-access-duration"
            name="accessDurationMinutes"
            type="number"
            min="1"
            step="1"
            value={values.accessDurationMinutes}
            disabled={isSubmitting}
            error={fieldErrors.accessDurationMinutes}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                accessDurationMinutes: event.target.value,
              }))
            }
          />
        </FormField>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Lưu mã QR
        </Button>
      </div>
    </form>
  );
}

function toFormState(values?: QrFormValues): QrFormState {
  if (!values) {
    return defaultValues;
  }

  return {
    isActive: values.isActive,
    requiresPayment: values.requiresPayment ?? false,
    priceAmount: String(values.priceAmount ?? 0),
    accessDurationMinutes: String(values.accessDurationMinutes ?? 60),
  };
}
