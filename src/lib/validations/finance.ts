import { z } from 'zod';

export const incomeSchema = z.object({
  amount: z.number().min(1, 'Nominal harus lebih dari Rp 0'),
  title: z.string().min(1, 'Judul transaksi wajib diisi').max(100, 'Judul maksimal 100 karakter'),
  pocket_id: z.string().min(1, 'Kantong tujuan wajib dipilih'),
  category_id: z.string().min(1, 'Kategori wajib dipilih'),
  transaction_date: z.string().min(1, 'Tanggal transaksi wajib diisi'),
  description: z.string().optional().nullable(),
});

export const expenseSchema = z.object({
  amount: z.number().min(1, 'Nominal harus lebih dari Rp 0'),
  title: z.string().min(1, 'Judul transaksi wajib diisi').max(100, 'Judul maksimal 100 karakter'),
  pocket_id: z.string().min(1, 'Kantong sumber wajib dipilih'),
  category_id: z.string().min(1, 'Kategori wajib dipilih'),
  transaction_date: z.string().min(1, 'Tanggal transaksi wajib diisi'),
  description: z.string().optional().nullable(),
});

export const transferSchema = z
  .object({
    amount: z.number().min(1, 'Nominal harus lebih dari Rp 0'),
    title: z.string().min(1, 'Judul transfer wajib diisi').max(100, 'Judul maksimal 100 karakter'),
    from_pocket_id: z.string().min(1, 'Kantong asal wajib dipilih'),
    to_pocket_id: z.string().min(1, 'Kantong tujuan wajib dipilih'),
    transfer_date: z.string().min(1, 'Tanggal transfer wajib diisi'),
    description: z.string().optional().nullable(),
  })
  .refine((data) => data.from_pocket_id !== data.to_pocket_id, {
    message: 'Kantong asal dan kantong tujuan tidak boleh sama',
    path: ['to_pocket_id'],
  });

export const pocketSchema = z.object({
  name: z.string().min(1, 'Nama kantong wajib diisi').max(50, 'Nama maksimal 50 karakter'),
  description: z.string().optional().nullable(),
  icon: z.string().min(1, 'Icon wajib dipilih'),
  color: z.string().min(1, 'Warna wajib dipilih'),
  target_amount: z.number().min(0, 'Target tidak boleh negatif'),
  initial_balance: z.number().min(0, 'Saldo awal tidak boleh negatif'),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(50, 'Nama maksimal 50 karakter'),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(1, 'Icon wajib dipilih'),
  color: z.string().min(1, 'Warna wajib dipilih'),
});

export type IncomeFormData = {
  amount: number;
  title: string;
  pocket_id: string;
  category_id: string;
  transaction_date: string;
  description?: string | null;
};

export type ExpenseFormData = {
  amount: number;
  title: string;
  pocket_id: string;
  category_id: string;
  transaction_date: string;
  description?: string | null;
};

export type TransferFormData = {
  amount: number;
  title: string;
  from_pocket_id: string;
  to_pocket_id: string;
  transfer_date: string;
  description?: string | null;
};

export type PocketFormData = {
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  target_amount: number;
  initial_balance: number;
};

export type CategoryFormData = {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
};
