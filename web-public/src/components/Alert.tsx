interface AlertProps {
  message: string;
  variant?: 'info' | 'error';
}

export function Alert({ message, variant = 'info' }: AlertProps) {
  const classes =
    variant === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-sky-200 bg-sky-50 text-sky-900';

  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${classes}`} role="alert">
      {message}
    </div>
  );
}
