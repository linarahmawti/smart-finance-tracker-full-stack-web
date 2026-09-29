/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type PocketRow = Database['public']['Tables']['pockets']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type TransferRow = Database['public']['Tables']['transfers']['Row'];

type FinancePayload = {
  name?: string;
  description?: string | null;
  icon?: string;
  color?: string;
  type?: 'income' | 'expense';
  amount?: number | string;
  target_amount?: number | string;
  initial_balance?: number | string;
  pocket_id?: string;
  category_id?: string;
  from_pocket_id?: string;
  to_pocket_id?: string;
  title?: string;
  transaction_date?: string;
  transfer_date?: string;
};

const asNumber = (value: number | string | null | undefined): number => Number(value ?? 0);

export async function requireFinanceUser() {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { supabase, user };
}

export async function fetchFinanceDataForUser(userId: string) {
  const supabase = (await createClient()) as any;

  const [pocketsRes, categoriesRes, txRes, trRes] = await Promise.all([
    supabase.from('pockets').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('categories').select('*').eq('user_id', userId).order('name', { ascending: true }),
    supabase.from('transactions').select('*').eq('user_id', userId).order('transaction_date', { ascending: false }),
    supabase.from('transfers').select('*').eq('user_id', userId).order('transfer_date', { ascending: false }),
  ]);

  let pocketsData: PocketRow[] = (pocketsRes.data ?? []) as PocketRow[];
  let categoriesData: CategoryRow[] = (categoriesRes.data ?? []) as CategoryRow[];

  if (pocketsData.length === 0) {
    const defaultPockets: Omit<PocketRow, 'id' | 'created_at' | 'updated_at'>[] = [
      {
        user_id: userId,
        name: 'Dana Utama',
        description: 'Kantong utama alokasi dana',
        icon: 'Wallet',
        color: '#3B82F6',
        target_amount: 0,
        initial_balance: 0,
        is_default: true,
      },
      {
        user_id: userId,
        name: 'Dana Harian',
        description: 'Budget konsumsi & pengeluaran harian',
        icon: 'Utensils',
        color: '#10B981',
        target_amount: 0,
        initial_balance: 0,
        is_default: false,
      },
    ];

    const { data: insertedPockets } = await supabase
      .from('pockets')
      .insert(defaultPockets as Database['public']['Tables']['pockets']['Insert'][])
      .select();
    pocketsData = (insertedPockets ?? []) as PocketRow[];
  }

  if (categoriesData.length === 0) {
    const defaultCategories: Omit<CategoryRow, 'id' | 'created_at' | 'updated_at'>[] = [
      { user_id: userId, name: 'Gaji Pokok', type: 'income', icon: 'Briefcase', color: '#10B981', is_default: true },
      { user_id: userId, name: 'Bonus & Freelance', type: 'income', icon: 'Sparkles', color: '#3B82F6', is_default: false },
      { user_id: userId, name: 'Lainnya', type: 'income', icon: 'Coins', color: '#64748B', is_default: false },
      { user_id: userId, name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#F59E0B', is_default: true },
      { user_id: userId, name: 'Belanja Kebutuhan', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', is_default: false },
      { user_id: userId, name: 'Transportasi', type: 'expense', icon: 'Car', color: '#06B6D4', is_default: false },
      { user_id: userId, name: 'Tagihan & Utilities', type: 'expense', icon: 'Receipt', color: '#8B5CF6', is_default: false },
      { user_id: userId, name: 'Hiburan & Gaya Hidup', type: 'expense', icon: 'Gamepad2', color: '#F43F5E', is_default: false },
    ];

    const { data: insertedCategories } = await supabase
      .from('categories')
      .insert(defaultCategories as Database['public']['Tables']['categories']['Insert'][])
      .select();
    categoriesData = (insertedCategories ?? []) as CategoryRow[];
  }

  const uniquePockets: PocketRow[] = [];
  const seenPockets = new Set<string>();
  for (const pocket of pocketsData) {
    const key = String(pocket.name || '').trim().toLowerCase();
    if (!seenPockets.has(key)) {
      seenPockets.add(key);
      uniquePockets.push(pocket);
    }
  }

  const uniqueCategories: CategoryRow[] = [];
  const seenCategories = new Set<string>();
  for (const item of categoriesData) {
    const key = `${String(item.name || '').trim().toLowerCase()}_${item.type}`;
    if (!seenCategories.has(key)) {
      seenCategories.add(key);
      uniqueCategories.push(item);
    }
  }

  return {
    pockets: uniquePockets,
    categories: uniqueCategories,
    transactions: (txRes.data ?? []) as TransactionRow[],
    transfers: (trRes.data ?? []) as TransferRow[],
  };
}

export async function createPocketServer(userId: string, payload: FinancePayload) {
  if (!payload.name || String(payload.name).trim().length === 0) {
    throw new Error('Nama kantong wajib diisi');
  }

  const supabase = (await createClient()) as any;
  const { data, error } = await supabase
    .from('pockets')
    .insert({
      user_id: userId,
      name: payload.name,
      description: payload.description ?? null,
      icon: payload.icon || 'Wallet',
      color: payload.color || '#3B82F6',
      target_amount: asNumber(payload.target_amount),
      initial_balance: asNumber(payload.initial_balance),
      is_default: false,
    } as Database['public']['Tables']['pockets']['Insert'])
    .select()
    .single();

  if (error) throw error;
  return { pocket: data as PocketRow };
}

export async function updatePocketServer(userId: string, id: string, payload: FinancePayload) {
  const supabase = (await createClient()) as any;
  const { data, error } = await supabase
    .from('pockets')
    .update({
      name: payload.name,
      description: payload.description ?? null,
      icon: payload.icon || 'Wallet',
      color: payload.color || '#3B82F6',
      target_amount: asNumber(payload.target_amount),
      initial_balance: asNumber(payload.initial_balance),
      updated_at: new Date().toISOString(),
    } as Database['public']['Tables']['pockets']['Update'])
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return { pocket: data as PocketRow };
}

export async function deletePocketServer(userId: string, id: string) {
  const supabase = (await createClient()) as any;
  const { data: pocketData } = await supabase
    .from('pockets')
    .select('id, is_default')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();

  const { data: txData } = await supabase.from('transactions').select('id').eq('user_id', userId).eq('pocket_id', id);
  const { data: trData } = await supabase
    .from('transfers')
    .select('id')
    .or(`from_pocket_id.eq.${id},to_pocket_id.eq.${id}`)
    .eq('user_id', userId);

  if ((txData ?? []).length > 0 || (trData ?? []).length > 0) {
    throw new Error('Kantong tidak dapat dihapus karena masih memiliki riwayat transaksi/transfer.');
  }

  const { error } = await supabase.from('pockets').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;

  if (pocketData?.is_default) {
    const { data: nextPocket } = await supabase
      .from('pockets')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextPocket) {
      await supabase
        .from('pockets')
        .update({ is_default: true } as Database['public']['Tables']['pockets']['Update'])
        .eq('id', nextPocket.id)
        .eq('user_id', userId);
    }
  }

  return { success: true };
}

export async function createCategoryServer(userId: string, payload: FinancePayload) {
  if (!payload.name || String(payload.name).trim().length === 0) {
    throw new Error('Nama kategori wajib diisi');
  }

  const supabase = (await createClient()) as any;
  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: payload.name,
      type: payload.type || 'expense',
      icon: payload.icon || 'Tag',
      color: payload.color || '#64748B',
      is_default: false,
    } as Database['public']['Tables']['categories']['Insert'])
    .select()
    .single();

  if (error) throw error;
  return { category: data as CategoryRow };
}

