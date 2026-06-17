interface AccessExpiredPanelProps {
  message?: string;
}

export function AccessExpiredPanel({
  message = 'Quyền truy cập AudioTour đã hết hạn. Vui lòng quét lại mã QR để kích hoạt lại qua thanh toán mô phỏng.',
}: AccessExpiredPanelProps) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-gray-800 p-6 text-center shadow-xl">
      <p className="mb-2 text-sm font-medium text-red-300">Access expired</p>
      <h2 className="mb-3 text-xl font-bold text-white">Thời gian còn lại: 0:00</h2>
      <p className="text-sm leading-relaxed text-gray-300">{message}</p>
    </div>
  );
}
