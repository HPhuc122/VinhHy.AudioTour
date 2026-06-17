import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { usePoisQuery } from '@/features/pois/hooks/usePoisQuery';
import type { QrFormValues } from '@/features/qr/api/qrApi';
import { useToursQuery } from '@/features/tours/hooks/useToursQuery';

type TargetType = 'poi' | 'tour';

interface QrFormProps {
  mode: 'create' | 'edit';
  initialValues?: QrFormValues;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: QrFormValues) => void;
  onCancel: () => void;
}

interface QrFormState {
  targetType: TargetType;
  targetId: string;
  isActive: boolean;
  requiresPayment: boolean;
  priceAmount: string;
  accessDurationMinutes: string;
}

const defaultValues: QrFormState = {
  targetType: 'poi',
  targetId: '',
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
  const poisQuery = usePoisQuery({ page: 1, pageSize: 100 });
  const toursQuery = useToursQuery({ page: 1, pageSize: 100 });

  useEffect(() => {
    setValues(toFormState(initialValues));
  }, [initialValues]);

  const targetOptions = useMemo(() => {
    if (values.targetType === 'poi') {
      return (
        poisQuery.data?.items.map((poi) => ({
          value: poi.id,
          label: `${poi.code} (#${poi.id})`,
        })) ?? []
      );
    }

    return (
      toursQuery.data?.items.map((tour) => ({
        value: tour.id,
        label: `${tour.code} (#${tour.id})`,
      })) ?? []
    );
  }, [poisQuery.data?.items, toursQuery.data?.items, values.targetType]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const targetId = Number(values.targetId);
    const priceAmount = Number(values.priceAmount);
    const accessDurationMinutes = Number(values.accessDurationMinutes);

    if (!values.targetId || !Number.isInteger(targetId) || targetId <= 0) {
      nextErrors.targetId = 'Chọn đối tượng.';
    }

    if (!Number.isFinite(priceAmount) || priceAmount < 0) {
      nextErrors.priceAmount = 'Nhập giá hợp lệ.';
    }

    if (
      !Number.isInteger(accessDurationMinutes) ||
      accessDurationMinutes <= 0
    ) {
      nextErrors.accessDurationMinutes = 'Thời lượng phải lớn hơn 0.';
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      poiId: values.targetType === 'poi' ? targetId : null,
      tourId: values.targetType === 'tour' ? targetId : null,
      isActive: values.isActive,
      requiresPayment: values.requiresPayment,
      priceAmount,
      accessDurationMinutes,
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Loại đối tượng" htmlFor="qr-target-type">
          <Select
            id="qr-target-type"
            name="targetType"
            options={[
              { value: 'poi', label: 'POI' },
              { value: 'tour', label: 'Tour' },
            ]}
            value={values.targetType}
            disabled={isSubmitting}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                targetType: event.target.value as TargetType,
                targetId: '',
              }))
            }
          />
        </FormField>

        <FormField label="Đối tượng" htmlFor="qr-target-id" error={fieldErrors.targetId}>
          <Select
            id="qr-target-id"
            name="targetId"
            options={targetOptions}
            placeholder="Chọn đối tượng"
            value={values.targetId}
            disabled={isSubmitting || poisQuery.isLoading || toursQuery.isLoading}
            error={fieldErrors.targetId}
            onChange={(event) =>
              setValues((current) => ({ ...current, targetId: event.target.value }))
            }
          />
        </FormField>

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

  if (values.tourId != null) {
    return {
      targetType: 'tour',
      targetId: String(values.tourId),
      isActive: values.isActive,
      requiresPayment: values.requiresPayment ?? false,
      priceAmount: String(values.priceAmount ?? 0),
      accessDurationMinutes: String(values.accessDurationMinutes ?? 60),
    };
  }

  return {
    targetType: 'poi',
    targetId: values.poiId == null ? '' : String(values.poiId),
    isActive: values.isActive,
    requiresPayment: values.requiresPayment ?? false,
    priceAmount: String(values.priceAmount ?? 0),
    accessDurationMinutes: String(values.accessDurationMinutes ?? 60),
  };
}
