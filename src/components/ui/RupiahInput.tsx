import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatRupiah, parseRupiahInput } from '@/lib/formatters';

export interface RupiahInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  error?: string;
  helperText?: string;
}

export function RupiahInput({
  value,
  onChange,
  label,
  error,
  helperText,
  className,
  id,
  placeholder = '0',
  ...props
}: RupiahInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Format display string without "Rp " prefix in input for clean editing, or with prefix
  const displayValue = value > 0 ? new Intl.NumberFormat('id-ID').format(value) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseRupiahInput(e.target.value);
    onChange(raw);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-sm font-bold text-zinc-500 dark:text-zinc-400">
          Rp
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'flex h-10 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3.5 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-500',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs font-medium text-red-500">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
      ) : null}
    </div>
  );
}
