'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { usePWA } from './PWAProvider';
import { Button } from '@/components/ui/Button';
import { Smartphone, X, Download, Share, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

const REGISTER_FLAG = 'smart_finance_just_registered';
const SEEN_FLAG = 'smart_finance_pwa_registered_prompt_seen';

export function InstallBanner() {
  const pathname = usePathname();
  const { canInstall, isInstalled, isIOS, isAndroid, isStandalone, install } = usePWA();
  const [shouldShow, setShouldShow] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = React.useState(false);
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sesuai requirement: Hanya muncul di awal setelah user baru registrasi,
    // dan hanya ditampilkan di halaman utama dashboard.
    // Di halaman lain (seperti Kategori, Transaksi, dll.) dan setelahnya TIDAK AKAN MUNCUL,
    // melainkan hanya tersedia di menu Pengaturan (/settings).
    const isJustRegistered = localStorage.getItem(REGISTER_FLAG) === 'true';
    const isAlreadySeen = localStorage.getItem(SEEN_FLAG) === 'true';

    if (pathname === '/dashboard' && isJustRegistered && !isAlreadySeen) {
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [pathname]);

  const handleDismiss = () => {
    setShouldShow(false);
    try {
      localStorage.removeItem(REGISTER_FLAG);
      localStorage.setItem(SEEN_FLAG, 'true');
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
          toast.success('Smart Finance berhasil dipasang di perangkat!');
          handleDismiss();
        }
      } finally {
        setIsInstalling(false);
      }
    } else if (isAndroid) {
      setShowAndroidGuide(true);
    }
  };

  // Jangan tampilkan jika sudah terinstall, mode standalone, atau tidak memenuhi syarat registrasi baru
  if (isInstalled || isStandalone || !shouldShow) {
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
              <span>📱 Pasang Smart Finance di Perangkat Anda</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Pengguna Baru
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Selamat datang! Pasang Smart Finance di {isAndroid ? 'Android' : isIOS ? 'iPhone' : 'perangkatmu'} untuk akses cepat dari layar utama. Anda juga dapat memasang aplikasi ini kapan saja melalui menu <strong>Pengaturan</strong>.
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

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Nanti Saja
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
