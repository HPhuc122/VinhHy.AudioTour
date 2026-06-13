export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--app-text)]">
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-[var(--app-accent)]"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
