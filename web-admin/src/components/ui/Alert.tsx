type AlertVariant = 'error' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  message: string;
}

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
};

export function Alert({ variant = 'info', message }: AlertProps) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${variantClasses[variant]}`} role="alert">
      {message}
    </div>
  );
}
