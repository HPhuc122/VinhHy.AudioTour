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
  const returnView = qrQuery.data?.qrKind === 'AudioPackage' ? 'payment' : 'access';

  const initialValues = useMemo(() => {
    if (!qrQuery.data) {
      return undefined;
    }

    return {
      name: qrQuery.data.name,
      qrKind: qrQuery.data.qrKind,
      poiId: qrQuery.data.poiId ?? null,
      tourId: qrQuery.data.tourId ?? null,
      isActive: qrQuery.data.isActive,
      requiresPayment: qrQuery.data.requiresPayment,
      priceAmount: qrQuery.data.priceAmount,
      accessDurationMinutes: qrQuery.data.accessDurationMinutes,
    };
  }, [qrQuery.data]);

  if (parsedQrId === null) {
    return <Alert variant="error" message="Mã QR không hợp lệ." />;
  }

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Chỉnh sửa mã QR dịch vụ</h1>
        <p className="app-subtitle">
          {qrQuery.data ? qrQuery.data.code : 'Đang tải mã QR.'}
        </p>
      </div>

      {qrQuery.isLoading ? <Spinner label="Đang tải mã QR..." /> : null}

      {queryError ? <Alert variant="error" message={queryError} /> : null}

      {initialValues ? (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
          <QrForm
            mode="edit"
            initialValues={initialValues}
            isSubmitting={updateQrMutation.isPending}
            errorMessage={mutationError}
            onCancel={() => navigate(`${routes.qr}?view=${returnView}`)}
            onSubmit={(values) => {
              updateQrMutation.mutate(
                {
                  id: parsedQrId,
                  values: {
                    name: values.name,
                    qrKind: values.qrKind,
                    poiId: values.poiId,
                    tourId: values.tourId,
                    isActive: values.isActive,
                    requiresPayment: values.requiresPayment,
                    priceAmount: values.priceAmount,
                    accessDurationMinutes: values.accessDurationMinutes,
                  },
                },
                {
                  onSuccess: () => {
                    navigate(`${routes.qr}?view=${values.qrKind === 'AudioPackage' ? 'payment' : 'access'}`);
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

  return 'Không thể lưu mã QR.';
}
