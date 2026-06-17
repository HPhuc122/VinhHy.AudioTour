import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConstants';

interface AccessRequiredPanelProps {
  title?: string;
  message?: string;
}

export function AccessRequiredPanel({
  title = 'Cần vé AudioTour',
  message = 'Vui lòng quét mã QR tại điểm tham quan hoặc tour để thanh toán mô phỏng và nhận quyền truy cập tạm thời.',
}: AccessRequiredPanelProps) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gray-800 p-6 text-center shadow-xl">
      <p className="mb-2 text-sm font-medium text-amber-300">GuestAccessPass required</p>
      <h2 className="mb-3 text-xl font-bold text-white">{title}</h2>
      <p className="mb-5 text-sm leading-relaxed text-gray-300">{message}</p>
      <Link
        to={ROUTES.HOME}
        className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
