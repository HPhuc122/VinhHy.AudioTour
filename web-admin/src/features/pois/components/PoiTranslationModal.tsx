import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { languagesApi, type LanguageDto } from '@/features/languages/api/languagesApi';
import { poiTranslationsApi } from '../api/poiTranslationsApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  poi: any;
}

type Translation = {
  id?: number;
  languageCode: string;
  name: string;
  shortDescription: string;
  description: string;
};

const emptyTranslation: Translation = {
  languageCode: '',
  name: '',
  shortDescription: '',
  description: '',
};

export default function PoiTranslationModal({ isOpen, onClose, poi }: Props) {
  const [editing, setEditing] = useState<Translation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceLanguageCode, setSourceLanguageCode] = useState('vi');
  const [targetLanguageCodes, setTargetLanguageCodes] = useState<string[]>([]);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: translations = [], isLoading, isError } = useQuery({
    queryKey: ['poiTranslations', poi?.id],
    queryFn: () => poiTranslationsApi.getByPoiId(poi.id),
    enabled: isOpen && Boolean(poi?.id),
  });

  const { data: languages = [] } = useQuery({
    queryKey: ['languages'],
    queryFn: languagesApi.getAll,
    enabled: isOpen,
  });

  const { data: providerStatus } = useQuery({
    queryKey: ['poiTranslations', 'provider'],
    queryFn: poiTranslationsApi.getProviderStatus,
    enabled: isOpen,
  });

  const activeLanguages = useMemo(
    () => languages.filter((language: LanguageDto) => language.isActive),
    [languages],
  );

  const translatedCodes = useMemo(
    () => new Set(translations.map((translation: Translation) => translation.languageCode)),
    [translations],
  );

  const availableLanguages = useMemo(
    () => activeLanguages.filter((language) => !translatedCodes.has(language.code)),
    [activeLanguages, translatedCodes],
  );

  const targetLanguages = useMemo(
    () => activeLanguages.filter((language) =>
      language.code !== sourceLanguageCode &&
      (overwriteExisting || !translatedCodes.has(language.code))),
    [activeLanguages, overwriteExisting, sourceLanguageCode, translatedCodes],
  );

  const createMutation = useMutation({
    mutationFn: (payload: Translation) => poiTranslationsApi.create(poi.id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['poiTranslations', poi.id] });
      toast('Đã thêm bản dịch', 'success');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ translationId, payload }: { translationId: number; payload: Translation }) =>
      poiTranslationsApi.update(poi.id, translationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['poiTranslations', poi.id] });
      toast('Đã cập nhật bản dịch', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (translationId: number) => poiTranslationsApi.delete(poi.id, translationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['poiTranslations', poi.id] });
      toast('Đã xóa bản dịch', 'success');
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => poiTranslationsApi.generate({
      poiId: poi.id,
      sourceLanguageCode,
      targetLanguageCodes,
      overwriteExisting,
    }),
    onSuccess: async (result: any) => {
      await queryClient.invalidateQueries({ queryKey: ['poiTranslations', poi.id] });
      setTargetLanguageCodes([]);
      const skipped = result?.skippedLanguageCodes?.length
        ? ` Bỏ qua: ${result.skippedLanguageCodes.join(', ')}.`
        : '';
      toast(`Đã tạo ${getGeneratedTranslationLabel(providerStatus)}.${skipped}`, 'success');
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, 'Không thể tạo bản dịch tự động.'));
    },
  });

  useEffect(() => {
    if (isOpen) {
      setEditing(null);
      setError(null);
      setSourceLanguageCode('vi');
      setTargetLanguageCodes([]);
      setOverwriteExisting(false);
    }
  }, [isOpen, poi?.id]);

  if (!isOpen) return null;

  const startAdd = () => {
    setError(null);
    setEditing({
      ...emptyTranslation,
      languageCode: availableLanguages[0]?.code ?? '',
    });
  };

  const startEdit = (translation: Translation) => {
    setError(null);
    setEditing({
      id: translation.id,
      languageCode: translation.languageCode,
      name: translation.name ?? '',
      shortDescription: translation.shortDescription ?? '',
      description: translation.description ?? '',
    });
  };

  const handleSave = async () => {
    if (!editing) return;

    if (!editing.languageCode) {
      setError('Vui lòng chọn ngôn ngữ.');
      return;
    }

    if (!editing.name.trim()) {
      setError('Vui lòng nhập tên bản dịch.');
      return;
    }

    if (!editing.description.trim()) {
      setError('Vui lòng nhập mô tả bản dịch.');
      return;
    }

    const payload = {
      ...editing,
      name: editing.name.trim(),
      shortDescription: editing.shortDescription.trim(),
      description: editing.description.trim(),
    };

    try {
      if (editing.id) {
        await updateMutation.mutateAsync({ translationId: editing.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setEditing(null);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Không thể lưu bản dịch.'));
    }
  };

  const handleDelete = async (translation: Translation) => {
    if (!translation.id) return;

    const ok = window.confirm(`Xóa bản dịch ${formatLanguageLabel(translation.languageCode, languages)}?`);
    if (!ok) return;

    try {
      await deleteMutation.mutateAsync(translation.id);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Không thể xóa bản dịch.'));
    }
  };

  const toggleTargetLanguage = (code: string) => {
    setTargetLanguageCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]);
  };

  const handleGenerate = () => {
    setError(null);

    if (targetLanguageCodes.length === 0) {
      setError('Vui lòng chọn ít nhất một ngôn ngữ đích.');
      return;
    }

    generateMutation.mutate();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Bản dịch POI ${poi?.code ?? ''}`}
      size="xl"
      scrollable
    >
      <div className="space-y-5">
        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <div className="font-medium text-gray-900">{poi?.name || poi?.code}</div>
          <div className="mt-1 line-clamp-2 text-gray-600">
            {poi?.shortDescription || poi?.description || 'Chưa có mô tả mặc định.'}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <LanguageSummary
            title="Ngôn ngữ khả dụng"
            emptyText="Chưa cấu hình ngôn ngữ hoạt động."
            codes={activeLanguages.map((language) => language.code)}
            languages={languages}
          />
          <LanguageSummary
            title="Đã có bản dịch"
            emptyText="Chưa có bản dịch."
            codes={translations.map((translation: Translation) => translation.languageCode)}
            languages={languages}
          />
        </div>

        <div className="rounded-md border border-indigo-100 bg-indigo-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-medium text-indigo-950">Tạo bản dịch tự động</h4>
              <p className="mt-1 text-sm text-indigo-800">
                {getTranslationProviderLabel(providerStatus)}
              </p>
              {providerStatus && !providerStatus.isConfigured ? (
                <p className="mt-1 text-sm font-medium text-amber-700">Dịch vụ dịch chưa được cấu hình.</p>
              ) : null}
            </div>
            <Button
              onClick={handleGenerate}
              isLoading={generateMutation.isPending}
              disabled={targetLanguages.length === 0}
            >
              Tạo {getGeneratedTranslationLabel(providerStatus)}
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
            <label className="block text-sm font-medium text-gray-700">
              Ngôn ngữ nguồn
              <select
                value={sourceLanguageCode}
                onChange={(event) => {
                  setSourceLanguageCode(event.target.value);
                  setTargetLanguageCodes([]);
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {activeLanguages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {formatLanguageLabel(language.code, activeLanguages)}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-700">Ngôn ngữ đích</span>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={overwriteExisting}
                    onChange={(event) => {
                      setOverwriteExisting(event.target.checked);
                      setTargetLanguageCodes([]);
                    }}
                  />
                  Ghi đè bản dịch đã có
                </label>
              </div>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border border-indigo-100 bg-white/50 p-2">
                {targetLanguages.length === 0 ? (
                  <span className="text-sm text-gray-500">Không còn ngôn ngữ đích phù hợp.</span>
                ) : (
                  targetLanguages.map((language) => (
                    <label
                      key={language.code}
                      className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={targetLanguageCodes.includes(language.code)}
                        onChange={() => toggleTargetLanguage(language.code)}
                      />
                      {formatLanguageLabel(language.code, activeLanguages)}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {error ? <Alert variant="error" message={error} /> : null}

        {editing ? (
          <div className="space-y-4 rounded-md border border-gray-200 p-4 pb-0">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="translation-language">
                Ngôn ngữ
              </label>
              <select
                id="translation-language"
                value={editing.languageCode}
                disabled={Boolean(editing.id)}
                onChange={(event) => setEditing((current) => current ? { ...current, languageCode: event.target.value } : current)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="" disabled>Chọn ngôn ngữ</option>
                {(editing.id ? activeLanguages : availableLanguages).map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name} ({language.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <TextInput
              label="Tên địa điểm"
              value={editing.name}
              onChange={(value) => setEditing((current) => current ? { ...current, name: value } : current)}
            />
            <TextArea
              label="Mô tả ngắn"
              rows={3}
              value={editing.shortDescription}
              onChange={(value) => setEditing((current) => current ? { ...current, shortDescription: value } : current)}
            />
            <TextArea
              label="Mô tả"
              rows={6}
              value={editing.description}
              onChange={(value) => setEditing((current) => current ? { ...current, description: value } : current)}
            />

            <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-white px-4 py-3">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Hủy
              </Button>
              <Button
                onClick={() => void handleSave()}
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                Lưu
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button onClick={startAdd} disabled={availableLanguages.length === 0}>
              Thêm bản dịch
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Ngôn ngữ</th>
                <th className="px-4 py-3 text-left">Tên</th>
                <th className="px-4 py-3 text-left">Mô tả ngắn</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <TableMessage message="Đang tải bản dịch..." />
              ) : isError ? (
                <TableMessage message="Không thể tải bản dịch." tone="error" />
              ) : translations.length === 0 ? (
                <TableMessage message="Chưa có bản dịch." />
              ) : (
                translations.map((translation: Translation) => (
                  <tr key={translation.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatLanguageLabel(translation.languageCode, languages)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{translation.name}</td>
                    <td className="max-w-[260px] truncate px-4 py-3 text-gray-500">
                      {translation.shortDescription || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(translation)}>
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => void handleDelete(translation)}
                          isLoading={deleteMutation.isPending}
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

function LanguageSummary({
  title,
  emptyText,
  codes,
  languages,
}: {
  title: string;
  emptyText: string;
  codes: string[];
  languages: LanguageDto[];
}) {
  return (
    <div className="rounded-md border border-gray-200 px-4 py-3">
      <div className="text-sm font-medium text-gray-900">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {codes.length === 0 ? (
          <span className="text-sm text-gray-500">{emptyText}</span>
        ) : (
          codes.map((code) => (
            <span key={code} className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
              {formatLanguageLabel(code, languages)}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextArea({
  label,
  rows,
  value,
  onChange,
}: {
  label: string;
  rows: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function TableMessage({ message, tone = 'muted' }: { message: string; tone?: 'muted' | 'error' }) {
  return (
    <tr>
      <td colSpan={4} className={`px-4 py-6 text-center ${tone === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
        {message}
      </td>
    </tr>
  );
}

function formatLanguageLabel(code: string, languages: LanguageDto[]): string {
  const language = languages.find((item) => item.code === code);
  return language ? `${language.name} (${language.nativeName})` : code.toUpperCase();
}

function getErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data;
  const validationErrors = data?.errors;

  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors).flat().find(Boolean);
    if (typeof first === 'string') {
      return first;
    }
  }

  return data?.message ?? error?.message ?? fallback;
}

function getTranslationProviderLabel(providerStatus?: { isSimulated?: boolean } | null): string {
  return providerStatus?.isSimulated === false
    ? 'Dịch tự động'
    : 'Dịch mô phỏng / chưa kết nối dịch vụ dịch thật.';
}

function getGeneratedTranslationLabel(providerStatus?: { isSimulated?: boolean } | null): string {
  return providerStatus?.isSimulated === false ? 'bản dịch tự động' : 'bản dịch mô phỏng';
}
