'use client';

import * as React from 'react';
import Link from 'next/link';
import { useFinance } from '@/context/FinanceContext';
import { formatRupiah, formatDate } from '@/lib/formatters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { QuickActionModal } from '@/components/shared/QuickActionModal';
import { PeriodFilterPills } from '@/components/shared/PeriodFilterPills';
import { Modal } from '@/components/ui/Modal';
import { Transaction } from '@/types/finance';
import {
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Tags,
  ArrowRight,
  Pencil,
} from 'lucide-react';

export default function TransactionsPage() {
  const {
    transactions,
    pockets,
    categories,
    period,
    isInPeriod,
    deleteTransaction,
    updateTransaction,
  } = useFinance();

  const resolveTransactionCategory = React.useCallback(
    (tx: Transaction) => {
      const exactCategory = categories.find((category) => category.id === tx.category_id);
      if (exactCategory) return exactCategory;

      const transactionWithCategoryName = tx as Transaction & {
        category_name?: string | null;
        category?: string | null;
      };
      const storedCategoryName =
        transactionWithCategoryName.category_name?.trim() ||
        transactionWithCategoryName.category?.trim();

      if (storedCategoryName) {
        const matchingCategory = categories.find(
          (category) => category.name.toLowerCase() === storedCategoryName.toLowerCase()
        );
        if (matchingCategory) return matchingCategory;
        return { id: '', name: storedCategoryName, color: '#94a3b8' };
      }

      const searchableText = `${tx.title} ${tx.description ?? ''}`.toLowerCase();
      let inferredCategoryName: string | null = null;

      if (/tagihan|listrik|air|internet|wifi|pulsa|paket data|cicilan|langganan|subscription/.test(searchableText)) {
        inferredCategoryName = 'Tagihan & Utilities';
      } else if (/hiburan|nonton|bioskop|game|liburan|rekreasi|konser/.test(searchableText)) {
        inferredCategoryName = 'Hiburan & Gaya Hidup';
      } else if (/bensin|spbu|pertamax|transport|ojek|grab|gojek|bus|kereta|parkir/.test(searchableText)) {
        inferredCategoryName = 'Transportasi';
      } else if (/sarapan|makan|makanan|minum|ngopi|kopi|resto|roti|gorengan|cireng|jajan|cafe|café|buah/.test(searchableText)) {
        inferredCategoryName = 'Makanan & Minuman';
      } else if (/belanja|kebutuhan|grocer|pasar|swalayan/.test(searchableText)) {
        inferredCategoryName = 'Belanja Kebutuhan';
      }

      if (inferredCategoryName) {
        return categories.find(
          (category) => category.name.toLowerCase() === inferredCategoryName.toLowerCase()
        );
      }

      return undefined;
    },
    [categories]
  );

  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'income' | 'expense'>('all');
  const [pocketFilter, setPocketFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isQuickActionOpen, setIsQuickActionOpen] = React.useState(false);
  const [txToDelete, setTxToDelete] = React.useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [txToEditCategory, setTxToEditCategory] = React.useState<Transaction | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('');
  const [editedAmount, setEditedAmount] = React.useState('');
  const [isSavingCategory, setIsSavingCategory] = React.useState(false);

  // Filtered & Sorted Transactions
  const filteredTransactions = React.useMemo(() => {
    return transactions
      .filter((tx) => {
        // Period Filter
        if (!isInPeriod(tx.transaction_date, period)) {
          return false;
        }

        // Search
        if (
          search &&
          !tx.title.toLowerCase().includes(search.toLowerCase()) &&
          !tx.description?.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }

        // Type
        if (typeFilter !== 'all' && tx.type !== typeFilter) {
          return false;
        }

        // Pocket
        if (pocketFilter !== 'all' && tx.pocket_id !== pocketFilter) {
          return false;
        }

        // Category
        if (categoryFilter !== 'all' && tx.category_id !== categoryFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
        }
        if (sortBy === 'amount-desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, period, isInPeriod, search, typeFilter, pocketFilter, categoryFilter, sortBy]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const paginatedTransactions = React.useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, activePage, itemsPerPage]);

  const openCategoryEditor = (tx: Transaction) => {
    setTxToEditCategory(tx);
    setSelectedCategoryId(tx.category_id || '');
    setEditedAmount(String(tx.amount));
  };

  const handleCategorySave = async () => {
    const amount = Number(editedAmount);
    if (!txToEditCategory || !selectedCategoryId || !Number.isFinite(amount) || amount <= 0) return;

    setIsSavingCategory(true);
    const tx = txToEditCategory;
    const success = await updateTransaction(tx.id, {
      amount,
      title: tx.title,
      pocket_id: tx.pocket_id,
      category_id: selectedCategoryId,
      transaction_date: tx.transaction_date,
      description: tx.description,
    });
    setIsSavingCategory(false);

    if (success) {
      setTxToEditCategory(null);
      setSelectedCategoryId('');
      setEditedAmount('');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    await deleteTransaction(txToDelete.id);
    setIsDeleting(false);
    setTxToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Daftar Transaksi
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Total {filteredTransactions.length} transaksi tercatat
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsQuickActionOpen(true)}
          leftIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
        >
          Catat Transaksi
        </Button>
      </div>

      {/* Period Filter Pills */}
      <PeriodFilterPills />
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setTypeFilter('all')}
          className={`rounded-xl px-4 py-2 text-xs font-bold shrink-0 transition-all active:scale-95 ${typeFilter === 'all'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
        >
          Semua Tipe
        </button>
        <button
          onClick={() => setTypeFilter('income')}
          className={`rounded-xl px-4 py-2 text-xs font-bold shrink-0 transition-all active:scale-95 ${typeFilter === 'income'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
        >
          + Pemasukan
        </button>
        <button
          onClick={() => setTypeFilter('expense')}
          className={`rounded-xl px-4 py-2 text-xs font-bold shrink-0 transition-all active:scale-95 ${typeFilter === 'expense'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
        >
          - Pengeluaran
        </button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari transaksi berdasarkan judul / catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
            >
              <option value="all">Semua Tipe</option>
              <option value="income">Pemasukan (Income)</option>
              <option value="expense">Pengeluaran (Expense)</option>
            </select>
          </div>

          {/* Pocket Filter */}
          <div>
            <select
              value={pocketFilter}
              onChange={(e) => setPocketFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
            >
              <option value="all">Semua Kantong</option>
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
            <Link
              href="/categories"
              className="mt-2 flex items-center justify-between rounded-xl px-1 py-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span className="flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Kelola Kategori
              </span>

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Active Filter Badges & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc')}
              className="bg-transparent font-semibold text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer"
            >
              <option value="date-desc">Tanggal Terbaru</option>
              <option value="date-asc">Tanggal Terlama</option>
              <option value="amount-desc">Nominal Tertinggi</option>
              <option value="amount-asc">Nominal Terendah</option>
            </select>
          </div>

          {(search || typeFilter !== 'all' || pocketFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setPocketFilter('all');
                setCategoryFilter('all');
              }}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </Card>

      {/* Transactions Display */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon="Receipt"
          title="Tidak Ada Transaksi Ditemukan"
          description="Coba ubah kata kunci pencarian atau filter yang Anda gunakan."
          actionLabel="Catat Transaksi Baru"
          onAction={() => setIsQuickActionOpen(true)}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-zinc-200/80 bg-white overflow-clip shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Transaksi</th>
                  <th className="px-6 py-3.5">Kantong</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5 text-right">Nominal</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {paginatedTransactions.map((tx) => {
                  const pocket = pockets.find((p) => p.id === tx.pocket_id);
                  const cat = resolveTransactionCategory(tx);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${isIncome
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                              }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="h-4 w-4 stroke-[2.5]" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {tx.title}
                            </div>
                            {tx.description && (
                              <div className="text-[11px] text-zinc-400 max-w-xs truncate">
                                {tx.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[11px] font-medium">
                          {pocket?.name || 'Kantong'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat?.color || '#94a3b8' }}
                          />
                          {cat?.name || 'Kategori'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-bold font-number text-sm ${isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                            }`}
                        >
                          {isIncome ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openCategoryEditor(tx)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Edit nominal dan kategori"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setTxToDelete(tx)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {paginatedTransactions.map((tx) => {
              const pocket = pockets.find((p) => p.id === tx.pocket_id);
              const cat = resolveTransactionCategory(tx);
              const isIncome = tx.type === 'income';

              return (
                <Card key={tx.id} className="p-4 rounded-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${isIncome
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="h-5 w-5 stroke-[2.5]" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {tx.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 truncate">
                          <span className="truncate">{pocket?.name}</span>
                          <span>•</span>
                          <span className="truncate">{cat?.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-bold font-number text-sm ${isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                          }`}
                      >
                        {isIncome ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {formatDate(tx.transaction_date)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                      {tx.description || 'Tidak ada catatan'}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => openCategoryEditor(tx)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium dark:text-blue-400"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit transaksi
                      </button>
                      <button
                        onClick={() => setTxToDelete(tx)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Component */}
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            totalItems={filteredTransactions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Edit Category Modal */}
      <Modal
        isOpen={Boolean(txToEditCategory)}
        onClose={() => {
          if (!isSavingCategory) {
            setTxToEditCategory(null);
            setSelectedCategoryId('');
            setEditedAmount('');
          }
        }}
        title="Edit Transaksi"
        description="Perubahan nominal dan kategori akan langsung digunakan oleh halaman prediksi."
        maxWidth="sm"
      >
        {txToEditCategory && (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Transaksi</p>
              <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {txToEditCategory.title}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {formatRupiah(txToEditCategory.amount)}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nominal
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={editedAmount}
                onChange={(event) => setEditedAmount(event.target.value)}
                disabled={isSavingCategory}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Kategori yang sesuai
              </label>
              <select
                value={selectedCategoryId}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
                disabled={isSavingCategory}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Pilih kategori</option>
                {categories
                  .filter((category) => category.type === txToEditCategory.type)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Hanya kategori transaksi ini yang akan diperbarui. Nominal, tanggal, kantong, dan data transaksi lain tidak berubah.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTxToEditCategory(null);
                  setSelectedCategoryId('');
                  setEditedAmount('');
                }}
                disabled={isSavingCategory}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleCategorySave}
                disabled={
                  !selectedCategoryId ||
                  !Number.isFinite(Number(editedAmount)) ||
                  Number(editedAmount) <= 0 ||
                  isSavingCategory
                }
                isLoading={isSavingCategory}
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(txToDelete)}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Transaksi Ini?"
        description={`Apakah Anda yakin ingin menghapus "${txToDelete?.title}" senilai ${formatRupiah(
          txToDelete?.amount
        )}? Saldo kantong akan dihitung ulang secara otomatis.`}
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
