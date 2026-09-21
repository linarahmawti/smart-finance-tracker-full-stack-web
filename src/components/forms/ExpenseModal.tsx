'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, ExpenseFormData } from '@/lib/validations/finance';
import { useFinance } from '@/context/FinanceContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RupiahInput } from '@/components/ui/RupiahInput';
import { Select } from '@/components/ui/Select';
import { formatRupiah } from '@/lib/formatters';
import { ArrowUpRight, AlertCircle } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPocketId?: string;
}

export function ExpenseModal({ isOpen, onClose, defaultPocketId }: ExpenseModalProps) {
  const { pockets, categories, addExpense, getPocketById } = useFinance();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const expenseCategories = React.useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      title: '',
      pocket_id: defaultPocketId || pockets[0]?.id || '',
      category_id: expenseCategories[0]?.id || '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  const selectedPocketId = watch('pocket_id');
  const currentAmount = watch('amount');
  const selectedPocket = getPocketById(selectedPocketId);
  const isOverBudget = selectedPocket && currentAmount > selectedPocket.current_balance;

  React.useEffect(() => {
    if (isOpen) {
      reset({
        amount: 0,
        title: '',
        pocket_id: defaultPocketId || pockets[0]?.id || '',
        category_id: expenseCategories[0]?.id || '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  }, [isOpen, defaultPocketId]); // Only trigger on open state change

  const onSubmit = async (data: ExpenseFormData) => {
    if (isOverBudget) {
      return;
    }
    setIsSubmitting(true);
    const success = await addExpense(data);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Pengeluaran"
      description="Catat pengeluaran dan kurangi saldo dari kantong yang dipilih."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nominal */}
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <RupiahInput
              label="Nominal Pengeluaran"
              value={field.value}
              onChange={field.onChange}
              error={errors.amount?.message}
              placeholder="Contoh: 50.000"
              autoFocus
            />
          )}
        />

        {/* Selected Pocket Available Balance Alert */}
        {selectedPocket && (
          <div
            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs ${
              isOverBudget
                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                : 'bg-zinc-100/80 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              {isOverBudget && <AlertCircle className="h-4 w-4 text-rose-500" />}
              <span>Saldo Tersedia di {selectedPocket.name}:</span>
            </div>
            <span className="font-bold font-number">
              {formatRupiah(selectedPocket.current_balance)}
            </span>
          </div>
        )}

        {isOverBudget && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            Peringatan: Saldo {selectedPocket?.name} tidak mencukupi untuk pengeluaran ini.
          </p>
        )}

        {/* Judul Transaksi */}
        <Input
          label="Judul Transaksi"
          placeholder="Misal: Makan Siang Resto, Bensin Motor"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Kantong Sumber & Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Potong dari Kantong"
            error={errors.pocket_id?.message}
            {...register('pocket_id')}
          >
            {pockets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatRupiah(p.current_balance)})
              </option>
            ))}
          </Select>

          <Select
            label="Kategori"
            error={errors.category_id?.message}
            {...register('category_id')}
          >
            {expenseCategories.length === 0 ? (
              <option value="">(Belum ada kategori pengeluaran)</option>
            ) : (
              expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </Select>
        </div>

        {/* Tanggal */}
        <Input
          type="date"
          label="Tanggal Transaksi"
          error={errors.transaction_date?.message}
          {...register('transaction_date')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
            rows={2}
            placeholder="Keterangan tambahan..."
            {...register('description')}
          />
        </div>

        {/* Sticky Action Buttons */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm pt-3 pb-1 -mx-4 -mb-4 px-4 sm:-mx-6 sm:-mb-6 sm:px-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="expense"
            size="sm"
            isLoading={isSubmitting}
            disabled={Boolean(isOverBudget)}
            leftIcon={<ArrowUpRight className="h-4 w-4" />}
            className="font-semibold shadow-md shadow-rose-500/20"
          >
            Simpan Pengeluaran
          </Button>
        </div>
      </form>
    </Modal>
  );
}
