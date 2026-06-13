import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { routes } from '@/config/routes';
import { QrForm } from '@/features/qr/components/QrForm';
import { useQrQuery } from '@/features/qr/hooks/useQrQuery';
import { useUpdateQrMutation } from '@/features/qr/hooks/useUpdateQrMutation';

export function QrEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const parsedQrId = parseQrId(id);
  const qrQuery = useQrQuery(parsedQrId);
  const updateQrMutation = useUpdateQrMutation();
  const queryError = getErrorMessage(qrQuery.error);
  const mutationError = getErrorMessage(updateQrMutation.error);

  const initialValues = useMemo(() => {
    if (!qrQuery.data) {
      return undefined;
    }

    return {
      poiId: qrQuery.data.poiId ?? null,
      tourId: qrQuery.data.tourId ?? null,
      isActive: qrQuery.data.isActive,
    };
  }, [qrQuery.data]);

  if (parsedQrId === null) {
    return <Alert variant="error" message="Invalid QR id." />;
  }

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Edit QR code</h1>
        <p className="app-subtitle">
          {qrQuery.data ? qrQuery.data.code : 'Loading QR record.'}
        </p>
      </div>

      {qrQuery.isLoading ? <Spinner label="Loading QR code..." /> : null}

      {queryError ? <Alert variant="error" message={queryError} /> : null}

      {initialValues ? (
        <div className="app-card p-5">
          <QrForm
            mode="edit"
            initialValues={initialValues}
            isSubmitting={updateQrMutation.isPending}
            errorMessage={mutationError}
            onCancel={() => navigate(routes.qr)}
            onSubmit={(values) => {
              updateQrMutation.mutate(
                {
                  id: parsedQrId,
                  values: {
                    poiId: values.poiId,
                    tourId: values.tourId,
                    isActive: values.isActive,
                  },
                },
                {
                  onSuccess: () => {
                    navigate(routes.qr);
                  },
                },
              );
            }}
          />
        </div>
      ) : null}
    </section>
  );
}

function parseQrId(value: string | undefined): number | null {
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

  return 'Unable to save QR code.';
}
