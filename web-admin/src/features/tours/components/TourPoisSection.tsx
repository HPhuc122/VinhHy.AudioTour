import { useMemo, useState } from 'react';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { usePoisQuery } from '@/features/pois/hooks/usePoisQuery';
import type { TourDto } from '@/features/tours/api/tourApi';
import {
  useAddTourPoiMutation,
  useRemoveTourPoiMutation,
} from '@/features/tours/hooks/useTourWorkflowMutations';

interface TourPoisSectionProps {
  tour: TourDto;
}

export function TourPoisSection({ tour }: TourPoisSectionProps) {
  const [selectedPoiId, setSelectedPoiId] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const poisQuery = usePoisQuery({ page: 1, pageSize: 100, isActive: true });
  const addPoi = useAddTourPoiMutation(tour.id);
  const removePoi = useRemoveTourPoiMutation(tour.id);
  const assignedPoiIds = useMemo(
    () => new Set(tour.pois.map((tourPoi) => tourPoi.poiId)),
    [tour.pois],
  );
  const availablePoiOptions =
    poisQuery.data?.items
      .filter((poi) => !assignedPoiIds.has(poi.id))
      .map((poi) => ({
        value: poi.id,
        label: `${poi.displayName || poi.code} (${poi.code})`,
      })) ?? [];
  const sortedPois = [...tour.pois].sort((a, b) => a.orderIndex - b.orderIndex);
  const errorMessage = getErrorMessage(addPoi.error) ?? getErrorMessage(removePoi.error);

  const handleAdd = () => {
    const poiId = Number(selectedPoiId);
    if (!Number.isInteger(poiId) || poiId <= 0) {
      setFieldError('Select a POI.');
      return;
    }

    if (assignedPoiIds.has(poiId)) {
      setFieldError('This POI is already assigned to the tour.');
      return;
    }

    setFieldError(null);
    addPoi.mutate(
      {
        poiId,
        orderIndex: sortedPois.length,
      },
      {
        onSuccess: () => setSelectedPoiId(''),
      },
    );
  };

  const handleRemove = (poiId: number) => {
    const confirmed = window.confirm('Remove this POI from the tour?');
    if (!confirmed) {
      return;
    }

    removePoi.mutate(poiId);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">POIs In Tour</h2>
        <p className="mt-1 text-sm text-slate-600">Assign POIs that belong to this tour.</p>
      </div>

      {errorMessage ? <div className="mt-4"><Alert variant="error" message={errorMessage} /></div> : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FormField label="POI" htmlFor="tour-poi-select" error={fieldError ?? undefined}>
            <Select
              id="tour-poi-select"
              name="poiId"
              options={availablePoiOptions}
              placeholder="Select POI"
              value={selectedPoiId}
              disabled={poisQuery.isLoading || addPoi.isPending}
              error={fieldError ?? undefined}
              onChange={(event) => {
                setSelectedPoiId(event.target.value);
                setFieldError(null);
              }}
            />
          </FormField>
        </div>
        <Button type="button" onClick={handleAdd} loading={addPoi.isPending}>
          Add POI
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Order</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">POI Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Code</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedPois.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                  No POIs assigned yet.
                </td>
              </tr>
            ) : (
              sortedPois.map((tourPoi, index) => (
                <tr key={tourPoi.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {tourPoi.poiName || tourPoi.poiCode || `POI #${tourPoi.poiId}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {tourPoi.poiCode || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        loading={removePoi.isPending && removePoi.variables === tourPoi.poiId}
                        onClick={() => handleRemove(tourPoi.poiId)}
                      >
                        Remove
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

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof ApiClientError) {
    return error.message;
  }

  return 'Unable to update tour POIs.';
}
