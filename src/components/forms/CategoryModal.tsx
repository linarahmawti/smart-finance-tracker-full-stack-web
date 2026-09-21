'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, CategoryFormData } from '@/lib/validations/finance';
import { useFinance } from '@/context/FinanceContext';
import { Category } from '@/types/finance';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { IconPicker } from '@/components/ui/IconPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Tag } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  defaultType?: 'income' | 'expense';
}

export function CategoryModal({
  isOpen,
  onClose,
  categoryToEdit,
  defaultType = 'expense',
}: CategoryModalProps) {
  const { createCategory, updateCategory } = useFinance();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = Boolean(categoryToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: defaultType,
      icon: 'Tag',
      color: '#64748B',
    },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  React.useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        reset({
          name: categoryToEdit.name,
          type: categoryToEdit.type,
          icon: categoryToEdit.icon || 'Tag',
          color: categoryToEdit.color || '#64748B',
        });
      } else {
        reset({
          name: '',
          type: defaultType,
          icon: 'Tag',
          color: '#64748B',
        });
      }
    }
  }, [isOpen, categoryToEdit, defaultType]);

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    let success = false;
    if (isEditing && categoryToEdit) {
      success = await updateCategory(categoryToEdit.id, data);
    } else {
      success = await createCategory(data);
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
      title={isEditing ? 'Edit Kategori' : 'Tambah Kategori Baru'}
      description="Buat kategori khusus untuk mengelompokkan pemasukan atau pengeluaran Anda."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tipe Kategori */}
        {!isEditing ? (
          <Select label="Tipe Kategori" error={errors.type?.message} {...register('type')}>
            <option value="expense">Pengeluaran (Expense)</option>
            <option value="income">Pemasukan (Income)</option>
          </Select>
        ) : (
          <div className="text-xs font-semibold text-zinc-500 uppercase">
            Tipe: {categoryToEdit?.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
          </div>
        )}

        {/* Nama Kategori */}
        <Input
          label="Nama Kategori"
          placeholder="Misal: Langganan SaaS, Kopi & Cafe"
          error={errors.name?.message}
          {...register('name')}
          autoFocus
        />

        {/* Color Picker */}
        <ColorPicker
          label="Pilih Warna Kategori"
          value={selectedColor}
          onChange={(color) => setValue('color', color)}
        />

        {/* Icon Picker */}
        <IconPicker
          label="Pilih Icon"
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
            leftIcon={<Tag className="h-4 w-4" />}
            className="font-semibold shadow-md shadow-blue-500/20"
          >
            {isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
