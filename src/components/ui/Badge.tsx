import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'income' | 'expense' | 'transfer' | 'neutral' | 'outline' | 'blue';
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  const variants = {
    income: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40',
    expense: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/40',
    transfer: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200/50 dark:border-violet-800/40',
    neutral: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 border-zinc-200/50 dark:border-zinc-700/40',
    outline: 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/40',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
