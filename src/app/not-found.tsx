import Link from 'next/link';
import { AlokaLogo } from '@/components/shared/AlokaLogo';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Home, ArrowLeftRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-4 sm:p-6 text-center">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <AlokaLogo size="lg" />
        </div>

        {/* 404 Badge & Visual */}
        <div className="relative py-4">
          <div className="text-8xl sm:text-9xl font-black tracking-tighter text-blue-600/15 dark:text-blue-500/10 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-2xl border border-blue-200 bg-blue-50/90 px-4 py-1.5 text-xs sm:text-sm font-bold text-blue-700 shadow-sm backdrop-blur-sm dark:border-blue-900/60 dark:bg-blue-950/80 dark:text-blue-300">
               Not Found
            </span>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tautan yang Anda masukkan tidak valid.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Home className="h-4 w-4" />}
              className="w-full shadow-md shadow-blue-500/20"
            >
              Kembali ke Dashboard
            </Button>
          </Link>
          <Link href="/transactions" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<ArrowLeftRight className="h-4 w-4" />}
              className="w-full"
            >
              Daftar Transaksi
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
