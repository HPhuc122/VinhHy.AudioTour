import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl bg-white shadow-sm border border-gray-100 ${className}`} {...props} />;
}
