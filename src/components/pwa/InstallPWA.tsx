'use client';

import * as React from 'react';
import { usePWA } from './PWAProvider';
import { Button } from '@/components/ui/Button';
import { Download, Check, Share } from 'lucide-react';
import { toast } from 'sonner';

interface InstallPWAProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function InstallPWA({
  className,
  variant = 'primary',
  size = 'md',
  showIcon = true,
}: InstallPWAProps) {
  const { canInstall, isInstalled, isIOS, install } = usePWA();
  const [isInstalling, setIsInstalling] = React.useState(false);

  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <Check className="h-4 w-4" />
        <span>Smart Finance sudah terinstall</span>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200">
        <div className="flex items-center gap-2 font-semibold">
          <Share className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Pasang di iOS / Safari:</span>
        </div>
        <ol className="list-decimal list-inside mt-1.5 space-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-300">
          <li>Tekan tombol <strong>Share</strong> di bar bawah Safari</li>
          <li>Pilih <strong>Add to Home Screen</strong> (Tambah ke Layar Utama)</li>
        </ol>
      </div>
    );
  }

  if (!canInstall) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const accepted = await install();
      if (accepted) {
        toast.success('Smart Finance berhasil dipasang di perangkat Anda!');
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstallClick}
      isLoading={isInstalling}
      leftIcon={showIcon ? <Download className="h-4 w-4" /> : undefined}
      className={className}
    >
      Install Smart Finance
    </Button>
  );
}
