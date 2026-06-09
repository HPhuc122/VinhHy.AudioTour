import { type FormEvent, useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
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
  code: string;
  poiId: string;
  tourId: string;
  isActive: boolean;
}

const defaultValues: QrFormState = {
  code: '',
  poiId: '',
  tourId: '',
  isActive: true,
};

export function QrForm({
  mode,
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
    const code = values.code.trim();
    const poi = parseOptionalId(values.poiId);
    const tour = parseOptionalId(values.tourId);

    if (!code) {
      nextErrors.code = 'QR code is required.';
    }

    if (!poi.isValid) {
      nextErrors.poiId = 'POI ID must be a positive whole number.';
    }

    if (!tour.isValid) {
      nextErrors.tourId = 'Tour ID must be a positive whole number.';
    }

    if (poi.isValid && tour.isValid && !poi.hasInput && !tour.hasInput) {
      nextErrors.poiId = 'Enter a POI ID or Tour ID.';
    }

    if (poi.isValid && tour.isValid && poi.hasInput && tour.hasInput) {
      nextErrors.tourId = 'Use only one target.';
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      code,
      poiId: poi.id,
      tourId: tour.id,
      isActive: values.isActive,
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="QR code" htmlFor="qr-code" error={fieldErrors.code}>
          <Input
            id="qr-code"
            name="code"
            value={values.code}
            disabled={isSubmitting}
            hasError={Boolean(fieldErrors.code)}
            onChange={(event) => setValues((current) => ({ ...current, code: event.target.value }))}
          />
        </FormField>

        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-sky-800 focus:ring-sky-600"
              checked={values.isActive}
              disabled={isSubmitting}
              onChange={(event) =>
                setValues((current) => ({ ...current, isActive: event.target.checked }))
              }
            />
            Active
          </label>
        </div>

        <FormField label="POI ID" htmlFor="qr-poi-id" error={fieldErrors.poiId}>
          <Input
            id="qr-poi-id"
            name="poiId"
            type="number"
            min="1"
            step="1"
            value={values.poiId}
            disabled={isSubmitting}
            hasError={Boolean(fieldErrors.poiId)}
            onChange={(event) =>
              setValues((current) => ({ ...current, poiId: event.target.value }))
            }
          />
        </FormField>

        <FormField label="Tour ID" htmlFor="qr-tour-id" error={fieldErrors.tourId}>
          <Input
            id="qr-tour-id"
            name="tourId"
            type="number"
            min="1"
            step="1"
            value={values.tourId}
            disabled={isSubmitting}
            hasError={Boolean(fieldErrors.tourId)}
            onChange={(event) =>
              setValues((current) => ({ ...current, tourId: event.target.value }))
            }
          />
        </FormField>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'create' ? 'Create QR code' : 'Save changes'}
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
    code: values.code,
    poiId: values.poiId == null ? '' : String(values.poiId),
    tourId: values.tourId == null ? '' : String(values.tourId),
    isActive: values.isActive,
  };
}

function parseOptionalId(rawValue: string): {
  id: number | null;
  hasInput: boolean;
  isValid: boolean;
} {
  const value = rawValue.trim();
  if (!value) {
    return { id: null, hasInput: false, isValid: true };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { id: null, hasInput: true, isValid: false };
  }

  return { id: parsed, hasInput: true, isValid: true };
}
