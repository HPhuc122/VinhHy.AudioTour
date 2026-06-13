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
        <h1 className="app-title">Dashboard</h1>
        <p className="app-subtitle">Member 3 content and asset statistics.</p>
      </div>

      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Tours"
          value={stats?.totalTours}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Active Tours"
          value={stats?.activeTours}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="QR Codes"
          value={stats?.totalQrCodes}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Active QR Codes"
          value={stats?.activeQrCodes}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Media Files"
          value={stats?.totalMediaFiles}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Images"
          value={stats?.totalImages}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Audio Files"
          value={stats?.totalAudioFiles}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Deleted Media"
          value={stats?.deletedMediaFiles}
          isLoading={dashboardQuery.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          label="QR-triggered Audio Plays"
          value={stats?.totalQrScans}
          isLoading={dashboardQuery.isLoading}
        />
        <DashboardCard
          label="Total Audio Plays"
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
  if (label.includes('Active')) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (label.includes('Audio') || label.includes('Images')) {
    return 'bg-green-50 text-green-700';
  }

  if (label.includes('Deleted')) {
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

  return 'Unable to load dashboard statistics.';
}
