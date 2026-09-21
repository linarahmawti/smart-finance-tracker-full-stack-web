'use client';

import * as React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatRupiah, formatDate, formatHumanDate } from '@/lib/formatters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { QuickActionModal } from '@/components/shared/QuickActionModal';
import { PeriodFilterPills } from '@/components/shared/PeriodFilterPills';
import { UnifiedActivity } from '@/types/finance';
import {
  History as HistoryIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Plus,
  Trash2,
  Calendar,
  Filter,
} from 'lucide-react';

export default function HistoryPage() {
  const { unifiedActivities, period, isInPeriod, deleteTransaction, deleteTransfer } = useFinance();
  const [filterType, setFilterType] = React.useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [isQuickActionOpen, setIsQuickActionOpen] = React.useState(false);
  const [activityToDelete, setActivityToDelete] = React.useState<UnifiedActivity | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8; // 8 date group cards per page

  // Filter activities
  const filteredActivities = React.useMemo(() => {
    return unifiedActivities.filter((a) => {
      if (!isInPeriod(a.date, period)) return false;
      if (filterType !== 'all' && a.type !== filterType) return false;
      return true;
    });
  }, [unifiedActivities, period, isInPeriod, filterType]);

  // Group activities by date
  const groupedActivities = React.useMemo(() => {
    const groups: { date: string; items: UnifiedActivity[] }[] = [];
    const map = new Map<string, UnifiedActivity[]>();

    filteredActivities.forEach((activity) => {
      const d = activity.date;
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d)!.push(activity);
    });

    map.forEach((items, date) => {
      groups.push({ date, items });
    });

    return groups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredActivities]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [period, filterType]);

  const totalPages = Math.ceil(groupedActivities.length / itemsPerPage) || 1;
  const paginatedGroups = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedActivities.slice(start, start + itemsPerPage);
  }, [groupedActivities, currentPage, itemsPerPage]);

  const handleDeleteConfirm = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    if (activityToDelete.type === 'transfer') {
      await deleteTransfer(activityToDelete.id);
    } else {
      await deleteTransaction(activityToDelete.id);
    }
    setIsDeleting(false);
    setActivityToDelete(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Riwayat Finansial Kronologis
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pantau arus kas masuk, keluar, dan pemindahan dana dalam satu linimasa terpadu ({filteredActivities.length} total mutasi).
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsQuickActionOpen(true)}
          leftIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
        >
          Catat Aktivitas
        </Button>
      </div>

      {/* Filter Tabs & Period Slider */}
      <PeriodFilterPills />
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1 shrink-0 mr-1">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        <button
          onClick={() => setFilterType('all')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-all ${
            filterType === 'all'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          Semua Aktivitas
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-all ${
            filterType === 'income'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          Pemasukan
        </button>
        <button
          onClick={() => setFilterType('expense')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-all ${
            filterType === 'expense'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setFilterType('transfer')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-all ${
            filterType === 'transfer'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          Transfer / Menabung
        </button>
      </div>

      {/* Timeline List */}
      {filteredActivities.length === 0 ? (
        <EmptyState
          icon="History"
          title="Belum Ada Riwayat Finansial"
          description="Belum ada transaksi atau transfer dana yang tercatat pada filter ini."
          actionLabel="Mulai Catat Transaksi"
          onAction={() => setIsQuickActionOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {paginatedGroups.map((group) => {
            const dateTotalIncome = group.items
              .filter((i) => i.type === 'income')
              .reduce((sum, i) => sum + i.amount, 0);
            const dateTotalExpense = group.items
              .filter((i) => i.type === 'expense')
              .reduce((sum, i) => sum + i.amount, 0);

            return (
              <div key={group.date} className="space-y-3">
                {/* Date Header Pill */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    <span>{formatHumanDate(group.date)}</span>
                    <span className="font-normal text-zinc-400 text-[11px]">
                      ({formatDate(group.date)})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold font-number">
                    {dateTotalIncome > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        +{formatRupiah(dateTotalIncome)}
                      </span>
                    )}
                    {dateTotalExpense > 0 && (
                      <span className="text-rose-600 dark:text-rose-400">
                        -{formatRupiah(dateTotalExpense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date Group Card */}
                <Card className="rounded-2xl divide-y divide-zinc-100 dark:divide-zinc-800/80 p-0 overflow-clip shadow-sm">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {group.items.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Left: Type Icon & Info */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              activity.type === 'income'
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : activity.type === 'expense'
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                : 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400'
                            }`}
                          >
                            {activity.type === 'income' ? (
                              <ArrowDownLeft className="h-5 w-5 stroke-[2.5]" />
                            ) : activity.type === 'expense' ? (
                              <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                            ) : (
                              <ArrowRightLeft className="h-5 w-5 stroke-[2.5]" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {activity.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {activity.type === 'transfer' ? (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                    {activity.from_pocket_name}
                                  </span>
                                  <span className="text-zinc-400">→</span>
                                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                    {activity.to_pocket_name}
                                  </span>
                                </span>
                              ) : (
                                <span>
                                  {activity.pocket_name} •{' '}
                                  <span className="text-zinc-400">{activity.category_name}</span>
                                </span>
                              )}
                              {activity.description && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-zinc-400 max-w-[200px] truncate">
                                    {activity.description}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Nominal & Delete Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                          <div className="text-left sm:text-right">
                            <div
                              className={`text-sm sm:text-base font-extrabold font-number ${
                                activity.type === 'income'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : activity.type === 'expense'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-violet-600 dark:text-violet-400'
                              }`}
                            >
                              {activity.type === 'income'
                                ? `+${formatRupiah(activity.amount)}`
                                : activity.type === 'expense'
                                ? `-${formatRupiah(activity.amount)}`
                                : `→ ${formatRupiah(activity.amount)}`}
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-400 capitalize">
                              {activity.type === 'income'
                                ? 'Pemasukan'
                                : activity.type === 'expense'
                                ? 'Pengeluaran'
                                : 'Transfer Antar-Kantong'}
                            </span>
                          </div>

                          <button
                            onClick={() => setActivityToDelete(activity)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Hapus aktivitas"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            );
          })}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={groupedActivities.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(activityToDelete)}
        onClose={() => setActivityToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Catatan Riwayat Ini?"
        description={`Apakah Anda yakin ingin menghapus "${activityToDelete?.title}" senilai ${formatRupiah(
          activityToDelete?.amount
        )}? Saldo kantong akan disesuaikan kembali.`}
        confirmText="Ya, Hapus"
        isLoading={isDeleting}
      />

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />
    </div>
  );
}
