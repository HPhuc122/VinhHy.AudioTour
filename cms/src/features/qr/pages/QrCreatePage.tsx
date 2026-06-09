import { useNavigate } from 'react-router-dom';
import { ApiClientError } from '@/api/apiError';
import { routes } from '@/config/routes';
import { QrForm } from '@/features/qr/components/QrForm';
import { useCreateQrMutation } from '@/features/qr/hooks/useCreateQrMutation';

export function QrCreatePage() {
  const navigate = useNavigate();
  const createQrMutation = useCreateQrMutation();

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Create QR code</h1>
        <p className="mt-1 text-sm text-slate-600">Add a QR entry for a POI or tour.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
