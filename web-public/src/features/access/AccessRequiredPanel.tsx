import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConstants';

interface AccessRequiredPanelProps {
  title?: string;
  message?: string;
}

export function AccessRequiredPanel({
  title = 'Cần mã nghe',
  message = 'Vui lòng quét QR tại điểm tham quan hoặc chọn gói thuyết minh để mở quyền nghe.',
}: AccessRequiredPanelProps) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gray-800 p-6 text-center shadow-xl">
      <p className="mb-2 text-sm font-medium text-amber-300">Chưa mở quyền nghe</p>
      <h2 className="mb-3 text-xl font-bold text-white">{title}</h2>
      <p className="mb-5 text-sm leading-relaxed text-gray-300">{message}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          to={ROUTES.PACKAGES}
          className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Chọn gói nghe
        </Link>
        <Link
          to={ROUTES.MAP}
          className="inline-flex rounded-xl border border-gray-700 bg-gray-900 px-5 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
        >
          Mở bản đồ
        </Link>
      </div>
    </div>
  );
}
