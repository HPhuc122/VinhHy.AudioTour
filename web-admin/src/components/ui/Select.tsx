import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, label, id, options, placeholder, className = '', ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[var(--app-heading)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`rounded-md border bg-white px-3 py-2 text-sm text-[var(--app-heading)] shadow-sm focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 bg-red-50 focus:ring-red-200'
              : 'border-[var(--app-border)] focus:border-[var(--app-accent)] focus:ring-[var(--app-accent-soft)]'
          } ${className}`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
