import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface SmartFinanceLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'icon' | 'horizontal';
}

export function SmartFinanceLogo({
  className,
  size = 'md',
  showText = true,
  variant,
}: SmartFinanceLogoProps) {
  // If variant is specified, it takes precedence. Otherwise showText determines icon vs full logo.
  const isIconOnly = variant === 'icon' || !showText;

  // Icon dimensions (1:1 square) - logo-smart-finance1.png
  const iconSizes = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 54, height: 54 },
    xl: { width: 72, height: 72 },
  };

  // Full horizontal logo dimensions (2:1 ratio) - logo-smart-finance2.png
  const fullSizes = {
    sm: { width: 72, height: 36 },
    md: { width: 96, height: 48 },
    lg: { width: 132, height: 66 },
    xl: { width: 180, height: 90 },
  };

  const currentSize = isIconOnly ? iconSizes[size] : fullSizes[size];
  const src = isIconOnly
    ? '/images/logo-smart-finance1.png'
    : '/images/logo-smart-finance2.png';

  return (
    <div className={cn('inline-flex items-center select-none shrink-0', className)}>
      <Image
        src={src}
        alt="Smart Finance Logo"
        width={currentSize.width}
        height={currentSize.height}
        style={{ width: '100%', height: '100%' }}
        className="object-contain drop-shadow-sm max-h-full transition-transform hover:scale-[1.02]"
        priority
      />
    </div>
  );
}
