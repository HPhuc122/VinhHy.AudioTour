export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-600">
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-700"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
