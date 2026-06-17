interface PaymentRequiredPanelProps {
  amount: number;
  currency: string;
  durationMinutes: number;
  isPaying?: boolean;
  errorMessage?: string | null;
  onPay: () => void;
}

export function PaymentRequiredPanel({
  amount,
  currency,
  durationMinutes,
  isPaying = false,
  errorMessage,
  onPay,
}: PaymentRequiredPanelProps) {
  return (
    <div className="rounded-2xl border border-pink-500/30 bg-gray-800 p-6 shadow-2xl">
      <p className="mb-2 text-sm font-medium text-pink-300">Thanh toán MoMo mô phỏng</p>
      <h1 className="mb-3 text-2xl font-bold text-white">{formatCurrency(amount, currency)}</h1>
      <p className="mb-6 text-sm leading-relaxed text-gray-300">
        Vé thuyết minh toàn khu. Sử dụng AudioTour trong toàn khu trong {durationMinutes} phút
        sau khi thanh toán mô phỏng thành công.
      </p>

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        disabled={isPaying}
        onClick={onPay}
        className="w-full rounded-xl bg-pink-600 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-900"
      >
        {isPaying ? 'Đang xử lý...' : 'Thanh toán MoMo mô phỏng'}
      </button>
    </div>
  );
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
