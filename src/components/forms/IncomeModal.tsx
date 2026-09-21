'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeSchema, IncomeFormData } from '@/lib/validations/finance';
import { useFinance } from '@/context/FinanceContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RupiahInput } from '@/components/ui/RupiahInput';
import { Select } from '@/components/ui/Select';
import { ArrowDownLeft } from 'lucide-react';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPocketId?: string;
}

export function IncomeModal({ isOpen, onClose, defaultPocketId }: IncomeModalProps) {
  const { pockets, categories, addIncome } = useFinance();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const incomeCategories = React.useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories]
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: 0,
      title: '',
      pocket_id: defaultPocketId || pockets[0]?.id || '',
      category_id: incomeCategories[0]?.id || '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        amount: 0,
        title: '',
        pocket_id: defaultPocketId || pockets[0]?.id || '',
        category_id: incomeCategories[0]?.id || '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  }, [isOpen, defaultPocketId]); // Only trigger on open state change

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true);
    const success = await addIncome(data);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Pemasukan"
      description="Tambahkan pemasukan baru ke kantong dana yang dipilih."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nominal */}
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <RupiahInput
              label="Nominal Pemasukan"
              value={field.value}
              onChange={field.onChange}
              error={errors.amount?.message}
              placeholder="Contoh: 5.000.000"
              autoFocus
            />
          )}
        />

        {/* Judul Transaksi */}
        <Input
          label="Judul Transaksi"
          placeholder="Misal: Gaji Bulanan, Freelance Web App"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Kantong Tujuan & Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Masuk ke Kantong"
            error={errors.pocket_id?.message}
            {...register('pocket_id')}
          >
            {pockets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Select
            label="Kategori"
            error={errors.category_id?.message}
            {...register('category_id')}
          >
            {incomeCategories.length === 0 ? (
              <option value="">(Belum ada kategori pemasukan)</option>
            ) : (
              incomeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </Select>
        </div>

        {/* Tanggal & Deskripsi */}
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
            variant="income"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<ArrowDownLeft className="h-4 w-4" />}
            className="font-semibold shadow-md shadow-emerald-500/20"
          >
            Simpan Pemasukan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
