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
  const isSeedingRef = React.useRef(false);
  const [rawPockets, setRawPockets] = useState<Pocket[]>([]);
  const [rawCategories, setRawCategories] = useState<Category[]>([]);
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [rawTransfers, setRawTransfers] = useState<Transfer[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('this_month');

  // Load Initial Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;

      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0],
        });
        setIsLiveSupabase(true);

        const response = await fetch('/api/finance', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(errorBody?.error || 'Gagal memuat data keuangan');
        }

        const data = await response.json();
        const pocketsData = (data.pockets as Pocket[]) || [];
        const categoriesData = (data.categories as Category[]) || [];
        const transactionsData = (data.transactions as Transaction[]) || [];
        const transfersData = (data.transfers as Transfer[]) || [];

        const uniquePockets: Pocket[] = [];
        const seenNames = new Set<string>();
        for (const p of pocketsData) {
          if (!seenNames.has(p.name)) {
            seenNames.add(p.name);
            uniquePockets.push(p);
          }
        }

        const uniqueCategories: Category[] = [];
        const seenCatKeys = new Set<string>();
        for (const c of categoriesData) {
          const key = `${(c.name || '').trim().toLowerCase()}_${c.type}`;
          if (!seenCatKeys.has(key)) {
            seenCatKeys.add(key);
            uniqueCategories.push(c);
          }
        }

        setRawPockets(uniquePockets);
        setRawCategories(uniqueCategories);
        setRawTransactions(transactionsData);
        setRawTransfers(transfersData);
      } else {
        setUser({
          id: 'local-user',
          email: 'user@smartfinance.app',
          name: 'Pengguna',
        });
        setIsLiveSupabase(false);

        const localPockets = localStorage.getItem('smart_finance_pockets') || localStorage.getItem('aloka_pockets');
        const localCategories = localStorage.getItem('smart_finance_categories') || localStorage.getItem('aloka_categories');
        const localTransactions = localStorage.getItem('smart_finance_transactions') || localStorage.getItem('aloka_transactions');
        const localTransfers = localStorage.getItem('smart_finance_transfers') || localStorage.getItem('aloka_transfers');

        const parsedCats: Category[] = localCategories ? JSON.parse(localCategories) : [];
        const uniqueCats: Category[] = [];
        const seenLocalKeys = new Set<string>();
        for (const c of parsedCats) {
          const key = `${(c.name || '').trim().toLowerCase()}_${c.type}`;
          if (!seenLocalKeys.has(key)) {
            seenLocalKeys.add(key);
            uniqueCats.push(c);
          }
        }

        setRawPockets(localPockets ? JSON.parse(localPockets) : []);
        setRawCategories(uniqueCats);
        setRawTransactions(localTransactions ? JSON.parse(localTransactions) : []);
        setRawTransfers(localTransfers ? JSON.parse(localTransfers) : []);
      }
    } catch (err) {
      console.error('Error loading finance data:', err);
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data keuangan');
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
      if (newPockets !== undefined) localStorage.setItem('smart_finance_pockets', JSON.stringify(newPockets));
      if (newCategories !== undefined) localStorage.setItem('smart_finance_categories', JSON.stringify(newCategories));
      if (newTx !== undefined) localStorage.setItem('smart_finance_transactions', JSON.stringify(newTx));
      if (newTr !== undefined) localStorage.setItem('smart_finance_transfers', JSON.stringify(newTr));
    }
  };

  // Deduplicated Categories to guarantee no duplicate cards
  const categories = useMemo<Category[]>(() => {
    const unique: Category[] = [];
    const seen = new Set<string>();
    for (const c of rawCategories) {
      const key = `${(c.name || '').trim().toLowerCase()}_${c.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }
    return unique;
  }, [rawCategories]);

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
        const response = await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-income',
            payload: {
              pocket_id: data.pocket_id,
              category_id: data.category_id,
              amount: Number(data.amount),
              title: data.title,
              description: data.description || null,
              transaction_date: data.transaction_date,
            },
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal mencatat pemasukan');

        setRawTransactions((prev) => [result.transaction as Transaction, ...prev]);
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
        const response = await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-expense',
            payload: {
              pocket_id: data.pocket_id,
              category_id: data.category_id,
              amount: Number(data.amount),
              title: data.title,
              description: data.description || null,
              transaction_date: data.transaction_date,
            },
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal mencatat pengeluaran');

        setRawTransactions((prev) => [result.transaction as Transaction, ...prev]);
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
        const response = await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-transfer',
            payload: {
              from_pocket_id: data.from_pocket_id,
              to_pocket_id: data.to_pocket_id,
              amount: Number(data.amount),
              title: data.title,
              description: data.description || null,
              transfer_date: data.transfer_date,
            },
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal melakukan transfer');

        setRawTransfers((prev) => [result.transfer as Transfer, ...prev]);
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
        const response = await fetch('/api/finance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update-transaction',
            id,
            payload: {
              pocket_id: data.pocket_id,
              category_id: data.category_id,
              amount: Number(data.amount),
              title: data.title,
              description: data.description || null,
              transaction_date: data.transaction_date,
            },
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memperbarui transaksi');

        setRawTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? (result.transaction as Transaction) : tx))
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
        const response = await fetch('/api/finance', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete-transaction', id }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal menghapus transaksi');
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
        const response = await fetch('/api/finance', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete-transfer', id }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal menghapus transfer');
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
        const response = await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-pocket',
            payload: {
              name: data.name,
              description: data.description || null,
              icon: data.icon,
              color: data.color,
              target_amount: Number(data.target_amount || 0),
              initial_balance: Number(data.initial_balance || 0),
            },
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal membuat kantong dana');

        setRawPockets((prev) => [...prev, result.pocket as Pocket]);
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
        const response = await fetch('/api/finance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update-pocket',
            id,
            payload: {
              name: data.name,
              description: data.description || null,
              icon: data.icon,
              color: data.color,
              target_amount: Number(data.target_amount || 0),
              initial_balance: Number(data.initial_balance || 0),
            },
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memperbarui kantong');

        setRawPockets((prev) => prev.map((p) => (p.id === id ? (result.pocket as Pocket) : p)));
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
        const response = await fetch('/api/finance', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete-pocket', id }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal menghapus kantong');

        let nextPockets = rawPockets.filter((p) => p.id !== id);

        if (isDeletingDefault && nextPockets.length > 0) {
          const nextDefault = { ...nextPockets[0], is_default: true };
          nextPockets = [nextDefault, ...nextPockets.slice(1)];
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
        const response = await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-category',
            payload: {
              name: data.name,
              type: data.type,
              icon: data.icon,
              color: data.color,
            },
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal membuat kategori');

        setRawCategories((prev) => [...prev, result.category as Category]);
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
        const response = await fetch('/api/finance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update-category',
            id,
            payload: {
              name: data.name,
              icon: data.icon,
              color: data.color,
            },
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memperbarui kategori');

        setRawCategories((prev) => prev.map((c) => (c.id === id ? (result.category as Category) : c)));
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
        const response = await fetch('/api/finance', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete-category', id }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal menghapus kategori');
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
        categories,
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
