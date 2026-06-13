import { useEffect, useState } from 'react';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import type { TourDto, TourPoiDto } from '@/features/tours/api/tourApi';
import { useReorderTourPoisMutation } from '@/features/tours/hooks/useTourWorkflowMutations';

interface TourRouteOrderSectionProps {
  tour: TourDto;
}

export function TourRouteOrderSection({ tour }: TourRouteOrderSectionProps) {
  const [draftPois, setDraftPois] = useState<TourPoiDto[]>(() => sortPois(tour.pois));
  const reorderPois = useReorderTourPoisMutation(tour.id);
  const errorMessage = getErrorMessage(reorderPois.error);
  const persistedPois = sortPois(tour.pois);

  useEffect(() => {
    setDraftPois(sortPois(tour.pois));
  }, [tour.pois]);

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draftPois.length) {
      return;
    }

    setDraftPois((current) => {
      const next = [...current];
      const currentItem = next[index];
      const targetItem = next[nextIndex];
      if (!currentItem || !targetItem) {
        return current;
      }

      next[index] = targetItem;
      next[nextIndex] = currentItem;
      return next;
    });
  };

  const handleSave = () => {
    reorderPois.mutate({
      items: draftPois.map((tourPoi, index) => ({
        poiId: tourPoi.poiId,
        orderIndex: index,
      })),
    });
  };

  const hasChanges = draftPois.some((tourPoi, index) => tourPoi.id !== persistedPois[index]?.id);

  return (
    <section className="app-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--app-heading)]">Route Order</h2>
          <p className="app-subtitle">Order POIs for the tour route.</p>
        </div>
        <Button
          type="button"
          disabled={draftPois.length < 2 || !hasChanges}
          loading={reorderPois.isPending}
          onClick={handleSave}
        >
          Save Order
        </Button>
      </div>

      {errorMessage ? <div className="mt-4"><Alert variant="error" message={errorMessage} /></div> : null}

      <div className="mt-4 overflow-hidden rounded-md border border-[var(--app-border)]">
        <table className="min-w-full divide-y divide-[var(--app-border)] text-sm">
          <thead className="app-table-head">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Order</th>
              <th className="px-4 py-3 text-left font-semibold">POI Name</th>
              <th className="px-4 py-3 text-right font-semibold">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--app-border)] bg-white">
            {draftPois.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--app-text)]">
                  Add POIs before setting route order.
                </td>
              </tr>
            ) : (
              draftPois.map((tourPoi, index) => (
                <tr key={tourPoi.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--app-text)]">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--app-heading)]">
                    {tourPoi.poiName || tourPoi.poiCode || `POI #${tourPoi.poiId}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={index === 0 || reorderPois.isPending}
                        onClick={() => move(index, -1)}
                      >
                        Up
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={index === draftPois.length - 1 || reorderPois.isPending}
                        onClick={() => move(index, 1)}
                      >
                        Down
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function sortPois(pois: TourPoiDto[]): TourPoiDto[] {
  return [...pois].sort((a, b) => a.orderIndex - b.orderIndex);
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof ApiClientError) {
    return error.message;
  }

  return 'Unable to save route order.';
}
