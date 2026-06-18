import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { useDashboardStatsQuery } from '@/features/analytics/hooks/useDashboardStatsQuery';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROLE_VENDOR } from '@/features/auth/roleAccess';
import { useMediaQuery } from '@/features/media/hooks/useMediaQuery';
import { useNarrationsQuery } from '@/features/narrations/hooks/useNarrationsQuery';

export function DashboardPage() {
  const { user } = useAuth();
  const isVendor = user?.role === ROLE_VENDOR;
  const dashboardQuery = useDashboardStatsQuery({ enabled: !isVendor });
  const vendorImagesAll = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'all' },
    { enabled: isVendor },
  );
  const vendorImagesPending = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Pending' },
    { enabled: isVendor },
  );
  const vendorImagesApproved = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Approved' },
    { enabled: isVendor },
  );
  const vendorImagesRejected = useMediaQuery(
    { page: 1, pageSize: 1, fileType: 'image', approvalStatus: 'Rejected' },
    { enabled: isVendor },
  );
  const vendorNarrationsPending = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'Pending' },
    { enabled: isVendor },
  );
  const vendorNarrationsApproved = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'Approved' },
    { enabled: isVendor },
  );
  const vendorNarrationsRejected = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'Rejected' },
    { enabled: isVendor },
  );
  const vendorNarrationsAudio = useNarrationsQuery(
    { page: 1, pageSize: 1, status: 'AudioGenerated' },
    { enabled: isVendor },
  );
  const stats = dashboardQuery.data;
  const errorMessage = getErrorMessage(dashboardQuery.error);

  if (isVendor) {
    const isLoading =
      vendorImagesAll.isLoading ||
      vendorImagesPending.isLoading ||
      vendorImagesApproved.isLoading ||
      vendorImagesRejected.isLoading ||
      vendorNarrationsPending.isLoading ||
      vendorNarrationsApproved.isLoading ||
      vendorNarrationsRejected.isLoading ||
      vendorNarrationsAudio.isLoading;

    return (
      <section className="app-page">
        <div>
          <h1 className="app-title">Bảng điều khiển chủ sạp</h1>
          <p className="app-subtitle">
            Theo dõi trạng thái ảnh và bản thuyết minh đã gửi duyệt.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard label="Tổng ảnh" value={vendorImagesAll.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Ảnh chờ duyệt" value={vendorImagesPending.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Ảnh đã duyệt" value={vendorImagesApproved.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Ảnh từ chối" value={vendorImagesRejected.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Thuyết minh chờ duyệt" value={vendorNarrationsPending.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Thuyết minh đã duyệt" value={vendorNarrationsApproved.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Thuyết minh từ chối" value={vendorNarrationsRejected.data?.totalCount} isLoading={isLoading} />
          <DashboardCard label="Đã tạo âm thanh" value={vendorNarrationsAudio.data?.totalCount} isLoading={isLoading} />
        </div>
      </section>
    );
  }

  return (
    <section className="app-page">
      <div>
        <h1 className="app-title">Bảng điều khiển</h1>
        <p className="app-subtitle">Thống kê tổng quan nội dung và tài nguyên.</p>
      </div>

      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Tổng số tour"
          value={stats?.totalTours}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Tour đang hoạt động"
          value={stats?.activeTours}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Mã QR"
          value={stats?.totalQrCodes}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Mã QR đang hoạt động"
          value={stats?.activeQrCodes}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Tệp media"
          value={stats?.totalMediaFiles}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Hình ảnh"
          value={stats?.totalImages}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Tệp âm thanh"
          value={stats?.totalAudioFiles}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Media đã xóa"
          value={stats?.deletedMediaFiles}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Ảnh chờ duyệt"
          value={stats?.pendingImages}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Thuyết minh chờ duyệt"
          value={stats?.pendingNarrations}
          isLoading={dashboardQuery.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          label="Lượt phát từ mã QR"
          value={stats?.totalQrScans}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Tổng lượt phát âm thanh"
          value={stats?.totalAudioPlays}
          isLoading={dashboardQuery.isLoading}
        />
      </div>
    </section>
  );
}

interface DashboardCardProps {
  label: string;
  value?: number | null;
  isLoading: boolean;
}

function DashboardCard({ label, value, isLoading }: DashboardCardProps) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 inline-block rounded px-2 py-0.5 text-2xl font-bold ${getStatColor(label)}`}>
        {isLoading ? '...' : formatStat(value)}
      </p>
    </Card>
  );
}

function getStatColor(label: string): string {
  if (label.includes('đang hoạt động')) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (label.includes('âm thanh') || label.includes('Hình ảnh')) {
    return 'bg-green-50 text-green-700';
  }

  if (label.includes('đã xóa')) {
    return 'bg-red-50 text-red-700';
  }

  return 'bg-blue-50 text-blue-700';
}

function formatStat(value?: number | null): string {
  if (value === null || typeof value === 'undefined') {
    return '-';
  }

  return new Intl.NumberFormat().format(value);
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof ApiClientError) {
    return error.message;
  }

  return 'Không thể tải thống kê bảng điều khiển.';
}
