import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, id, className = '', ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error
              ? 'border-red-400 bg-red-50 focus:ring-red-400'
              : 'border-gray-300 bg-white focus:border-blue-500'
          } ${className}`}
          {...rest}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
