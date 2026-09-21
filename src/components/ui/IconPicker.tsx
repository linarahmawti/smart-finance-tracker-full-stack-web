'use client';

import * as React from 'react';
import { AVAILABLE_ICONS } from '@/lib/constants';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredIcons = AVAILABLE_ICONS.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      {/* Selected Icon Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <IconRenderer name={value || 'Wallet'} size={15} />
          </div>
          <span className="font-semibold">{value || 'Pilih Icon'}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      {/* Collapsible Icon Grid */}
      {isOpen && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 shadow-md dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama icon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="grid max-h-32 grid-cols-6 sm:grid-cols-8 gap-1.5 overflow-y-auto pr-1">
            {filteredIcons.map((icon) => {
              const isSelected = value === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    onChange(icon);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  )}
                  title={icon}
                >
                  <IconRenderer name={icon} size={16} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
