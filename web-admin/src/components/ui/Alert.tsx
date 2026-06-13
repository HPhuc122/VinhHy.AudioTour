type AlertVariant = 'error' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  message: string;
}

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-heading)]',
};

export function Alert({ variant = 'info', message }: AlertProps) {
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${variantClasses[variant]}`} role="alert">
      {message}
    </div>
  );
}
