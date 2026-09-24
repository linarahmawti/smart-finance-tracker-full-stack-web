import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AlokaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function AlokaLogo({ className, size = 'md', showText = true }: AlokaLogoProps) {
  const pixelSizes = {
    sm: 32,
    md: 40,
    lg: 54,
    xl: 72,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const px = pixelSizes[size];

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src="/images/logoo.png"
          alt="Smart Finance Logo"
          width={px}
          height={px}
          style={{ width: 'auto', height: 'auto' }}
          className="object-contain drop-shadow-sm max-h-full"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              'font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-none',
              textSizes[size]
            )}
          >
            SMART
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mt-0.5 leading-none">
            Finance
          </span>
        </div>
      )}
    </div>
  );
}
