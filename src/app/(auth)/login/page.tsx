'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlokaLogo } from '@/components/shared/AlokaLogo';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = React.useState(() => createClient());
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan kata sandi wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
          toast.error('Supabase Anon Key belum valid. Masukkan anon public key asli dari Supabase Dashboard ke file .env.local');
          return;
        }
        if (error.message.includes('fetch') || error.message.includes('URL')) {
          toast.info('Masuk dalam Mode Demo / Standalone.');
          router.push('/dashboard');
          return;
        }
        toast.error(error.message || 'Gagal masuk. Periksa email & password.');
      } else if (data?.user) {
        toast.success('Berhasil masuk! Mengalihkan...');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.info('Beralih ke Dashboard Demo.');
      router.push('/dashboard');
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
            Selamat Datang Kembali
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
            Masuk untuk mengelola catatan dan kantong dana keuangan Anda.
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white/90 p-6 sm:p-8 shadow-xl shadow-zinc-200/50 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:shadow-none">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Alamat Email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />

            <Input
              type="password"
              label="Kata Sandi"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-semibold shadow-md shadow-blue-500/20"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Masuk ke Akun
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Belum punya akun?{' '}
            <Link
              href="/register"
              className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
