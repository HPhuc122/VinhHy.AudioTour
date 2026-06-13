import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, error, label, id, className = '', ...props }, ref) => {
    const invalid = hasError || Boolean(error);

    return (
      <div className={label || error ? 'flex flex-col gap-1' : undefined}>
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            invalid
              ? 'border-red-400 bg-red-50 focus:ring-red-400'
              : 'border-gray-300 bg-white focus:border-blue-500'
          } ${className}`}
          {...props}
        />
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
