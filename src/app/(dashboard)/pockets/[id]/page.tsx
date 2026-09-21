'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { formatRupiah, formatDate, formatPercentage } from '@/lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { IncomeModal } from '@/components/forms/IncomeModal';
import { ExpenseModal } from '@/components/forms/ExpenseModal';
import { TransferModal } from '@/components/forms/TransferModal';
import { PocketModal } from '@/components/forms/PocketModal';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Target,
  Edit2,
  Plus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export default function PocketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pocketId = params.id as string;
  const { getPocketById, unifiedActivities } = useFinance();

  const pocket = getPocketById(pocketId);

  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = React.useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = React.useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Filter activities related to this pocket
  const pocketActivities = React.useMemo(() => {
    return unifiedActivities.filter(
      (a) =>
        a.pocket_id === pocketId ||
        a.from_pocket_id === pocketId ||
        a.to_pocket_id === pocketId
    );
  }, [unifiedActivities, pocketId]);

  const totalPages = Math.ceil(pocketActivities.length / itemsPerPage) || 1;
  const paginatedActivities = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return pocketActivities.slice(start, start + itemsPerPage);
  }, [pocketActivities, currentPage, itemsPerPage]);

  if (!pocket) {
    return (
      <div className="space-y-6">
        <Link href="/pockets">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Kembali ke Daftar Kantong
          </Button>
        </Link>
        <EmptyState
          icon="Wallet"
          title="Kantong Tidak Ditemukan"
          description="Kantong dana yang Anda cari mungkin telah dihapus atau tidak tersedia."
          actionLabel="Kembali ke Kantong"
          onAction={() => router.push('/pockets')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/pockets">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Kembali ke Daftar Kantong
          </Button>
        </Link>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit2 className="h-3.5 w-3.5" />}
            className="shrink-0"
          >
            Edit Nominal & Target
          </Button>
          <Button
            variant="income"
            size="sm"
            onClick={() => setIsIncomeModalOpen(true)}
            leftIcon={<ArrowDownLeft className="h-4 w-4" />}
            className="shrink-0"
          >
            + Pemasukan
          </Button>
          <Button
            variant="expense"
            size="sm"
            onClick={() => setIsExpenseModalOpen(true)}
            leftIcon={<ArrowUpRight className="h-4 w-4" />}
            className="shrink-0"
          >
            - Pengeluaran
          </Button>
          <Button
            variant="transfer"
            size="sm"
            onClick={() => setIsTransferModalOpen(true)}
            leftIcon={<ArrowRightLeft className="h-4 w-4" />}
            className="shrink-0"
          >
            → Menabung / Transfer
          </Button>
        </div>
      </div>

      {/* Main Pocket Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative"
        style={{
          background: `linear-gradient(135deg, ${pocket.color} 0%, #1e1b4b 100%)`,
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner text-white shrink-0">
              <IconRenderer name={pocket.icon} size={32} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                  {pocket.name}
                </h1>
                {pocket.is_default && (
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md shrink-0">
                    Kantong Utama
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-white/80 max-w-md line-clamp-2">
                {pocket.description || 'Kantong Alokasi Keuangan'}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right bg-white/10 md:bg-transparent p-4 md:p-0 rounded-2xl backdrop-blur-sm md:backdrop-blur-none flex flex-col justify-between">
            <div className="flex items-center justify-between md:justify-end gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Saldo Saat Ini
              </span>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs text-white/90 hover:text-white underline font-semibold flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </button>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-number mt-0.5 tracking-tight truncate">
              {formatRupiah(pocket.current_balance)}
            </div>
          </div>
        </div>

        {/* Target Progress Bar */}
        {pocket.target_amount > 0 && (
          <div className="mt-6 pt-6 border-t border-white/20 relative z-10 space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Target Terkumpul: {formatRupiah(pocket.current_balance)} / {formatRupiah(pocket.target_amount)}</span>
              </div>
              <span className="text-base font-black">
                {formatPercentage(pocket.progress_percentage)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-black/20 p-0.5">
              <div
                className="h-full rounded-full bg-white shadow-sm transition-all duration-500"
                style={{ width: `${Math.min(100, pocket.progress_percentage)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4 Pocket Mini Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Pemasukan Masuk</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-number text-emerald-600 dark:text-emerald-400 mt-2">
            +{formatRupiah(pocket.total_income)}
          </div>
        </Card>

        {/* Total Expense */}
        <Card className="rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Pengeluaran Keluar</span>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-number text-rose-600 dark:text-rose-400 mt-2">
            -{formatRupiah(pocket.total_expense)}
          </div>
        </Card>

        {/* Total Transfers In */}
        <Card className="rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Transfer Masuk</span>
            <TrendingUp className="h-4 w-4 text-violet-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-number text-violet-600 dark:text-violet-400 mt-2">
            +{formatRupiah(pocket.total_transfers_in)}
          </div>
        </Card>

        {/* Total Transfers Out */}
        <Card className="rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Transfer Keluar</span>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-number text-amber-600 dark:text-amber-400 mt-2">
            -{formatRupiah(pocket.total_transfers_out)}
          </div>
        </Card>
      </div>

      {/* Pocket Specific Activity History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Riwayat Aktivitas {pocket.name}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Semua mutasi pemasukan, pengeluaran & transfer terkait kantong ini
            </p>
          </div>
        </div>

        {pocketActivities.length === 0 ? (
          <EmptyState
            icon="Receipt"
            title="Belum Ada Riwayat Mutasi"
            description={`Belum ada transaksi atau perpindahan dana yang tercatat untuk ${pocket.name}.`}
            actionLabel="Catat Transaksi untuk Kantong Ini"
            onAction={() => setIsIncomeModalOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            <Card className="rounded-3xl p-0 overflow-hidden border-zinc-200/80 dark:border-zinc-800/80">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {paginatedActivities.map((activity) => {
                  const isIncomingTransfer = activity.type === 'transfer' && activity.to_pocket_id === pocketId;
                  const isOutgoingTransfer = activity.type === 'transfer' && activity.from_pocket_id === pocketId;

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 sm:px-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            activity.type === 'income' || isIncomingTransfer
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {activity.type === 'income' || isIncomingTransfer ? (
                            <ArrowDownLeft className="h-5 w-5 stroke-[2.5]" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="truncate font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {activity.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span>{formatDate(activity.date)}</span>
                            <span>&bull;</span>
                            {activity.type === 'transfer' ? (
                              <span className="font-medium text-violet-600 dark:text-violet-400">
                                {isIncomingTransfer
                                  ? `Dari: ${activity.from_pocket_name}`
                                  : `Ke: ${activity.to_pocket_name}`}
                              </span>
                            ) : (
                              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 text-[11px]">
                                {activity.category_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right pl-3 shrink-0">
                        <div
                          className={`text-sm sm:text-base font-extrabold font-number ${
                            activity.type === 'income' || isIncomingTransfer
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {activity.type === 'income' || isIncomingTransfer
                            ? `+${formatRupiah(activity.amount)}`
                            : `-${formatRupiah(activity.amount)}`}
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-400">
                          {activity.type === 'income'
                            ? 'Pemasukan'
                            : activity.type === 'expense'
                            ? 'Pengeluaran'
                            : isIncomingTransfer
                            ? 'Transfer Masuk'
                            : 'Transfer Keluar'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={pocketActivities.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </section>

      {/* Modals */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        defaultPocketId={pocketId}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        defaultPocketId={pocketId}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultFromPocketId={pocketId}
      />
      <PocketModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        pocketToEdit={pocket}
      />
    </div>
  );
}
