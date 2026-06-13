import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-[var(--app-accent)] bg-[var(--app-accent)] text-white shadow-sm hover:bg-[var(--app-accent-strong)] hover:border-[var(--app-accent-strong)] disabled:border-[var(--app-accent-border)] disabled:bg-[var(--app-accent-soft)] disabled:text-[var(--app-text)]',
  secondary:
    'border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-heading)] hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] disabled:bg-[var(--app-surface-muted)] disabled:text-[var(--app-text)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--app-text)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-heading)]',
  danger:
    'border border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700 disabled:border-red-200 disabled:bg-red-100 disabled:text-red-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isBusy = isLoading || loading;

  return (
    <button
      type="button"
      disabled={disabled ?? isBusy}
      className={`inline-flex items-center justify-center rounded-md font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-accent)] disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isBusy ? 'Please wait...' : children}
    </button>
  );
}
