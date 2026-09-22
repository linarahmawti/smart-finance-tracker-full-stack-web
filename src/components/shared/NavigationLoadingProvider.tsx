'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Loading } from '@/components/ui/Loading';

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = React.useState(false);
  const isInitialMount = React.useRef(true);
  const prevPathRef = React.useRef(pathname);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <React.Suspense fallback={<Loading variant="page" message="Memuat..." />}>
      {isLoading && (
        <Loading variant="overlay" message="Memuat menu Smart Finance..." />
      )}
      {children}
    </React.Suspense>
  );
}
