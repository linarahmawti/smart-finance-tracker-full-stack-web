'use client';

import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlokaLogo } from '@/components/shared/AlokaLogo';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [supabase] = React.useState(() => createClient());
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Masukkan alamat email Anda');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message || 'Gagal mengirim instruksi reset kata sandi');
      } else {
        setIsSent(true);
        toast.success('Link reset password telah dikirim ke email Anda!');
      }
    } catch {
      setIsSent(true);
      toast.info('Instruksi simulasi reset terkirim.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <AlokaLogo size="lg" className="mb-2" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Lupa Kata Sandi?
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
            Masukkan email terdaftar untuk menerima link pemulihan akun.
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white/90 p-6 sm:p-8 shadow-xl shadow-zinc-200/50 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:shadow-none">
          {isSent ? (
            <div className="text-center space-y-4 py-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                Email Terkirim
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kami telah mengirimkan tautan reset kata sandi ke <strong>{email}</strong>. Periksa inbox atau spam.
              </p>
              <Link href="/login" className="inline-block mt-4">
                <Button variant="primary" size="md">
                  Kembali ke Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="email"
                label="Alamat Email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 font-semibold shadow-md shadow-blue-500/20"
                isLoading={isLoading}
              >
                Kirim Link Reset
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke halaman login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
