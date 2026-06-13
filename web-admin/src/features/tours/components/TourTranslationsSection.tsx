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
    const confirmed = window.confirm(`Delete ${translation.languageCode} translation?`);
    if (!confirmed) {
      return;
    }

    deleteTranslation.mutate(translation.id);
  };

  return (
    <section className="app-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--app-heading)]">Translations</h2>
          <p className="app-subtitle">Manage localized tour names and descriptions.</p>
        </div>
        <Button
          type="button"
          onClick={openAdd}
          disabled={languagesQuery.isLoading || tour.translations.length >= (languagesQuery.data?.length ?? Infinity)}
        >
          Add Translation
        </Button>
      </div>

      {activeError ? <div className="mt-4"><Alert variant="error" message={activeError} /></div> : null}

      <div className="mt-4 overflow-hidden rounded-md border border-[var(--app-border)]">
        <table className="min-w-full divide-y divide-[var(--app-border)] text-sm">
          <thead className="app-table-head">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Language</th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--app-border)] bg-white">
            {tour.translations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--app-text)]">
                  No translations yet.
                </td>
              </tr>
            ) : (
              tour.translations.map((translation) => (
                <tr key={translation.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--app-heading)]">
                    {translation.languageCode}
                  </td>
                  <td className="px-4 py-3 text-[var(--app-text)]">{translation.name}</td>
                  <td className="max-w-lg px-4 py-3 text-[var(--app-text)]">
                    <span className="line-clamp-2">{translation.description || '-'}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(translation)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        loading={deleteTranslation.isPending && deleteTranslation.variables === translation.id}
                        onClick={() => handleDelete(translation)}
                      >
                        Delete
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

  return 'Unable to save tour translation.';
}
