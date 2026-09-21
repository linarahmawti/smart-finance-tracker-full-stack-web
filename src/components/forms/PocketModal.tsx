'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pocketSchema, PocketFormData } from '@/lib/validations/finance';
import { useFinance } from '@/context/FinanceContext';
import { Pocket, PocketWithBalance } from '@/types/finance';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RupiahInput } from '@/components/ui/RupiahInput';
import { IconPicker } from '@/components/ui/IconPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Wallet, PiggyBank } from 'lucide-react';

interface PocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  pocketToEdit?: Pocket | PocketWithBalance | null;
}

export function PocketModal({ isOpen, onClose, pocketToEdit }: PocketModalProps) {
  const { createPocket, updatePocket } = useFinance();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = Boolean(pocketToEdit);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PocketFormData>({
    resolver: zodResolver(pocketSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Wallet',
      color: '#3B82F6',
      target_amount: 0,
      initial_balance: 0,
    },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  React.useEffect(() => {
    if (isOpen) {
      if (pocketToEdit) {
        const displayBalance =
          'current_balance' in pocketToEdit
            ? pocketToEdit.current_balance
            : Number(pocketToEdit.initial_balance || 0);

        reset({
          name: pocketToEdit.name,
          description: pocketToEdit.description || '',
          icon: pocketToEdit.icon || 'Wallet',
          color: pocketToEdit.color || '#3B82F6',
          target_amount: Number(pocketToEdit.target_amount || 0),
          initial_balance: Math.max(0, displayBalance),
        });
      } else {
        reset({
          name: '',
          description: '',
          icon: 'Wallet',
          color: '#3B82F6',
          target_amount: 0,
          initial_balance: 0,
        });
      }
    }
  }, [isOpen, pocketToEdit, reset]);

  const onSubmit = async (data: PocketFormData) => {
    setIsSubmitting(true);
    let success = false;
    if (isEditing && pocketToEdit) {
      let finalInitialBalance = Number(data.initial_balance || 0);
      if ('current_balance' in pocketToEdit) {
        const netActivity = pocketToEdit.current_balance - Number(pocketToEdit.initial_balance || 0);
        finalInitialBalance = Number(data.initial_balance || 0) - netActivity;
      }

      success = await updatePocket(pocketToEdit.id, {
        ...data,
        initial_balance: finalInitialBalance,
      });
    } else {
      success = await createPocket(data);
    }
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Kantong Dana' : 'Buat Kantong Dana Baru'}
      description={
        isEditing
          ? 'Perbarui rincian, nominal saldo, atau target kantong ini.'
          : 'Alokasikan pos uang baru untuk mengatur keuangan.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Nama Kantong & Deskripsi */}
        <Input
          label="Nama Kantong"
          placeholder="Contoh: Tabungan Laptop, Dana Liburan"
          error={errors.name?.message}
          {...register('name')}
          autoFocus
        />

        <Input
          label="Deskripsi (Opsional)"
          placeholder="Tujuan atau catatan alokasi kantong ini"
          error={errors.description?.message}
          {...register('description')}
        />

        {/* Target Amount & Initial Balance in 2 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Controller
            name="target_amount"
            control={control}
            render={({ field }) => (
              <RupiahInput
                label="Target Menabung (Opsional)"
                value={field.value}
                onChange={field.onChange}
                placeholder="0"
              />
            )}
          />

          <Controller
            name="initial_balance"
            control={control}
            render={({ field }) => (
              <RupiahInput
                label={isEditing ? 'Saldo Kantong Saat Ini' : 'Saldo Awal Kantong'}
                value={field.value}
                onChange={field.onChange}
                placeholder="0"
              />
            )}
          />
        </div>

        {/* Info Hint Banner for Savings & Dashboard */}
        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 p-3 text-xs dark:border-violet-900/50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-indigo-950/40">
          <div className="flex items-start gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm mt-0.5">
              <PiggyBank className="h-3.5 w-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="font-bold text-violet-900 dark:text-violet-200">
                💡 Petunjuk Akumulasi Menabung
              </div>
              <p className="text-[11px] text-violet-700 dark:text-violet-300 leading-snug">
                Kantong yang memiliki <strong className="font-semibold text-violet-900 dark:text-violet-100">Target Menabung</strong> (atau ikon <strong className="font-semibold text-violet-900 dark:text-violet-100">PiggyBank 🐷 / Target 🎯</strong>) akan secara otomatis ditandai sebagai <strong>Kantong Tabungan</strong>. Saldo di kantong ini akan langsung diakumulasikan ke card <strong className="font-semibold text-violet-900 dark:text-violet-100">"Total Ditabung"</strong> di Dashboard!
              </p>
            </div>
          </div>
        </div>

        {/* Color Picker */}
        <ColorPicker
          label="Pilih Warna Kantong"
          value={selectedColor}
          onChange={(color) => setValue('color', color)}
        />

        {/* Compact Icon Picker */}
        <IconPicker
          label="Pilih Icon Kantong"
          value={selectedIcon}
          onChange={(icon) => setValue('icon', icon)}
        />

        {/* Sticky Action Buttons */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm pt-3 pb-1 -mx-4 -mb-4 px-4 sm:-mx-6 sm:-mb-6 sm:px-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Wallet className="h-4 w-4" />}
            className="font-semibold shadow-md shadow-blue-500/20"
          >
            {isEditing ? 'Simpan Perubahan' : 'Buat Kantong'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
