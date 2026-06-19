interface AccessExpiredPanelProps {
  message?: string;
}

export function AccessExpiredPanel({
  message = 'Mã nghe đã hết hạn. Vui lòng quét lại QR hoặc chọn gói thuyết minh để tiếp tục.',
}: AccessExpiredPanelProps) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-gray-800 p-6 text-center shadow-xl">
      <p className="mb-2 text-sm font-medium text-red-300">Mã nghe đã hết hạn</p>
      <h2 className="mb-3 text-xl font-bold text-white">Không thể phát audio</h2>
      <p className="text-sm leading-relaxed text-gray-300">{message}</p>
    </div>
  );
}
