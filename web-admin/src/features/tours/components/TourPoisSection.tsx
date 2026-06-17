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
      setFieldError('Vui lòng chọn POI.');
      return;
    }

    if (assignedPoiIds.has(poiId)) {
      setFieldError('POI này đã được gán vào tour.');
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
    const confirmed = window.confirm('Gỡ POI này khỏi tour?');
    if (!confirmed) {
      return;
    }

    removePoi.mutate(poiId);
  };

  return (
    <section className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">POI trong tour</h2>
        <p className="app-subtitle">Gán các địa điểm thuộc tour này.</p>
      </div>

      {errorMessage ? <div className="mt-4"><Alert variant="error" message={errorMessage} /></div> : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FormField label="POI" htmlFor="tour-poi-select" error={fieldError ?? undefined}>
            <Select
              id="tour-poi-select"
              name="poiId"
              options={availablePoiOptions}
              placeholder="Chọn POI"
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
          Thêm POI
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Thứ tự</th>
              <th className="px-4 py-3 text-left font-semibold">Tên POI</th>
              <th className="px-4 py-3 text-left font-semibold">Mã</th>
              <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sortedPois.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-600">
                  Chưa có POI nào được gán.
                </td>
              </tr>
            ) : (
              sortedPois.map((tourPoi, index) => (
                <tr key={tourPoi.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {tourPoi.poiName || tourPoi.poiCode || `POI #${tourPoi.poiId}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
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
                        Gỡ
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

  return 'Không thể cập nhật POI của tour.';
}
