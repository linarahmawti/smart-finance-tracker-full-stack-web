'use client';

import * as React from 'react';
import { usePWA } from './PWAProvider';
import { Button } from '@/components/ui/Button';
import { Smartphone, X, Download, Share, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'aloka_pwa_dismissed_timestamp';
const DISMISS_DURATION_DAYS = 7;

export function InstallBanner() {
  const { canInstall, isInstalled, isIOS, isAndroid, isStandalone, install } = usePWA();
  const [isDismissed, setIsDismissed] = React.useState(true);
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = React.useState(false);
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissedTime = localStorage.getItem(STORAGE_KEY);
    if (dismissedTime) {
      const parsedTime = parseInt(dismissedTime, 10);
      const now = Date.now();
      const diffDays = (now - parsedTime) / (1000 * 60 * 60 * 24);
      if (diffDays < DISMISS_DURATION_DAYS) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // safe fallback
    }
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (canInstall) {
      setIsInstalling(true);
      try {
        const accepted = await install();
        if (accepted) {
          toast.success('Aloka Finance berhasil dipasang di perangkat!');
          setIsDismissed(true);
        }
      } finally {
        setIsInstalling(false);
      }
    } else if (isAndroid) {
      setShowAndroidGuide(true);
    }
  };

  // Don't show if already installed or standalone mode or dismissed
  if (isInstalled || isStandalone || isDismissed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-white to-blue-50/50 p-4 shadow-sm dark:border-blue-900/50 dark:bg-gradient-to-r dark:from-blue-950/40 dark:via-zinc-900 dark:to-blue-950/20 backdrop-blur-sm transition-all animate-fade-in mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Icon & Text */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>📱 Install Aloka</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {isAndroid ? 'Android PWA' : isIOS ? 'iOS PWA' : 'PWA App'}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Gunakan Aloka seperti aplikasi native di {isAndroid ? 'Android' : isIOS ? 'iPhone' : 'perangkatmu'}. Akses cepat dari Home Screen.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleInstall}
            isLoading={isInstalling}
            leftIcon={isIOS ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            className="font-semibold text-xs shadow-sm shadow-blue-600/20"
          >
            {isIOS ? 'Cara Pasang di iOS' : 'Install Sekarang'}
          </Button>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
            title="Tutup banner"
            aria-label="Tutup banner install"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Android Helper Guide */}
      {showAndroidGuide && (
        <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-200">
          <div className="font-semibold flex items-center gap-1.5 mb-1 text-blue-700 dark:text-blue-400">
            <MoreVertical className="h-3.5 w-3.5" />
            <span>Petunjuk Pemasangan di Chrome Android:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
            <li>Tekan ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas browser Chrome.</li>
            <li>Pilih opsi <strong>Install aplikasi</strong> atau <strong>Tambahkan ke Layar Utama</strong>.</li>
            <li>Tekan <strong>Install</strong> pada pop-up konfirmasi.</li>
          </ol>
        </div>
      )}

      {/* iOS Modal / Instructions Fallback */}
      {showIOSModal && (
        <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-200">
          <div className="font-semibold flex items-center gap-1.5 mb-1 text-blue-700 dark:text-blue-400">
            <Share className="h-3.5 w-3.5" />
            <span>Petunjuk Pemasangan di iPhone / iPad (Safari):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
            <li>Tekan ikon <strong>Share</strong> (kotak panah ke atas) di menu bawah Safari.</li>
            <li>Gulir ke bawah dan pilih <strong>Add to Home Screen</strong> (Tambah ke Layar Utama).</li>
            <li>Tekan <strong>Add</strong> di pojok kanan atas.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
