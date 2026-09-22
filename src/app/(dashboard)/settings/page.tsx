'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InstallPWA } from '@/components/pwa/InstallPWA';
import { usePWA } from '@/components/pwa/PWAProvider';
import { User, LogOut, Lock, KeyRound, Smartphone, CheckCircle2, Share } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLiveSupabase } = useFinance();
  const [supabase] = React.useState(() => createClient());
  const { isInstalled, isIOS, isAndroid, canInstall, isStandalone } = usePWA();

  // Profile Form State
  const [name, setName] = React.useState(user?.name || 'Wahyu');
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);

  // Password Form State
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);

  React.useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong');
      return;
    }
    setIsUpdatingProfile(true);
    try {
      if (isLiveSupabase && user) {
        await (supabase.from('profiles') as any)
          .update({ name, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        await supabase.auth.updateUser({ data: { name } });
      }
      toast.success('Profil berhasil diperbarui!');
    } catch {
      toast.info('Profil lokal diperbarui');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Silakan isi kata sandi baru dan konfirmasinya');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Kata sandi minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (isLiveSupabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          toast.error(error.message || 'Gagal mengubah kata sandi');
          return;
        }
      }
      toast.success('Kata sandi berhasil diubah!');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Gagal memperbarui kata sandi');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (isLiveSupabase) {
        await supabase.auth.signOut();
      }
      toast.success('Berhasil keluar dari akun.');
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Pengaturan Akun
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Kelola profil, aplikasi PWA, keamanan kata sandi, dan sesi akun Anda.
        </p>
      </div>

      {/* 1. PWA Application Section */}
      <Card className="rounded-3xl p-6 border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-white to-blue-50/20 dark:from-zinc-900 dark:to-blue-950/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Aplikasi</span>
          </CardTitle>
          <CardDescription>
            Pasang Smart Finance di perangkat untuk akses lebih cepat seperti aplikasi native.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200/60 bg-zinc-50/50 dark:border-zinc-800/60 dark:bg-zinc-800/30">
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>📱 Install Smart Finance</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pasang Smart Finance di perangkat untuk akses lebih cepat seperti aplikasi.
              </p>
            </div>

            <div className="shrink-0">
              {isInstalled || isStandalone ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>✓ Smart Finance sudah terinstall</span>
                </div>
              ) : canInstall ? (
                <InstallPWA variant="primary" size="sm" />
              ) : isAndroid ? (
                <div className="text-left bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200/60 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-200">
                  <div className="font-semibold flex items-center gap-1 mb-1 text-blue-700 dark:text-blue-400">
                    <span>Untuk memasang di Android (Chrome):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                    <li>Tekan ikon <strong>titik tiga (⋮)</strong> di kanan atas Chrome</li>
                    <li>Pilih <strong>Install aplikasi</strong> / <strong>Tambahkan ke Layar Utama</strong></li>
                  </ol>
                </div>
              ) : isIOS ? (
                <div className="text-left bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200/60 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-200">
                  <div className="font-semibold flex items-center gap-1 mb-1 text-blue-700 dark:text-blue-400">
                    <Share className="h-3.5 w-3.5" />
                    <span>Untuk memasang di iPhone / iPad:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                    <li>Tekan tombol <strong>Share</strong> di Safari</li>
                    <li>Pilih <strong>Add to Home Screen</strong></li>
                  </ol>
                </div>
              ) : (
                <div className="text-xs text-zinc-400 font-medium">
                  Buka di peramban yang mendukung PWA (Chrome/Edge/Android) untuk memasang.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Profile Settings */}
      <Card className="rounded-3xl p-6 border-zinc-200/80 dark:border-zinc-800/80">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Profil Pengguna</span>
          </CardTitle>
          <CardDescription>
            Perbarui informasi nama dan identitas akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex items-center gap-4 pb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl font-black text-white uppercase shadow-md shadow-blue-500/20">
                {name ? name.charAt(0) : 'U'}
              </div>
              <div>
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{name}</div>
                <div className="text-xs text-zinc-400">{user?.email || 'user@aloka.app'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama Lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
              />
              <Input
                label="Alamat Email"
                value={user?.email || 'user@aloka.app'}
                disabled
                helperText="Email terdaftar."
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingProfile}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Security & Change Password */}
      <Card className="rounded-3xl p-6 border-zinc-200/80 dark:border-zinc-800/80">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Keamanan & Ubah Kata Sandi</span>
          </CardTitle>
          <CardDescription>
            Perbarui kata sandi akun Anda untuk meningkatkan keamanan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="password"
                label="Kata Sandi Baru"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
              />

              <Input
                type="password"
                label="Konfirmasi Kata Sandi Baru"
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdatingPassword}
              >
                Perbarui Kata Sandi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 4. Account & Sign Out */}
      <Card className="rounded-3xl p-6 border-red-200/40 dark:border-red-950/40">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <LogOut className="h-5 w-5" />
            <span>Keluar Akun</span>
          </CardTitle>
          <CardDescription>
            Akhiri sesi Anda pada peramban ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Keluar dan kembali ke halaman login.
            </span>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Keluar (Logout)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
