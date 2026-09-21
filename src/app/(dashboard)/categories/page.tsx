'use client';

import * as React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatRupiah } from '@/lib/formatters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { EmptyState } from '@/components/shared/EmptyState';
import { CategoryModal } from '@/components/forms/CategoryModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Category } from '@/types/finance';
import {
  Tags,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
} from 'lucide-react';

export default function CategoriesPage() {
  const { categories, transactions, deleteCategory } = useFinance();
  const [activeTab, setActiveTab] = React.useState<'expense' | 'income'>('expense');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [categoryToEdit, setCategoryToEdit] = React.useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const displayedCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  // Calculate usage & amount per category
  const getCategoryStats = (categoryId: string) => {
    let count = 0;
    let total = 0;
    transactions.forEach((tx) => {
      if (tx.category_id === categoryId) {
        count++;
        total += Number(tx.amount);
      }
    });
    return { count, total };
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    await deleteCategory(categoryToDelete.id);
    setIsDeleting(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Kategori Keuangan
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola kategori custom untuk mengelompokkan pemasukan dan pengeluaran Anda.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setCategoryToEdit(null);
            setIsCategoryModalOpen(true);
          }}
          leftIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
          className="w-full sm:w-auto"
        >
          Buat Kategori Baru
        </Button>
      </div>

      {/* Responsive Tabs */}
      <div className="w-full max-w-md">
        <Tabs
          tabs={[
            {
              id: 'expense',
              label: 'Pengeluaran',
              icon: <ArrowUpRight className="h-4 w-4 text-rose-500" />,
              badge: expenseCategories.length,
            },
            {
              id: 'income',
              label: 'Pemasukan',
              icon: <ArrowDownLeft className="h-4 w-4 text-emerald-500" />,
              badge: incomeCategories.length,
            },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as 'expense' | 'income')}
        />
      </div>

      {/* Categories Grid */}
      {displayedCategories.length === 0 ? (
        <EmptyState
          icon="Tags"
          title="Belum Ada Kategori"
          description={`Belum ada kategori ${activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'} yang dibuat. Buat kategori pertama Anda.`}
          actionLabel="Buat Kategori Sekarang"
          onAction={() => {
            setCategoryToEdit(null);
            setIsCategoryModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedCategories.map((category) => {
            const stats = getCategoryStats(category.id);
            return (
              <div
                key={category.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: category.color }}
                      >
                        <IconRenderer name={category.icon} size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {category.name}
                        </h4>
                        <span className="text-[11px] text-zinc-400 capitalize">
                          {category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (Edit & Delete) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setCategoryToEdit(category);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                        title="Edit Kategori"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCategoryToDelete(category)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">Total Akumulasi</span>
                      <span className="font-bold font-number text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(stats.total)}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400">
                      {stats.count} transaksi tercatat
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
        defaultType={activeTab}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kategori Ini?"
        description={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.name}"?`}
        confirmText="Ya, Hapus Kategori"
        isLoading={isDeleting}
      />
    </div>
  );
}
