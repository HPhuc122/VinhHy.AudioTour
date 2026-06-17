import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { useDashboardStatsQuery } from '@/features/analytics/hooks/useDashboardStatsQuery';

export function DashboardPage() {
  const dashboardQuery = useDashboardStatsQuery();
  const stats = dashboardQuery.data;
  const errorMessage = getErrorMessage(dashboardQuery.error);

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
