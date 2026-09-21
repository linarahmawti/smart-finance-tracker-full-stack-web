'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { MobileNav } from './MobileNav';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { NavigationLoadingProvider } from '@/components/shared/NavigationLoadingProvider';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useFinance();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return (
    <NavigationLoadingProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex max-w-full overflow-x-clip">
        {/* Desktop Sidebar (Only visible on lg+) */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0 w-full max-w-full pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] lg:pb-10 overflow-x-clip">
          <AppHeader />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in overflow-x-clip">
            {/* Non-intrusive PWA Install Banner */}
            <InstallBanner />
            {children}
          </main>
        </div>

        {/* Mobile & Tablet App Navigation Bar */}
        <MobileNav />
      </div>
    </NavigationLoadingProvider>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <DashboardContent>{children}</DashboardContent>
    </FinanceProvider>
  );
}
