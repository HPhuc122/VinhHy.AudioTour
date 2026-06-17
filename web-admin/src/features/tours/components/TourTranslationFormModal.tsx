import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import type {
  CreateTourTranslationRequest,
  TourTranslationDto,
  UpdateTourTranslationRequest,
} from '@/features/tours/api/tourApi';
import type { LanguageDto } from '@/features/languages/api/languagesApi';

interface TourTranslationFormModalProps {
  open: boolean;
  onClose: () => void;
  languages: LanguageDto[];
  usedLanguageCodes: string[];
  translation?: TourTranslationDto | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: CreateTourTranslationRequest | UpdateTourTranslationRequest) => void;
}

interface FormState {
  languageCode: string;
  name: string;
  description: string;
}

export function TourTranslationFormModal({
  open,
  onClose,
  languages,
  usedLanguageCodes,
  translation,
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: TourTranslationFormModalProps) {
  const isEdit = Boolean(translation);
  const [values, setValues] = useState<FormState>(() => toFormState(translation));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues(toFormState(translation));
      setFieldErrors({});
    }
  }, [open, translation]);

  const languageOptions = useMemo(() => {
    const used = new Set(usedLanguageCodes);
    return languages
      .filter((language) => isEdit || !used.has(language.code))
      .map((language) => ({
        value: language.code,
        label: `${language.nativeName || language.name} (${language.code})`,
      }));
  }, [isEdit, languages, usedLanguageCodes]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const name = values.name.trim();
    const languageCode = values.languageCode.trim();

    if (!isEdit && !languageCode) {
      nextErrors.languageCode = 'Vui lòng chọn ngôn ngữ.';
    }

    if (!name) {
      nextErrors.name = 'Tên là bắt buộc.';
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (isEdit) {
      onSubmit({
        name,
        description: values.description.trim() || null,
      });
      return;
    }

    onSubmit({
      languageCode,
      name,
      description: values.description.trim() || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa bản dịch' : 'Thêm bản dịch'}
      footer={
        <>
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="tour-translation-form" isLoading={isSubmitting}>
            Lưu
          </Button>
        </>
      }
    >
      <form id="tour-translation-form" className="space-y-4" onSubmit={handleSubmit} noValidate>
        {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

        <FormField label="Ngôn ngữ" htmlFor="translation-language" error={fieldErrors.languageCode}>
          <Select
            id="translation-language"
            name="languageCode"
            options={
              isEdit && translation
                ? [{ value: translation.languageCode, label: translation.languageCode }]
                : languageOptions
            }
            placeholder="Chọn ngôn ngữ"
            value={values.languageCode}
            disabled={isEdit || isSubmitting}
            error={fieldErrors.languageCode}
            onChange={(event) =>
              setValues((current) => ({ ...current, languageCode: event.target.value }))
            }
          />
        </FormField>

        <FormField label="Tên" htmlFor="translation-name" error={fieldErrors.name}>
          <Input
            id="translation-name"
            name="name"
            value={values.name}
            disabled={isSubmitting}
            hasError={Boolean(fieldErrors.name)}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          />
        </FormField>

        <FormField label="Mô tả" htmlFor="translation-description">
          <textarea
            id="translation-description"
            name="description"
            rows={4}
            value={values.description}
            disabled={isSubmitting}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
          />
        </FormField>
      </form>
    </Modal>
  );
}

function toFormState(translation?: TourTranslationDto | null): FormState {
  return {
    languageCode: translation?.languageCode ?? '',
    name: translation?.name ?? '',
    description: translation?.description ?? '',
  };
}
