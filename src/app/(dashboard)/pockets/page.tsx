'use client';

import * as React from 'react';
import Link from 'next/link';
import { useFinance } from '@/context/FinanceContext';
import { formatRupiah, formatPercentage } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { EmptyState } from '@/components/shared/EmptyState';
import { PocketModal } from '@/components/forms/PocketModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pocket } from '@/types/finance';
import {
  Plus,
  ArrowRight,
  Target,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react';

export default function PocketsPage() {
  const { pockets, summary, deletePocket } = useFinance();
  const [isPocketModalOpen, setIsPocketModalOpen] = React.useState(false);
  const [pocketToEdit, setPocketToEdit] = React.useState<Pocket | null>(null);
  const [pocketToDelete, setPocketToDelete] = React.useState<Pocket | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteConfirm = async () => {
    if (!pocketToDelete) return;
    setIsDeleting(true);
    await deletePocket(pocketToDelete.id);
    setIsDeleting(false);
    setPocketToDelete(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Kantong Dana (Pockets)
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 sm:mt-1">
            Pisahkan dan kelola pos anggaran Anda secara terstruktur dan terukur.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setPocketToEdit(null);
            setIsPocketModalOpen(true);
          }}
          leftIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
          className="w-full sm:w-auto font-semibold shadow-md shadow-blue-500/20"
        >
          Buat Kantong Baru
        </Button>
      </div>

      {/* Summary Banner */}
      <div className="w-full max-w-full rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-5 sm:p-8 text-white shadow-xl shadow-blue-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-100">
            Total Alokasi Seluruh Kantong
          </span>
          <div className="text-2xl sm:text-4xl font-black font-number mt-1 tracking-tight truncate">
            {formatRupiah(summary.total_balance)}
          </div>
          <p className="mt-1 text-xs text-blue-100/80">
            Terbagi dalam {pockets.length} pos kantong aktif
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <Button
            variant="secondary"
            className="w-full sm:w-auto bg-white/20 text-white hover:bg-white/30 border-white/30 font-semibold"
            onClick={() => {
              setPocketToEdit(null);
              setIsPocketModalOpen(true);
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Tambah Kantong
          </Button>
        </div>
      </div>

      {/* Pockets Grid */}
      {pockets.length === 0 ? (
        <EmptyState
          icon="Wallet"
          title="Belum Ada Kantong Dana"
          description="Buat kantong baru untuk memisahkan uang makan, tabungan, tagihan, dan operasional."
          actionLabel="Buat Kantong Pertama"
          onAction={() => {
            setPocketToEdit(null);
            setIsPocketModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full max-w-full">
          {pockets.map((pocket) => (
            <div
              key={pocket.id}
              className="flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md active:scale-[0.99] dark:border-zinc-800/80 dark:bg-zinc-900 w-full max-w-full"
            >
              <div>
                {/* Header: Icon, Name & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                      style={{ backgroundColor: pocket.color }}
                    >
                      <IconRenderer name={pocket.icon} size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                        {pocket.name}
                      </h3>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {pocket.description || 'Kantong Finansial'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setPocketToEdit(pocket);
                        setIsPocketModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                      title="Edit kantong"
                      aria-label="Edit kantong"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPocketToDelete(pocket)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Hapus kantong"
                      aria-label="Hapus kantong"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Saldo Current */}
                <div className="mt-5 sm:mt-6 rounded-2xl bg-zinc-50/80 p-3.5 sm:p-4 dark:bg-zinc-800/40 relative group/saldo">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Saldo Tersedia
                    </span>
                    <button
                      onClick={() => {
                        setPocketToEdit(pocket);
                        setIsPocketModalOpen(true);
                      }}
                      className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" /> Edit Nominal
                    </button>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-number text-zinc-900 dark:text-zinc-50 mt-0.5 truncate">
                    {formatRupiah(pocket.current_balance)}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200/50 dark:border-zinc-700/40">
                    <span>{pocket.transaction_count} aktivitas tercatat</span>
                    {pocket.is_default && <span className="font-semibold text-blue-600 dark:text-blue-400">Default</span>}
                  </div>
                </div>

                {/* Target Progress Bar */}
                {pocket.target_amount > 0 ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 truncate">
                        <Target className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        <span className="truncate">Target: {formatRupiah(pocket.target_amount)}</span>
                      </div>
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                        {formatPercentage(pocket.progress_percentage)}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, pocket.progress_percentage)}%`,
                          backgroundColor: pocket.color,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-right">
                    <button
                      onClick={() => {
                        setPocketToEdit(pocket);
                        setIsPocketModalOpen(true);
                      }}
                      className="text-[11px] font-medium text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                    >
                      <Target className="h-3 w-3" /> + Pasang Target Menabung
                    </button>
                  </div>
                )}
              </div>

              {/* Detail Link */}
              <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href={`/pockets/${pocket.id}`}
                  className="flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                >
                  <span>Lihat Riwayat & Detail</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pocket Create / Edit Modal */}
      <PocketModal
        isOpen={isPocketModalOpen}
        onClose={() => {
          setIsPocketModalOpen(false);
          setPocketToEdit(null);
        }}
        pocketToEdit={pocketToEdit}
      />

      {/* Pocket Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pocketToDelete)}
        onClose={() => setPocketToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kantong Dana Ini?"
        description={`Apakah Anda yakin ingin menghapus kantong "${pocketToDelete?.name}"? Pastikan kantong tidak memiliki riwayat transaksi aktif.`}
        confirmText="Ya, Hapus Kantong"
        isLoading={isDeleting}
      />
    </div>
  );
}