export async function updateCategoryServer(userId: string, id: string, payload: FinancePayload) {
  const supabase = (await createClient()) as any;
  const { data, error } = await supabase
    .from('categories')
    .update({
      name: payload.name,
      icon: payload.icon || 'Tag',
      color: payload.color || '#64748B',
      updated_at: new Date().toISOString(),
    } as Database['public']['Tables']['categories']['Update'])
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return { category: data as CategoryRow };
}

export async function deleteCategoryServer(userId: string, id: string) {
  const supabase = (await createClient()) as any;
  const { data: txData } = await supabase.from('transactions').select('id').eq('user_id', userId).eq('category_id', id);
  if ((txData ?? []).length > 0) {
    throw new Error('Kategori tidak dapat dihapus karena telah digunakan pada riwayat transaksi.');
  }

  const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;

  return { success: true };
}

export async function createTransactionServer(userId: string, payload: FinancePayload) {
  const supabase = (await createClient()) as any;
  const amount = asNumber(payload.amount);
  const type = payload.type === 'expense' ? 'expense' : 'income';

  if (!payload.pocket_id || !payload.category_id) {
    throw new Error('Kantong dan kategori harus dipilih');
  }

  if (amount <= 0) {
    throw new Error('Nominal harus lebih besar dari 0');
  }

  if (type === 'expense') {
    const { data: pocket, error: pocketError } = await supabase
      .from('pockets')
      .select('id, name, initial_balance')
      .eq('user_id', userId)
      .eq('id', payload.pocket_id)
      .maybeSingle();

    if (pocketError || !pocket) throw new Error('Kantong sumber tidak ditemukan');

    const { data: txData } = await supabase
      .from('transactions')
      .select('amount, type, pocket_id')
      .eq('user_id', userId)
      .eq('pocket_id', payload.pocket_id);

    const { data: trData } = await supabase
      .from('transfers')
      .select('amount, from_pocket_id, to_pocket_id')
      .eq('user_id', userId);

    let balance = asNumber((pocket as PocketRow).initial_balance);
    const txRows = (txData ?? []) as TransactionRow[];
    const transferRows = (trData ?? []) as TransferRow[];

    for (const tx of txRows) {
      balance += tx.type === 'income' ? asNumber(tx.amount) : -asNumber(tx.amount);
    }
    for (const transfer of transferRows) {
      if (transfer.from_pocket_id === payload.pocket_id) balance -= asNumber(transfer.amount);
      if (transfer.to_pocket_id === payload.pocket_id) balance += asNumber(transfer.amount);
    }

    if (amount > balance) {
      throw new Error(`Saldo ${(pocket as PocketRow).name} tidak mencukupi untuk pengeluaran ini`);
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      pocket_id: payload.pocket_id,
      category_id: payload.category_id,
      type,
      amount,
      title: payload.title || 'Transaksi baru',
      description: payload.description ?? null,
      transaction_date: payload.transaction_date,
    } as Database['public']['Tables']['transactions']['Insert'])
    .select()
    .single();

  if (error) throw error;
  return { transaction: data as TransactionRow };
}

