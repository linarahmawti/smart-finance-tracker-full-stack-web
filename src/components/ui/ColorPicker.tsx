'use client';

import * as React from 'react';
import { POCKET_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (hexColor: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {POCKET_COLORS.map((color) => {
          const isSelected = value.toLowerCase() === color.value.toLowerCase();
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange(color.value)}
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-95',
                isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900 scale-105' : 'hover:opacity-90'
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {isSelected && <Check className="h-4 w-4 text-white stroke-[3]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
