'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  History,
  Sparkles,
} from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  const bottomNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Kantong', href: '/pockets', icon: Wallet },
    { name: 'Prediksi', href: '/predict', icon: Sparkles },
    { name: 'Riwayat', href: '/history', icon: History },
  ];

  return (
    <div className="fixed bottom-3.5 left-3 right-3 z-30 lg:hidden max-w-md mx-auto pointer-events-none">
      <nav
        aria-label="Navigasi Mobile Floating"
        className="pointer-events-auto flex items-center justify-around rounded-full border border-white/60 dark:border-zinc-800/90 bg-white/85 dark:bg-zinc-900/85 p-1.5 backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.6)] touch-app-element"
      >
        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center py-1.5 text-[10px] font-bold transition-all duration-200 active:scale-90 rounded-full min-h-[44px]',
                isActive
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/25 animate-fade-in -z-10" />
              )}
              <div className="flex h-5 w-5 items-center justify-center transition-transform">
                <Icon className={cn('h-4 w-4 stroke-[2.2]', isActive && 'scale-110 stroke-[2.8] text-white')} />
              </div>
              <span className={cn('mt-0.5 tracking-tight text-[10px]', isActive ? 'font-black text-white' : 'font-semibold')}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
