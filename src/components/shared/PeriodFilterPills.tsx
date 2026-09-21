'use client';

import * as React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { PERIOD_OPTIONS } from '@/lib/constants';
import { PeriodFilter } from '@/types/finance';
import { Calendar } from 'lucide-react';

export function PeriodFilterPills({ className = '' }: { className?: string }) {
  const { period, setPeriod } = useFinance();

  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 ${className}`}>
      <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 shrink-0 mr-1">
        <Calendar className="h-3.5 w-3.5 text-blue-500" />
        <span className="hidden xs:inline">Periode:</span>
      </div>
      {PERIOD_OPTIONS.map((opt) => {
        const isActive = period === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value as PeriodFilter)}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold shrink-0 transition-all active:scale-95 ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
