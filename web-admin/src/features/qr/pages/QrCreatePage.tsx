import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '@/api/apiError';
import { routes } from '@/config/routes';
import { QrForm } from '@/features/qr/components/QrForm';
import { useCreateQrMutation } from '@/features/qr/hooks/useCreateQrMutation';

export function QrCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view') === 'payment' ? 'payment' : 'access';
  const allowedKinds = view === 'payment' ? (['AudioPackage'] as const) : (['Poi', 'Tour'] as const);
  const createQrMutation = useCreateQrMutation();

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Thêm mã QR dịch vụ</h1>
        <p className="app-subtitle">Tạo mã QR kích hoạt vé thuyết minh toàn khu.</p>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
        <QrForm
          mode="create"
          allowedKinds={[...allowedKinds]}
          initialValues={{
            name: '',
            qrKind: view === 'payment' ? 'AudioPackage' : 'Poi',
            poiId: null,
            tourId: null,
            isActive: true,
            requiresPayment: view === 'payment',
            priceAmount: 0,
            accessDurationMinutes: 60,
          }}
          isSubmitting={createQrMutation.isPending}
          errorMessage={getErrorMessage(createQrMutation.error)}
          onCancel={() => navigate(`${routes.qr}?view=${view}`)}
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

  return 'Không thể tạo mã QR.';
}
