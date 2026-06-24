import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { routes } from '@/config/routes';
import { TourForm } from '@/features/tours/components/TourForm';
import { TourPoisSection } from '@/features/tours/components/TourPoisSection';
import { TourRouteOrderSection } from '@/features/tours/components/TourRouteOrderSection';
import { useTourQuery } from '@/features/tours/hooks/useTourQuery';
import { useUpdateTourMutation } from '@/features/tours/hooks/useUpdateTourMutation';

export function TourEditPage() {
  const navigate = useNavigate();
  const { tourId } = useParams();
  const parsedTourId = parseTourId(tourId);
  const tourQuery = useTourQuery(parsedTourId);
  const updateTourMutation = useUpdateTourMutation();
  const queryError = getErrorMessage(tourQuery.error);
  const mutationError = getErrorMessage(updateTourMutation.error);

  const initialValues = useMemo(() => {
    if (!tourQuery.data) {
      return undefined;
    }

    return {
      defaultLanguage: tourQuery.data.defaultLanguage,
      estimatedMinutes: tourQuery.data.estimatedMinutes ?? null,
      isActive: tourQuery.data.isActive,
    };
  }, [tourQuery.data]);

  if (parsedTourId === null) {
    return <Alert variant="error" message="Tour không hợp lệ." />;
  }

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Chỉnh sửa tour</h1>
        <p className="app-subtitle">
          {tourQuery.data ? tourQuery.data.code : 'Đang tải tour.'}
        </p>
      </div>

      {tourQuery.isLoading ? <Spinner label="Đang tải tour..." /> : null}

      {queryError ? <Alert variant="error" message={queryError} /> : null}

      {initialValues && tourQuery.data ? (
        <>
          <section className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin tour</h2>
              <p className="app-subtitle">Quản lý thông tin chính của tour.</p>
            </div>
            <TourForm
              mode="edit"
              initialValues={initialValues}
              generatedCode={tourQuery.data.code}
              isSubmitting={updateTourMutation.isPending}
              errorMessage={mutationError}
              onCancel={() => navigate(routes.tours)}
              onSubmit={(values) => {
                updateTourMutation.mutate({
                  id: parsedTourId,
                  values: {
                    defaultLanguage: values.defaultLanguage,
                    estimatedMinutes: values.estimatedMinutes,
                    isActive: values.isActive,
                  },
                });
              }}
            />
          </section>

          <TourPoisSection tour={tourQuery.data} />
          <TourRouteOrderSection tour={tourQuery.data} />
        </>
      ) : null}
    </section>
  );
}

function parseTourId(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof ApiClientError) {
    return error.message;
  }

  return 'Không thể lưu tour.';
}
