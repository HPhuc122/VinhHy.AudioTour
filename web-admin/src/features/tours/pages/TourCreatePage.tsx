import { useNavigate } from 'react-router-dom';
import { ApiClientError } from '@/api/apiError';
import { routes } from '@/config/routes';
import { TourForm } from '@/features/tours/components/TourForm';
import { useCreateTourMutation } from '@/features/tours/hooks/useCreateTourMutation';

export function TourCreatePage() {
  const navigate = useNavigate();
  const createTourMutation = useCreateTourMutation();

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Create tour</h1>
        <p className="app-subtitle">Add a tour for CMS and mobile clients.</p>
      </div>

      <div className="app-card p-5">
        <TourForm
          mode="create"
          isSubmitting={createTourMutation.isPending}
          errorMessage={getErrorMessage(createTourMutation.error)}
          onCancel={() => navigate(routes.tours)}
          onSubmit={(values) => {
            createTourMutation.mutate(values, {
              onSuccess: (tour) => {
                navigate(routes.tourEdit.replace(':tourId', String(tour.id)));
              },
            });
          }}
        />
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

  return 'Unable to create tour.';
}
