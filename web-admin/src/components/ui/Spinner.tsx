export function Spinner({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
