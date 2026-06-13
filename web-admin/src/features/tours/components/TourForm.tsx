import { type FormEvent, useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useLanguagesQuery } from '@/features/languages/hooks/useLanguagesQuery';
import type { TourFormValues } from '@/features/tours/api/tourApi';

interface TourFormProps {
  mode: 'create' | 'edit';
  initialValues?: TourFormValues;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: TourFormValues) => void;
  onCancel: () => void;
}

const defaultValues: TourFormValues = {
  code: '',
  defaultLanguage: 'vi',
  estimatedMinutes: null,
  isActive: true,
};

export function TourForm({
  mode,
  initialValues,
  isSubmitting = false,
  errorMessage,
  onSubmit,
  onCancel,
}: TourFormProps) {
  const [values, setValues] = useState<TourFormValues>(initialValues ?? defaultValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const languagesQuery = useLanguagesQuery();
  const languageOptions =
    languagesQuery.data?.map((language) => ({
      value: language.code,
      label: `${language.nativeName || language.name} (${language.code})`,
    })) ?? [];

  useEffect(() => {
    setValues(initialValues ?? defaultValues);
  }, [initialValues]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const code = values.code.trim();
    const defaultLanguage = values.defaultLanguage.trim();

    if (!code) {
      nextErrors.code = 'Tour code is required.';
    }

    if (!defaultLanguage) {
      nextErrors.defaultLanguage = 'Default language is required.';
    }

    if (values.estimatedMinutes != null && values.estimatedMinutes < 0) {
      nextErrors.estimatedMinutes = 'Estimated minutes must be zero or greater.';
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      ...values,
      code,
      defaultLanguage,
      estimatedMinutes:
        values.estimatedMinutes === null || Number.isNaN(values.estimatedMinutes)
          ? null
          : values.estimatedMinutes,
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Tour code" htmlFor="tour-code" error={fieldErrors.code}>
          <Input
            id="tour-code"
            name="code"
            value={values.code}
            disabled={mode === 'edit' || isSubmitting}
            hasError={Boolean(fieldErrors.code)}
            onChange={(event) => setValues((current) => ({ ...current, code: event.target.value }))}
          />
        </FormField>

        <FormField
          label="Default language"
          htmlFor="tour-default-language"
          error={fieldErrors.defaultLanguage}
        >
          <Select
            id="tour-default-language"
            name="defaultLanguage"
            options={languageOptions}
            placeholder="Select language"
            value={values.defaultLanguage}
            disabled={isSubmitting || languagesQuery.isLoading}
            error={fieldErrors.defaultLanguage}
            onChange={(event) =>
              setValues((current) => ({ ...current, defaultLanguage: event.target.value }))
            }
          />
        </FormField>

        <FormField
          label="Estimated minutes"
          htmlFor="tour-estimated-minutes"
          error={fieldErrors.estimatedMinutes}
        >
          <Input
            id="tour-estimated-minutes"
            name="estimatedMinutes"
            type="number"
            min="0"
            value={values.estimatedMinutes ?? ''}
            disabled={isSubmitting}
            hasError={Boolean(fieldErrors.estimatedMinutes)}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                estimatedMinutes:
                  event.target.value === '' ? null : Number.parseInt(event.target.value, 10),
              }))
            }
          />
        </FormField>

        <FormField label="Status" htmlFor="tour-status">
          <Select
            id="tour-status"
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

      <div className="flex flex-col-reverse gap-3 border-t border-[var(--app-border)] pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'create' ? 'Create tour' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
