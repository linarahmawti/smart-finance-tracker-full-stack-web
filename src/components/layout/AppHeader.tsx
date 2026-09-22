'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useFinance } from '@/context/FinanceContext';
import { PERIOD_OPTIONS } from '@/lib/constants';
import { PeriodFilter } from '@/types/finance';
import { Button } from '@/components/ui/Button';
import { AlokaLogo } from '@/components/shared/AlokaLogo';
import { QuickActionModal } from '@/components/shared/QuickActionModal';
import {
  Sun,
  Moon,
  Plus,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

export function AppHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { period, setPeriod, user } = useFinance();
  const [isQuickActionOpen, setIsQuickActionOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/transactions')) return 'Transaksi';
    if (pathname.startsWith('/pockets')) return 'Kantong Dana';
    if (pathname.startsWith('/categories')) return 'Kategori';
    if (pathname.startsWith('/history')) return 'Riwayat';
    if (pathname.startsWith('/predict')) return 'Prediksi';
    if (pathname.startsWith('/settings')) return 'Pengaturan';
    return 'Smart Finance';
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex min-h-[3.75rem] w-full max-w-full items-center justify-between border-b border-zinc-200/60 bg-white/80 px-3.5 sm:px-6 pt-[env(safe-area-inset-top,0px)] backdrop-blur-2xl dark:border-zinc-800/60 dark:bg-zinc-900/80 touch-app-element shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
        {/* Left: User Avatar & Page Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <div className="lg:hidden shrink-0">
            <Link href="/settings" className="relative flex items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-xs font-bold text-white uppercase shadow-md shadow-blue-500/20 active:scale-95 transition-transform">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
            </Link>
          </div>

          <div className="min-w-0 truncate">
            <div className="lg:hidden text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Aloka Finance
            </div>
            <h1 className="truncate text-sm sm:text-base md:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Period Filter (Desktop / Tablet) */}
          {(pathname === '/dashboard' || pathname === '/history' || pathname === '/transactions') && (
            <div className="relative hidden sm:flex items-center">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                className="h-8 sm:h-9 appearance-none rounded-xl border border-zinc-200 bg-zinc-50/80 pl-7 pr-6 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
            </div>
          )}

          {/* Quick Action Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsQuickActionOpen(true)}
            leftIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
            className="shadow-md shadow-blue-500/20 font-semibold text-xs h-8 sm:h-9 px-2.5 sm:px-3 active:scale-95 transition-transform rounded-xl"
          >
            <span className="hidden sm:inline">Catat Transaksi</span>
            <span className="sm:hidden">+ Catat</span>
          </Button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/80 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
            title={mounted && theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            aria-label="Toggle tema"
            suppressHydrationWarning
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-700" />
            )}
          </button>
        </div>
      </header>

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />
    </>
  );
}
