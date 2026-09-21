'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Pocket,
  Category,
  Transaction,
  Transfer,
  PocketWithBalance,
  UnifiedActivity,
  FinancialSummary,
  PeriodFilter,
} from '@/types/finance';
import {
  IncomeFormData,
  ExpenseFormData,
  TransferFormData,
  PocketFormData,
  CategoryFormData,
} from '@/lib/validations/finance';
import { toast } from 'sonner';
import { isInPeriod } from '@/lib/dateUtils';

interface FinanceContextType {
  pockets: PocketWithBalance[];
  categories: Category[];
  transactions: Transaction[];
  transfers: Transfer[];
  unifiedActivities: UnifiedActivity[];
  summary: FinancialSummary;
  period: PeriodFilter;
  setPeriod: (period: PeriodFilter) => void;
  isInPeriod: (dateStr: string, filter: PeriodFilter) => boolean;
  isLoading: boolean;
  isLiveSupabase: boolean;
  user: { id: string; email?: string; name?: string } | null;
  
  // Actions
  addIncome: (data: IncomeFormData) => Promise<boolean>;
  addExpense: (data: ExpenseFormData) => Promise<boolean>;
  addTransfer: (data: TransferFormData) => Promise<boolean>;
  updateTransaction: (id: string, data: IncomeFormData | ExpenseFormData) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  deleteTransfer: (id: string) => Promise<boolean>;
  createPocket: (data: PocketFormData) => Promise<boolean>;
  updatePocket: (id: string, data: PocketFormData) => Promise<boolean>;
  deletePocket: (id: string) => Promise<boolean>;
  createCategory: (data: CategoryFormData) => Promise<boolean>;
  updateCategory: (id: string, data: CategoryFormData) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  getPocketById: (id: string) => PocketWithBalance | undefined;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null);
  const [isLiveSupabase, setIsLiveSupabase] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Local storage / state backing
  const [rawPockets, setRawPockets] = useState<Pocket[]>([]);
  const [rawCategories, setRawCategories] = useState<Category[]>([]);
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [rawTransfers, setRawTransfers] = useState<Transfer[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('this_month');

  // Load Initial Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check auth status
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;

      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0],
        });
        setIsLiveSupabase(true);

        // Fetch from Supabase filtered specifically by current user's ID
        const [pocketsRes, catRes, txRes, trRes] = await Promise.all([
          supabase
            .from('pockets')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('categories')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('name', { ascending: true }),
          supabase
            .from('transactions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('transaction_date', { ascending: false }),
          supabase
            .from('transfers')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('transfer_date', { ascending: false }),
        ]);

        let pocketsData = (pocketsRes.data as Pocket[]) || [];
        let categoriesData = (catRes.data as Category[]) || [];

        // Auto-seed default pockets if account has no pockets
        if (pocketsData.length === 0) {
          const defaultPockets = [
            {
              user_id: currentUser.id,
              name: 'Dana Utama',
              description: 'Kantong utama alokasi dana',
              icon: 'Wallet',
              color: '#3B82F6',
              target_amount: 0,
              initial_balance: 0,
              is_default: true,
            },
            {
              user_id: currentUser.id,
              name: 'Dana Harian',
              description: 'Budget konsumsi & pengeluaran harian',
              icon: 'Utensils',
              color: '#10B981',
              target_amount: 0,
              initial_balance: 0,
              is_default: false,
            },
          ];

          const { data: insertedPockets } = await (supabase.from('pockets') as any)
            .insert(defaultPockets)
            .select();

          if (insertedPockets) pocketsData = insertedPockets as Pocket[];
        }

        // Auto-seed default categories if account has no categories
        if (categoriesData.length === 0) {
          const defaultCategories = [
            { user_id: currentUser.id, name: 'Gaji Pokok', type: 'income', icon: 'Briefcase', color: '#10B981', is_default: true },
            { user_id: currentUser.id, name: 'Bonus & Freelance', type: 'income', icon: 'Sparkles', color: '#3B82F6', is_default: false },
            { user_id: currentUser.id, name: 'Lainnya', type: 'income', icon: 'Coins', color: '#64748B', is_default: false },
            { user_id: currentUser.id, name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#F59E0B', is_default: true },
            { user_id: currentUser.id, name: 'Belanja Kebutuhan', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', is_default: false },
            { user_id: currentUser.id, name: 'Transportasi', type: 'expense', icon: 'Car', color: '#06B6D4', is_default: false },
            { user_id: currentUser.id, name: 'Tagihan & Utilities', type: 'expense', icon: 'Receipt', color: '#8B5CF6', is_default: false },
            { user_id: currentUser.id, name: 'Hiburan & Gaya Hidup', type: 'expense', icon: 'Gamepad2', color: '#F43F5E', is_default: false },
          ];

          const { data: insertedCategories } = await (supabase.from('categories') as any)
            .insert(defaultCategories)
            .select();

          if (insertedCategories) categoriesData = insertedCategories as Category[];
        }

        // Deduplicate duplicate pockets by name if any exist from earlier auto-seeds
        const uniquePockets: Pocket[] = [];
        const seenNames = new Set<string>();
        for (const p of pocketsData) {
          if (!seenNames.has(p.name)) {
            seenNames.add(p.name);
            uniquePockets.push(p);
          }
        }

        setRawPockets(uniquePockets);
        setRawCategories(categoriesData);
        setRawTransactions((txRes.data as Transaction[]) || []);
        setRawTransfers((trRes.data as Transfer[]) || []);
      } else {
        // Standalone Local Mode
        setUser({
          id: 'local-user',
          email: 'user@aloka.app',
          name: 'Wahyu',
        });
        setIsLiveSupabase(false);

        // Load from LocalStorage
        const localPockets = localStorage.getItem('aloka_pockets');
        const localCategories = localStorage.getItem('aloka_categories');
        const localTransactions = localStorage.getItem('aloka_transactions');
        const localTransfers = localStorage.getItem('aloka_transfers');

        setRawPockets(localPockets ? JSON.parse(localPockets) : []);
        setRawCategories(localCategories ? JSON.parse(localCategories) : []);
        setRawTransactions(localTransactions ? JSON.parse(localTransactions) : []);
        setRawTransfers(localTransfers ? JSON.parse(localTransfers) : []);
      }
    } catch (err) {
      console.error('Error loading finance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadData();
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadData, supabase]);

  // Sync to LocalStorage when in local mode
  const syncLocal = (
    newPockets?: Pocket[],
    newCategories?: Category[],
    newTx?: Transaction[],
    newTr?: Transfer[]
  ) => {
    if (!isLiveSupabase && typeof window !== 'undefined') {
      if (newPockets !== undefined) localStorage.setItem('aloka_pockets', JSON.stringify(newPockets));
      if (newCategories !== undefined) localStorage.setItem('aloka_categories', JSON.stringify(newCategories));
      if (newTx !== undefined) localStorage.setItem('aloka_transactions', JSON.stringify(newTx));
      if (newTr !== undefined) localStorage.setItem('aloka_transfers', JSON.stringify(newTr));
    }
  };

  // Calculate Pocket Balances accurately
  const pockets = useMemo<PocketWithBalance[]>(() => {
    const defaultTargetPocket = rawPockets.find((p) => p.is_default) || rawPockets[0];

    return rawPockets.map((pocket) => {
      let incomeSum = 0;
      let expenseSum = 0;
      let transferInSum = 0;
      let transferOutSum = 0;
      let txCount = 0;

      rawTransactions.forEach((tx) => {
        const pocketExists = rawPockets.some((p) => p.id === tx.pocket_id);
        const matchesPocket = tx.pocket_id === pocket.id || (!pocketExists && pocket.id === defaultTargetPocket?.id);

        if (matchesPocket) {
          txCount++;
          if (tx.type === 'income') {
            incomeSum += Number(tx.amount);
          } else if (tx.type === 'expense') {
            expenseSum += Number(tx.amount);
          }
        }
      });

      rawTransfers.forEach((tr) => {
        if (tr.to_pocket_id === pocket.id) {
          transferInSum += Number(tr.amount);
          txCount++;
        }
        if (tr.from_pocket_id === pocket.id) {
          transferOutSum += Number(tr.amount);
          txCount++;
        }
      });

      const current_balance =
        Number(pocket.initial_balance || 0) +
        incomeSum +
        transferInSum -
        expenseSum -
        transferOutSum;

      const progress_percentage =
        pocket.target_amount && Number(pocket.target_amount) > 0
          ? Math.min(100, Math.round((current_balance / Number(pocket.target_amount)) * 100))
          : 0;

      return {
        ...pocket,
        current_balance,
        total_income: incomeSum,
        total_expense: expenseSum,
        total_transfers_in: transferInSum,
        total_transfers_out: transferOutSum,
        transaction_count: txCount,
        progress_percentage,
      };
    });
  }, [rawPockets, rawTransactions, rawTransfers]);



  // Filtered Summary
  const summary = useMemo<FinancialSummary>(() => {
    const total_balance = pockets.reduce((sum, p) => sum + p.current_balance, 0);

    let total_income = 0;
    let total_expense = 0;

    rawTransactions.forEach((tx) => {
      if (isInPeriod(tx.transaction_date, period)) {
        if (tx.type === 'income') {
          total_income += Number(tx.amount);
        } else if (tx.type === 'expense') {
          total_expense += Number(tx.amount);
        }
      }
    });

    // Kantong dianggap sebagai kantong tabungan/target jika:
    // 1. Memiliki target nominal (target_amount > 0)
    // 2. Icon-nya 'PiggyBank' atau 'Target'
    // 3. Namanya mengandung kata 'tabungan', 'target', atau 'simpanan'
    const isSavingPocket = (p: PocketWithBalance) => {
      const targetAmt = Number(p.target_amount || 0);
      if (targetAmt > 0) return true;
      if (p.icon === 'PiggyBank' || p.icon === 'Target') return true;
      const nameLower = (p.name || '').toLowerCase();
      return (
        nameLower.includes('tabungan') ||
        nameLower.includes('target') ||
        nameLower.includes('simpanan')
      );
    };

    // Total Ditabung = total saldo berjalan di seluruh kantong tabungan/target
    const total_saved = pockets
      .filter(isSavingPocket)
      .reduce((sum, p) => sum + Math.max(0, p.current_balance), 0);

    const net_savings_rate = total_income > 0 ? Math.round(((total_income - total_expense) / total_income) * 100) : 0;

    return {
      total_balance,
      total_income,
      total_expense,
      total_saved,
      net_savings_rate,
    };
  }, [pockets, rawTransactions, period, isInPeriod]);

  // Unified Chronological Activity List
  const unifiedActivities = useMemo<UnifiedActivity[]>(() => {
    const list: UnifiedActivity[] = [];
    const defaultPocket = rawPockets.find((p) => p.is_default) || rawPockets[0];

    rawTransactions.forEach((tx) => {
      const pocket = rawPockets.find((p) => p.id === tx.pocket_id) || defaultPocket;
      const cat = rawCategories.find((c) => c.id === tx.category_id);

      list.push({
        id: tx.id,
        type: tx.type,
        title: tx.title,
        description: tx.description,
        amount: Number(tx.amount),
        date: tx.transaction_date,
        created_at: tx.created_at,
        pocket_id: tx.pocket_id,
        pocket_name: pocket?.name || 'Dana Utama',
        pocket_color: pocket?.color || '#3B82F6',
        pocket_icon: pocket?.icon || 'Wallet',
        category_id: tx.category_id,
        category_name: cat?.name || 'Kategori',
        category_color: cat?.color || '#64748B',
        category_icon: cat?.icon || 'Tag',
      });
    });

    rawTransfers.forEach((tr) => {
      const fromPocket = rawPockets.find((p) => p.id === tr.from_pocket_id);
      const toPocket = rawPockets.find((p) => p.id === tr.to_pocket_id);

      list.push({
        id: tr.id,
        type: 'transfer',
        title: tr.title || `Transfer ke ${toPocket?.name || 'Kantong'}`,
        description: tr.description,
        amount: Number(tr.amount),
        date: tr.transfer_date,
        created_at: tr.created_at,
        from_pocket_id: tr.from_pocket_id,
        from_pocket_name: fromPocket?.name || 'Asal',
        to_pocket_id: tr.to_pocket_id,
        to_pocket_name: toPocket?.name || 'Tujuan',
        pocket_color: toPocket?.color || '#8B5CF6',
        pocket_icon: 'ArrowRightLeft',
      });
    });

    return list.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [rawTransactions, rawTransfers, rawPockets, rawCategories]);

  const getPocketById = useCallback(
    (id: string) => {
      return pockets.find((p) => p.id === id);
    },
    [pockets]
  );

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------

  const addIncome = async (data: IncomeFormData): Promise<boolean> => {
    try {
      const newTx: Transaction = {
        id: isLiveSupabase ? '' : `tx-${Date.now()}`,
        user_id: user?.id || 'local-user',
        pocket_id: data.pocket_id,
        category_id: data.category_id,
        type: 'income',
        amount: Number(data.amount),
        title: data.title,
        description: data.description || null,
        transaction_date: data.transaction_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isLiveSupabase) {
        const { data: inserted, error } = await (supabase
          .from('transactions') as any)
          .insert({
            user_id: newTx.user_id,
            pocket_id: newTx.pocket_id,
            category_id: newTx.category_id,
            type: 'income',
            amount: newTx.amount,
            title: newTx.title,
            description: newTx.description,
            transaction_date: newTx.transaction_date,
          })
          .select()
          .single();

        if (error) throw error;
        setRawTransactions((prev) => [inserted as Transaction, ...prev]);
      } else {
        const updated = [newTx, ...rawTransactions];
        setRawTransactions(updated);
        syncLocal(undefined, undefined, updated, undefined);
      }

      toast.success('Pemasukan berhasil dicatat!');
      return true;
    } catch (err: unknown) {
      console.error('Error adding income:', err);
      toast.error(err instanceof Error ? err.message : 'Gagal mencatat pemasukan');
      return false;
    }
  };

  const addExpense = async (data: ExpenseFormData): Promise<boolean> => {
    try {
      const sourcePocket = getPocketById(data.pocket_id);
      if (!sourcePocket) {
        toast.error('Kantong sumber tidak ditemukan');
        return false;
      }

      if (Number(data.amount) > sourcePocket.current_balance) {
        toast.error(
          `Saldo ${sourcePocket.name} tidak mencukupi! (Saldo: Rp ${new Intl.NumberFormat('id-ID').format(
            sourcePocket.current_balance
          )})`
        );
        return false;
      }

      const newTx: Transaction = {
        id: isLiveSupabase ? '' : `tx-${Date.now()}`,
        user_id: user?.id || 'local-user',
        pocket_id: data.pocket_id,
        category_id: data.category_id,
        type: 'expense',
        amount: Number(data.amount),
        title: data.title,
        description: data.description || null,
        transaction_date: data.transaction_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isLiveSupabase) {
        const { data: inserted, error } = await (supabase
          .from('transactions') as any)
          .insert({
            user_id: newTx.user_id,
            pocket_id: newTx.pocket_id,
            category_id: newTx.category_id,
            type: 'expense',
            amount: newTx.amount,
            title: newTx.title,
            description: newTx.description,
            transaction_date: newTx.transaction_date,
          })
          .select()
          .single();

        if (error) throw error;
        setRawTransactions((prev) => [inserted as Transaction, ...prev]);
      } else {
        const updated = [newTx, ...rawTransactions];
        setRawTransactions(updated);
        syncLocal(undefined, undefined, updated, undefined);
      }

      toast.success('Pengeluaran berhasil dicatat!');
      return true;
    } catch (err: unknown) {
      console.error('Error adding expense:', err);
      toast.error(err instanceof Error ? err.message : 'Gagal mencatat pengeluaran');
      return false;
    }
  };

  const addTransfer = async (data: TransferFormData): Promise<boolean> => {
    try {
      if (data.from_pocket_id === data.to_pocket_id) {
        toast.error('Kantong asal dan tujuan tidak boleh sama!');
        return false;
      }

      const fromPocket = getPocketById(data.from_pocket_id);
      if (!fromPocket) {
        toast.error('Kantong asal tidak ditemukan');
        return false;
      }

      if (Number(data.amount) > fromPocket.current_balance) {
        toast.error(
          `Saldo ${fromPocket.name} tidak mencukupi untuk transfer! (Saldo: Rp ${new Intl.NumberFormat(
            'id-ID'
          ).format(fromPocket.current_balance)})`
        );
        return false;
      }

      const newTransfer: Transfer = {
        id: isLiveSupabase ? '' : `tr-${Date.now()}`,
        user_id: user?.id || 'local-user',
        from_pocket_id: data.from_pocket_id,
        to_pocket_id: data.to_pocket_id,
        amount: Number(data.amount),
        title: data.title,
        description: data.description || null,
        transfer_date: data.transfer_date,
        created_at: new Date().toISOString(),
      };

      if (isLiveSupabase) {
        const { data: inserted, error } = await (supabase
          .from('transfers') as any)
          .insert({
            user_id: newTransfer.user_id,
            from_pocket_id: newTransfer.from_pocket_id,
            to_pocket_id: newTransfer.to_pocket_id,
            amount: newTransfer.amount,
            title: newTransfer.title,
            description: newTransfer.description,
            transfer_date: newTransfer.transfer_date,
          })
          .select()
          .single();

        if (error) throw error;
        setRawTransfers((prev) => [inserted as Transfer, ...prev]);
      } else {
        const updated = [newTransfer, ...rawTransfers];
        setRawTransfers(updated);
        syncLocal(undefined, undefined, undefined, updated);
      }

      toast.success('Transfer / Tabungan berhasil!');
      return true;
    } catch (err: unknown) {
      console.error('Error adding transfer:', err);
      toast.error(err instanceof Error ? err.message : 'Gagal melakukan transfer');
      return false;
    }
  };

  const updateTransaction = async (
    id: string,
    data: IncomeFormData | ExpenseFormData
  ): Promise<boolean> => {
    try {
      if (isLiveSupabase && user) {
        const { data: updated, error } = await (supabase
          .from('transactions') as any)
          .update({
            pocket_id: data.pocket_id,
            category_id: data.category_id,
            amount: Number(data.amount),
            title: data.title,
            description: data.description || null,
            transaction_date: data.transaction_date,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setRawTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? (updated as Transaction) : tx))
        );
      } else {
        const updated = rawTransactions.map((tx) =>
          tx.id === id
            ? {
                ...tx,
                pocket_id: data.pocket_id,
                category_id: data.category_id,
                amount: Number(data.amount),
                title: data.title,
                description: data.description || null,
                transaction_date: data.transaction_date,
                updated_at: new Date().toISOString(),
              }
            : tx
        );
        setRawTransactions(updated);
        syncLocal(undefined, undefined, updated, undefined);
      }

      toast.success('Transaksi berhasil diperbarui!');
      return true;
    } catch (err: unknown) {
      console.error('Error updating transaction:', err);
      toast.error('Gagal memperbarui transaksi');
      return false;
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      if (isLiveSupabase && user) {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setRawTransactions((prev) => prev.filter((tx) => tx.id !== id));
      } else {
        const updated = rawTransactions.filter((tx) => tx.id !== id);
        setRawTransactions(updated);
        syncLocal(undefined, undefined, updated, undefined);
      }

      toast.success('Transaksi berhasil dihapus');
      return true;
    } catch (err: unknown) {
      console.error('Error deleting transaction:', err);
      toast.error('Gagal menghapus transaksi');
      return false;
    }
  };

  const deleteTransfer = async (id: string): Promise<boolean> => {
    try {
      if (isLiveSupabase && user) {
        const { error } = await supabase
          .from('transfers')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setRawTransfers((prev) => prev.filter((tr) => tr.id !== id));
      } else {
        const updated = rawTransfers.filter((tr) => tr.id !== id);
        setRawTransfers(updated);
        syncLocal(undefined, undefined, undefined, updated);
      }

      toast.success('Transfer berhasil dihapus');
      return true;
    } catch (err: unknown) {
      console.error('Error deleting transfer:', err);
      toast.error('Gagal menghapus transfer');
      return false;
    }
  };

  const createPocket = async (data: PocketFormData): Promise<boolean> => {
    try {
      const newPocket: Pocket = {
        id: isLiveSupabase ? '' : `pocket-${Date.now()}`,
        user_id: user?.id || 'local-user',
        name: data.name,
        description: data.description || null,
        icon: data.icon || 'Wallet',
        color: data.color || '#3B82F6',
        target_amount: Number(data.target_amount || 0),
        initial_balance: Number(data.initial_balance || 0),
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isLiveSupabase && user) {
        const { data: inserted, error } = await (supabase
          .from('pockets') as any)
          .insert({
            user_id: user.id,
            name: newPocket.name,
            description: newPocket.description,
            icon: newPocket.icon,
            color: newPocket.color,
            target_amount: newPocket.target_amount,
            initial_balance: newPocket.initial_balance,
            is_default: false,
          })
          .select()
          .single();

        if (error) throw error;
        setRawPockets((prev) => [...prev, inserted as Pocket]);
      } else {
        const updated = [...rawPockets, newPocket];
        setRawPockets(updated);
        syncLocal(updated, undefined, undefined, undefined);
      }

      toast.success(`Kantong "${data.name}" berhasil dibuat!`);
      return true;
    } catch (err: unknown) {
      console.error('Error creating pocket:', err);
      toast.error('Gagal membuat kantong dana');
      return false;
    }
  };

  const updatePocket = async (id: string, data: PocketFormData): Promise<boolean> => {
    try {
      if (isLiveSupabase && user) {
        const { data: updated, error } = await (supabase
          .from('pockets') as any)
          .update({
            name: data.name,
            description: data.description || null,
            icon: data.icon,
            color: data.color,
            target_amount: Number(data.target_amount || 0),
            initial_balance: Number(data.initial_balance || 0),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setRawPockets((prev) => prev.map((p) => (p.id === id ? (updated as Pocket) : p)));
      } else {
        const updated = rawPockets.map((p) =>
          p.id === id
            ? {
                ...p,
                name: data.name,
                description: data.description || null,
                icon: data.icon,
                color: data.color,
                target_amount: Number(data.target_amount || 0),
                initial_balance: Number(data.initial_balance || 0),
                updated_at: new Date().toISOString(),
              }
            : p
        );
        setRawPockets(updated);
        syncLocal(updated, undefined, undefined, undefined);
      }

      toast.success('Kantong dana berhasil diperbarui');
      return true;
    } catch (err: unknown) {
      console.error('Error updating pocket:', err);
      toast.error('Gagal memperbarui kantong');
      return false;
    }
  };

  const deletePocket = async (id: string): Promise<boolean> => {
    try {
      if (rawPockets.length <= 1) {
        toast.error('Tidak dapat menghapus! Minimal harus menyisakan 1 kantong dana.');
        return false;
      }

      const pocket = rawPockets.find((p) => p.id === id);

      const hasTx = rawTransactions.some((tx) => tx.pocket_id === id);
      const hasTr = rawTransfers.some((tr) => tr.from_pocket_id === id || tr.to_pocket_id === id);

      if (hasTx || hasTr) {
        toast.error('Kantong tidak dapat dihapus karena masih memiliki riwayat transaksi/transfer!');
        return false;
      }

      const isDeletingDefault = Boolean(pocket?.is_default);

      if (isLiveSupabase && user) {
        const { error } = await supabase
          .from('pockets')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;

        let nextPockets = rawPockets.filter((p) => p.id !== id);

        if (isDeletingDefault && nextPockets.length > 0) {
          const nextDefault = { ...nextPockets[0], is_default: true };
          nextPockets = [nextDefault, ...nextPockets.slice(1)];
          await (supabase.from('pockets') as any)
            .update({ is_default: true })
            .eq('id', nextDefault.id);
        }

        setRawPockets(nextPockets);
      } else {
        let updated = rawPockets.filter((p) => p.id !== id);
        if (isDeletingDefault && updated.length > 0) {
          updated[0] = { ...updated[0], is_default: true };
        }
        setRawPockets(updated);
        syncLocal(updated, undefined, undefined, undefined);
      }

      toast.success('Kantong berhasil dihapus');
      return true;
    } catch (err: unknown) {
      console.error('Error deleting pocket:', err);
      toast.error('Gagal menghapus kantong dana');
      return false;
    }
  };

  const createCategory = async (data: CategoryFormData): Promise<boolean> => {
    try {
      const newCat: Category = {
        id: isLiveSupabase ? '' : `cat-${Date.now()}`,
        user_id: user?.id || 'local-user',
        name: data.name,
        type: data.type,
        icon: data.icon || 'Tag',
        color: data.color || '#64748B',
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isLiveSupabase && user) {
        const { data: inserted, error } = await (supabase
          .from('categories') as any)
          .insert({
            user_id: user.id,
            name: newCat.name,
            type: newCat.type,
            icon: newCat.icon,
            color: newCat.color,
            is_default: false,
          })
          .select()
          .single();

        if (error) throw error;
        setRawCategories((prev) => [...prev, inserted as Category]);
      } else {
        const updated = [...rawCategories, newCat];
        setRawCategories(updated);
        syncLocal(undefined, updated, undefined, undefined);
      }

      toast.success(`Kategori "${data.name}" berhasil dibuat!`);
      return true;
    } catch (err: unknown) {
      console.error('Error creating category:', err);
      toast.error('Gagal membuat kategori');
      return false;
    }
  };

  const updateCategory = async (id: string, data: CategoryFormData): Promise<boolean> => {
    try {
      if (isLiveSupabase && user) {
        const { data: updated, error } = await (supabase
          .from('categories') as any)
          .update({
            name: data.name,
            icon: data.icon,
            color: data.color,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setRawCategories((prev) => prev.map((c) => (c.id === id ? (updated as Category) : c)));
      } else {
        const updated = rawCategories.map((c) =>
          c.id === id
            ? {
                ...c,
                name: data.name,
                icon: data.icon,
                color: data.color,
                updated_at: new Date().toISOString(),
              }
            : c
        );
        setRawCategories(updated);
        syncLocal(undefined, updated, undefined, undefined);
      }

      toast.success('Kategori berhasil diperbarui');
      return true;
    } catch (err: unknown) {
      console.error('Error updating category:', err);
      toast.error('Gagal memperbarui kategori');
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      const isUsed = rawTransactions.some((tx) => tx.category_id === id);
      if (isUsed) {
        toast.error('Kategori tidak dapat dihapus karena telah digunakan pada riwayat transaksi.');
        return false;
      }

      if (isLiveSupabase && user) {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        setRawCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        const updated = rawCategories.filter((c) => c.id !== id);
        setRawCategories(updated);
        syncLocal(undefined, updated, undefined, undefined);
      }

      toast.success('Kategori berhasil dihapus');
      return true;
    } catch (err: unknown) {
      console.error('Error deleting category:', err);
      toast.error('Gagal menghapus kategori');
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        pockets,
        categories: rawCategories,
        transactions: rawTransactions,
        transfers: rawTransfers,
        unifiedActivities,
        summary,
        period,
        setPeriod,
        isInPeriod,
        isLoading,
        isLiveSupabase,
        user,
        addIncome,
        addExpense,
        addTransfer,
        updateTransaction,
        deleteTransaction,
        deleteTransfer,
        createPocket,
        updatePocket,
        deletePocket,
        createCategory,
        updateCategory,
        deleteCategory,
        refreshData: loadData,
        getPocketById,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
