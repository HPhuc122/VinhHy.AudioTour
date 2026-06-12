import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
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
}

const defaultValues: QrFormState = {
  targetType: 'poi',
  targetId: '',
  isActive: true,
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

    if (!values.targetId || !Number.isInteger(targetId) || targetId <= 0) {
      nextErrors.targetId = 'Select a target.';
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      poiId: values.targetType === 'poi' ? targetId : null,
      tourId: values.targetType === 'tour' ? targetId : null,
      isActive: values.isActive,
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Target type" htmlFor="qr-target-type">
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

        <FormField label="Target" htmlFor="qr-target-id" error={fieldErrors.targetId}>
          <Select
            id="qr-target-id"
            name="targetId"
            options={targetOptions}
            placeholder="Select target"
            value={values.targetId}
            disabled={isSubmitting || poisQuery.isLoading || toursQuery.isLoading}
            error={fieldErrors.targetId}
            onChange={(event) =>
              setValues((current) => ({ ...current, targetId: event.target.value }))
            }
          />
        </FormField>

        <FormField label="Status" htmlFor="qr-status">
          <Select
            id="qr-status"
            name="isActive"
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
            value={String(values.isActive)}
            disabled={isSubmitting}
            onChange={(event) =>
              setValues((current) => ({ ...current, isActive: event.target.value === 'true' }))
            }
          />
        </FormField>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save QR record
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
    };
  }

  return {
    targetType: 'poi',
    targetId: values.poiId == null ? '' : String(values.poiId),
    isActive: values.isActive,
  };
}
