import { useNavigate } from 'react-router-dom';
import { ApiClientError } from '@/api/apiError';
import { routes } from '@/config/routes';
import { QrForm } from '@/features/qr/components/QrForm';
import { useCreateQrMutation } from '@/features/qr/hooks/useCreateQrMutation';

export function QrCreatePage() {
  const navigate = useNavigate();
  const createQrMutation = useCreateQrMutation();

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Create QR code</h1>
        <p className="app-subtitle">Add a QR entry for a POI or tour.</p>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
        <QrForm
          mode="create"
          isSubmitting={createQrMutation.isPending}
          errorMessage={getErrorMessage(createQrMutation.error)}
          onCancel={() => navigate(routes.qr)}
          onSubmit={(values) => {
            createQrMutation.mutate(values, {
              onSuccess: (qr) => {
                navigate(routes.qrEdit.replace(':id', String(qr.id)));
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

  return 'Unable to create QR code.';
}