export async function updateTransactionServer(userId: string, id: string, payload: FinancePayload) {
  const supabase = (await createClient()) as any;
  const { data, error } = await supabase
    .from('transactions')
    .update({
      pocket_id: payload.pocket_id,
      category_id: payload.category_id,
      amount: asNumber(payload.amount),
      title: payload.title || 'Transaksi baru',
      description: payload.description ?? null,
      transaction_date: payload.transaction_date,
      updated_at: new Date().toISOString(),
    } as Database['public']['Tables']['transactions']['Update'])
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return { transaction: data as TransactionRow };
}

export async function deleteTransactionServer(userId: string, id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
  return { success: true };
}

export async function createTransferServer(userId: string, payload: FinancePayload) {
  if (!payload.from_pocket_id || !payload.to_pocket_id) {
    throw new Error('Kantong asal dan tujuan harus dipilih');
  }

  if (payload.from_pocket_id === payload.to_pocket_id) {
    throw new Error('Kantong asal dan tujuan tidak boleh sama');
  }

  const amount = asNumber(payload.amount);
  if (amount <= 0) {
    throw new Error('Nominal transfer harus lebih besar dari 0');
  }

  const supabase = (await createClient()) as any;

  const { data: fromPocket, error: fromError } = await supabase
    .from('pockets')
    .select('id, name, initial_balance')
    .eq('user_id', userId)
    .eq('id', payload.from_pocket_id)
    .maybeSingle();

  if (fromError || !fromPocket) throw new Error('Kantong asal tidak ditemukan');

  const { data: txData } = await supabase
    .from('transactions')
    .select('amount, type, pocket_id')
    .eq('user_id', userId)
    .eq('pocket_id', payload.from_pocket_id);

  const { data: trData } = await supabase
    .from('transfers')
    .select('amount, from_pocket_id, to_pocket_id')
    .eq('user_id', userId);

  let balance = asNumber((fromPocket as PocketRow).initial_balance);
  const txRows = (txData ?? []) as TransactionRow[];
  const transferRows = (trData ?? []) as TransferRow[];

  for (const tx of txRows) {
    balance += tx.type === 'income' ? asNumber(tx.amount) : -asNumber(tx.amount);
  }
  for (const transfer of transferRows) {
    if (transfer.from_pocket_id === payload.from_pocket_id) balance -= asNumber(transfer.amount);
    if (transfer.to_pocket_id === payload.from_pocket_id) balance += asNumber(transfer.amount);
  }

  if (amount > balance) {
    throw new Error(`Saldo ${(fromPocket as PocketRow).name} tidak mencukupi untuk transfer ini`);
  }

  const { data, error } = await supabase
    .from('transfers')
    .insert({
      user_id: userId,
      from_pocket_id: payload.from_pocket_id,
      to_pocket_id: payload.to_pocket_id,
      amount,
      title: payload.title || 'Transfer Dana',
      description: payload.description ?? null,
      transfer_date: payload.transfer_date,
    } as Database['public']['Tables']['transfers']['Insert'])
    .select()
    .single();

  if (error) throw error;
  return { transfer: data as TransferRow };
}

export async function deleteTransferServer(userId: string, id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from('transfers').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
  return { success: true };
}
