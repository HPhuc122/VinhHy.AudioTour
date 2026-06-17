import { useState } from 'react';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useLanguagesQuery } from '@/features/languages/hooks/useLanguagesQuery';
import type {
  CreateTourTranslationRequest,
  TourDto,
  TourTranslationDto,
  UpdateTourTranslationRequest,
} from '@/features/tours/api/tourApi';
import { TourTranslationFormModal } from '@/features/tours/components/TourTranslationFormModal';
import {
  useAddTourTranslationMutation,
  useDeleteTourTranslationMutation,
  useUpdateTourTranslationMutation,
} from '@/features/tours/hooks/useTourWorkflowMutations';

interface TourTranslationsSectionProps {
  tour: TourDto;
}

export function TourTranslationsSection({ tour }: TourTranslationsSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TourTranslationDto | null>(null);
  const languagesQuery = useLanguagesQuery();
  const addTranslation = useAddTourTranslationMutation(tour.id);
  const updateTranslation = useUpdateTourTranslationMutation(tour.id);
  const deleteTranslation = useDeleteTourTranslationMutation(tour.id);
  const activeError =
    getErrorMessage(addTranslation.error) ??
    getErrorMessage(updateTranslation.error) ??
    getErrorMessage(deleteTranslation.error);

  const openAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (translation: TourTranslationDto) => {
    setEditTarget(translation);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    addTranslation.reset();
    updateTranslation.reset();
  };

  const handleSubmit = (
    values: CreateTourTranslationRequest | UpdateTourTranslationRequest,
  ) => {
    if (editTarget) {
      updateTranslation.mutate(
        {
          translationId: editTarget.id,
          request: values as UpdateTourTranslationRequest,
        },
        { onSuccess: closeModal },
      );
      return;
    }

    addTranslation.mutate(values as CreateTourTranslationRequest, { onSuccess: closeModal });
  };

  const handleDelete = (translation: TourTranslationDto) => {
    const confirmed = window.confirm(`Xóa bản dịch ${translation.languageCode}?`);
    if (!confirmed) {
      return;
    }

    deleteTranslation.mutate(translation.id);
  };

  return (
    <section className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bản dịch tour</h2>
          <p className="app-subtitle">Quản lý tên và mô tả tour theo ngôn ngữ.</p>
        </div>
        <Button
          type="button"
          onClick={openAdd}
          disabled={languagesQuery.isLoading || tour.translations.length >= (languagesQuery.data?.length ?? Infinity)}
        >
          Thêm bản dịch
        </Button>
      </div>

      {activeError ? <div className="mt-4"><Alert variant="error" message={activeError} /></div> : null}

      <div className="mt-4 overflow-hidden rounded-md border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Ngôn ngữ</th>
              <th className="px-4 py-3 text-left font-semibold">Tên</th>
              <th className="px-4 py-3 text-left font-semibold">Mô tả</th>
              <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {tour.translations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-600">
                  Chưa có bản dịch.
                </td>
              </tr>
            ) : (
              tour.translations.map((translation) => (
                <tr key={translation.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    {translation.languageCode}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{translation.name}</td>
                  <td className="max-w-lg px-4 py-3 text-gray-600">
                    <span className="line-clamp-2">{translation.description || '-'}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(translation)}>
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        loading={deleteTranslation.isPending && deleteTranslation.variables === translation.id}
                        onClick={() => handleDelete(translation)}
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

      <TourTranslationFormModal
        open={modalOpen}
        onClose={closeModal}
        languages={languagesQuery.data ?? []}
        usedLanguageCodes={tour.translations.map((translation) => translation.languageCode)}
        translation={editTarget}
        isSubmitting={addTranslation.isPending || updateTranslation.isPending}
        errorMessage={getErrorMessage(addTranslation.error) ?? getErrorMessage(updateTranslation.error)}
        onSubmit={handleSubmit}
      />
    </section>
  );
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof ApiClientError) {
    return error.message;
  }

  return 'Không thể lưu bản dịch tour.';
}
