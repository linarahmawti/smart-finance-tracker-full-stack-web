'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useFinance } from '@/context/FinanceContext';
import { formatRupiah } from '@/lib/formatters';
import { IconRenderer } from '@/components/shared/IconRenderer';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  History,
  Settings,
  Plus,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { AlokaLogo } from '@/components/shared/AlokaLogo';
import { PocketModal } from '@/components/forms/PocketModal';

export function AppSidebar() {
  const pathname = usePathname();
  const { pockets, summary } = useFinance();
  const [isPocketModalOpen, setIsPocketModalOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Kantong Dana', href: '/pockets', icon: Wallet, badge: pockets.length },
    { name: 'Kategori', href: '/categories', icon: Tags },
    { name: 'Riwayat Finansial', href: '/history', icon: History },
    { name: 'Prediksi AI', href: '/predict', icon: Sparkles },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  return (
    <>
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 border-r border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/95 backdrop-blur-sm">
        {/* Logo & Brand */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-800">
          <Link href="/dashboard" className="group">
            <AlokaLogo size="md" />
          </Link>
        </div>

        {/* Total Balance Mini Card */}
        <div className="p-4 pb-2">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 text-white shadow-lg shadow-blue-500/15">
            <div className="flex items-center justify-between text-blue-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Total Balance
              </span>
              <Wallet className="h-4 w-4 opacity-80" />
            </div>
            <div className="mt-1 text-xl font-black tracking-tight font-number">
              {formatRupiah(summary.total_balance)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-blue-100/90 pt-2 border-t border-white/10">
              <span>{pockets.length} Kantong Aktif</span>
              <span>IDR</span>
            </div>
          </div>
        </div>

        {/* Main Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Menu Utama
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300'
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          isActive
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Pocket Quick Shortcuts */}
          <div>
            <div className="flex items-center justify-between px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              <span>Kantong Dana</span>
              <button
                onClick={() => setIsPocketModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 lowercase hover:underline"
              >
                <Plus className="h-3 w-3" /> baru
              </button>
            </div>
            <div className="space-y-1">
              {pockets.slice(0, 5).map((pocket) => (
                <Link
                  key={pocket.id}
                  href={`/pockets/${pocket.id}`}
                  className="group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: pocket.color }}
                    >
                      <IconRenderer name={pocket.icon} size={13} />
                    </span>
                    <span className="truncate font-medium">{pocket.name}</span>
                  </div>
                  <span className="shrink-0 font-number font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                    {formatRupiah(pocket.current_balance)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Smart Finance &bull; v1.0.0
          </div>
        </div>
      </aside>

      <PocketModal
        isOpen={isPocketModalOpen}
        onClose={() => setIsPocketModalOpen(false)}
      />
    </>
  );
}
