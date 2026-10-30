'use client';

import * as React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah, parseRupiahInput } from '@/lib/formatters';
import { isInPeriod } from '@/lib/dateUtils';
import { PeriodFilter } from '@/types/finance';
import { toast } from 'sonner';
import {
  Sparkles,
  RotateCcw,
  Wand2,
  Wallet,
  Home,
  PieChart,
  ShieldCheck,
  Calculator,
  ChevronDown,
  Sliders,
  X,
  LoaderCircle,
} from 'lucide-react';

interface ExpenseEstimate {
  predicted_expense: number;
  saran?: string;
  kategori_kesehatan?: string;
  meta?: {
    model: string;
    source?: string;
    unplanned_risk_buffer?: number;
    raw_ai_prediction?: number;
    base_planned_expense?: number;
  };
}

interface PredictionBaseline {
  sourceLabel: string;
  income: number;
  actualIncome: number;
  actualExpense: number;
  sourceIncome: number;
  sourceExpense: number;
  savedBalance: number;
  transactionCount: number;
  observedDays: number;
  categories: { name: string; amount: number; color: string }[];
}

const periodLabels: Record<PeriodFilter, string> = {
  today: 'Hari ini',
  this_week: 'Minggu ini',
  this_month: 'Bulan ini',
  last_month: 'Bulan lalu',
  last_3_months: '3 bulan terakhir',
  this_year: 'Tahun ini',
  all: 'Semua waktu',
};

const featureConnections = [
  ['monthly_income', 'Pendapatan bulanan', 'Dipakai untuk menghitung sisa arus kas.'],
  ['saving_pocket_target', 'Target kantong Menabung', 'Dipakai untuk memperkirakan waktu mencapai target dari sisa dana bulanan; tidak mengubah prediksi pengeluaran.'],
  ['budget_goal', 'Batas budget bulanan', 'Hanya menjadi pembanding total pengeluaran, tidak mengubah estimasi pengeluaran.'],
  ['subscription_services', 'Langganan', 'Ditambahkan ke total pengeluaran bulanan.'],
  ['essential_spending', 'Kebutuhan pokok', 'Ditambahkan ke total pengeluaran bulanan.'],
  ['discretionary_spending', 'Hiburan dan gaya hidup', 'Ditambahkan ke total pengeluaran bulanan.'],
  ['emergency_fund', 'Saldo kantong dana darurat', 'Dibandingkan dengan estimasi pengeluaran untuk menghitung perkiraan cakupan bulan.'],
  ['income_type', 'Sumber pendapatan', 'Dipakai untuk memberi konteks saran, terutama jika pemasukan freelance berubah-ubah.'],
  ['financial_stress_level', 'Beban pikiran finansial', 'Dipakai untuk indikator kesehatan finansial, bukan untuk mengubah total pengeluaran.'],
  ['economic_style', 'Kondisi ekonomi', 'Pilihan ini belum mengubah hitungan nominal; estimasi mengikuti angka yang dimasukkan.'],
] as const;

interface FormState {
  income: number;
  goal: number;
  needs: number;
  subs: number;
  emg: number;
  fun: number;
  type: 'Kiriman ortu' | 'Freelance' | 'Campuran';
  eco: 'Hemat' | 'Sedang' | 'Normal';
  stress: 'Rendah' | 'Sedang' | 'Tinggi';
}

const DEFAULT_FORM: FormState = {
  income: 0,
  goal: 0,
  needs: 0,
  subs: 0,
  emg: 0,
  fun: 0,
  type: 'Kiriman ortu',
  eco: 'Normal',
  stress: 'Sedang',
};

const MIN_ANALYSIS_INDICATOR_MS = 1400;

export default function PredictPage() {
  const { summary, pockets, categories, transactions, unifiedActivities, period } = useFinance();

  // Baseline data from database transactions
  const periodTransactions = React.useMemo(
    () => transactions.filter((t) => isInPeriod(t.transaction_date, period)),
    [transactions, period]
  );
  const periodTransactionCount = periodTransactions.length;

  const monthlyEquivalent = React.useMemo(() => {
    const now = new Date();
    let observedDays = 30;
    let sourceTransactions = periodTransactions;

    switch (period) {
      case 'today':
        observedDays = 1;
        break;
      case 'this_week':
        observedDays = ((now.getDay() + 6) % 7) + 1;
        break;
      case 'this_month':
        observedDays = now.getDate();
        break;
      case 'last_month':
        observedDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        break;
      case 'last_3_months':
        observedDays = Math.max(
          1,
          Math.floor((now.getTime() - new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime()) / 86_400_000) + 1
        );
        break;
      case 'this_year':
        observedDays = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86_400_000) + 1;
        break;
      case 'all': {
        observedDays = 30;
        const start = new Date(now);
        start.setDate(now.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        sourceTransactions = transactions.filter((t) => {
          const d = new Date(t.transaction_date);
          return d >= start && d <= now;
        });
        break;
      }
    }

    const scale = 30 / Math.max(1, observedDays);
    const inc = sourceTransactions
      .filter((t) => t.type === 'income')
      .reduce((tot, t) => tot + Number(t.amount), 0);
    const exp = sourceTransactions
      .filter((t) => t.type === 'expense')
      .reduce((tot, t) => tot + Number(t.amount), 0);

    return {
      income: Math.round(inc * scale),
      expense: Math.round(exp * scale),
      transactionCount: Math.round(sourceTransactions.length * scale),
      sourceIncome: inc,
      sourceExpense: exp,
      observedDays: Math.max(1, observedDays),
      sourceLabel: period === 'all' ? '30 hari terakhir' : periodLabels[period],
    };
  }, [period, periodTransactions, transactions]);
  const categorizedPeriodExpenses = React.useMemo(() => {
    const categoryNames = new Map(categories.map((category) => [category.id, category.name.toLowerCase()]));
    const totals = { needs: 0, subscriptions: 0, lifestyle: 0 };

    periodTransactions.forEach((transaction) => {
      if (transaction.type !== 'expense') return;

      const categoryName = categoryNames.get(transaction.category_id) ?? '';
      const searchableText = `${categoryName} ${transaction.title} ${transaction.description ?? ''}`.toLowerCase();
      const amount = Number(transaction.amount);
      if (/tagihan|utilities|utilitas|langganan|subscription|wi.?fi|internet|streaming|netflix|gym|pulsa|paket data/.test(searchableText)) {
        totals.subscriptions += amount;
      } else if (/hiburan|entertainment|hobi|rekreasi|nongkrong|cafe|kafe|game|gaya hidup|lifestyle|liburan|tiket|bioskop/.test(searchableText)) {
        totals.lifestyle += amount;
      } else {
        // Keep unrecognized expenses in essentials so all recorded expenses are represented.
        totals.needs += amount;
      }
    });

    return totals;
  }, [categories, periodTransactions]);

  const expenseCategories = React.useMemo(() => {
    const expenses = new Map<string, { name: string; amount: number; color: string }>();
    unifiedActivities
      .filter((activity) => activity.type === 'expense')
      .forEach((activity) => {
        const name = activity.category_name || 'Lainnya';
        const current = expenses.get(name) ?? {
          name,
          amount: 0,
          color: activity.category_color || '#64748B',
        };
        current.amount += activity.amount;
        expenses.set(name, current);
      });
    return Array.from(expenses.values()).sort((a, b) => b.amount - a.amount);
  }, [unifiedActivities]);

  const emergencyFundBalance = React.useMemo(
    () =>
      pockets
        .filter((pocket) => /darurat|emergency/i.test(pocket.name))
        .reduce((total, pocket) => total + Math.max(0, pocket.current_balance), 0),
    [pockets]
  );
  const savingPocket = React.useMemo(
    () => pockets.find((pocket) => pocket.name.trim().toLowerCase() === 'menabung')
      ?? pockets.find((pocket) => /tabung|simpan/i.test(pocket.name) && Number(pocket.target_amount) > 0)
      ?? null,
    [pockets]
  );

  // Form State
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);
  const [isScenarioOpen, setIsScenarioOpen] = React.useState<boolean>(false);
  const [showResultModal, setShowResultModal] = React.useState<boolean>(false);
  const [isHeroFlashing, setIsHeroFlashing] = React.useState<boolean>(false);
  const [showAiDetails, setShowAiDetails] = React.useState<boolean>(false);

  // Expense estimate API state
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [expenseEstimate, setExpenseEstimate] = React.useState<ExpenseEstimate | null>(null);
  const [predictionBaseline, setPredictionBaseline] = React.useState<PredictionBaseline | null>(null);
  const [analyzedForm, setAnalyzedForm] = React.useState<FormState | null>(null);
  const hasCurrentAnalysis =
    expenseEstimate !== null &&
    analyzedForm !== null &&
    JSON.stringify(analyzedForm) === JSON.stringify(form);

  const calculationForm = hasCurrentAnalysis && analyzedForm ? analyzedForm : form;
  const predictionFromApi = hasCurrentAnalysis ? expenseEstimate?.predicted_expense ?? null : null;

  // Results use the analyzed form snapshot and the estimate returned by the API.
  const calculation = React.useMemo(() => {
    const fixed = calculationForm.needs + calculationForm.subs;
    const flex = calculationForm.fun;
    const predictedExpense = predictionFromApi ?? fixed + flex;
    const safeIncome = Math.max(calculationForm.income, 1);
    const left = calculationForm.income - predictedExpense;
    // Keep most of the remaining cash flexible; suggest 20% for savings and 80% as buffer.
    const saveAmt = left > 0 ? Math.floor((left * 0.2) / 1000) * 1000 : 0;
    const allocationLeft = left - saveAmt;
    const targetAmount = Number(savingPocket?.target_amount || 0);
    const currentSavingBalance = Math.max(0, Number(savingPocket?.current_balance || 0));
    const savingTargetRemaining = Math.max(0, targetAmount - currentSavingBalance);
    const savingTargetMonths = saveAmt > 0 && savingTargetRemaining > 0
      ? Math.ceil(savingTargetRemaining / saveAmt)
      : null;
    const ratio = (predictedExpense / safeIncome) * 100;

    const parts = [
      { label: 'Kebutuhan pokok & langganan', amount: fixed, color: '#3b82f6', bgClass: 'bg-blue-500' },
      { label: 'Hiburan & gaya hidup', amount: flex, color: '#f59e0b', bgClass: 'bg-amber-500' },
      { label: 'Tabungan', amount: saveAmt, color: '#8b5cf6', bgClass: 'bg-violet-500' },
      { label: 'Sisa belum dialokasikan', amount: allocationLeft, color: '#94a3b8', bgClass: 'bg-slate-400' },
    ];
    const totalAllocated = safeIncome;

    const over = calculationForm.goal > 0 ? predictedExpense - calculationForm.goal : 0;
    // Check if only the AI buffer causes the overage (user's planned spending is within budget)
    const basePlanned = expenseEstimate?.meta?.base_planned_expense ?? null;
    const onlyBufferCausesOverage =
      over > 0 &&
      basePlanned !== null &&
      basePlanned <= calculationForm.goal;
    const budgetStatus =
      calculationForm.goal <= 0
        ? { level: 'neutral', text: 'Budget belum diisi' }
        : onlyBufferCausesOverage
        ? { level: 'buffer', text: 'Rencana Pas (+ Cadangan Buffer)', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-800' }
        : over > 0
        ? { level: 'bad', text: 'Melebihi budget', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }
        : predictedExpense === calculationForm.goal
          ? { level: 'warn', text: 'Pas dengan budget', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
        : predictedExpense > calculationForm.goal * 0.9
          ? { level: 'warn', text: 'Mendekati batas budget', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
          : { level: 'ok', text: 'Dalam budget', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };

    let score = 100;
    if (left < 0) score -= Math.min(35, (-left / safeIncome) * 100);
    if (over > 0 && calculationForm.goal > 0) {
      score -= Math.min(20, (over / calculationForm.goal) * 100);
    }
    if (ratio > 80) score -= Math.min(20, (ratio - 80) * 0.5);
    const emgMonths = calculationForm.emg / Math.max(predictedExpense, 1);
    if (emgMonths < 3) score -= Math.min(15, (3 - emgMonths) * 5);
    if (calculationForm.stress === 'Tinggi') score -= 8;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const tips: { type: 'ok' | 'warn' | 'bad'; text: string }[] = [];
    const addTip = (type: 'ok' | 'warn' | 'bad', text: string) => {
      if (tips.length < 3) tips.push({ type, text });
    };
    if (onlyBufferCausesOverage) {
      // Buffer is the only reason for overage — rencana user sendiri masih dalam budget
      const bufferAmt = expenseEstimate?.meta?.unplanned_risk_buffer;
      addTip('ok', `Rencanamu sudah dalam budget! AI menyisihkan cadangan buffer${bufferAmt ? ` ${formatRupiah(bufferAmt)}` : ''} untuk pengeluaran tak terduga — bukan pengeluaran yang kamu lakukan, tapi jaga-jaga saja.`);
    } else if (over > 0 && left < 0) {
      addTip('bad', `Pengeluaranmu ${formatRupiah(predictedExpense)} lewat budget ${formatRupiah(calculationForm.goal)} sebesar ${formatRupiah(over)}, dan lebih besar ${formatRupiah(-left)} dari pemasukan. Cek transaksi, lalu tinjau gaya hidup atau langganan yang bisa ditunda. Jangan buru-buru memangkas kebutuhan pokok.`);
    } else if (over > 0) {
      addTip('bad', `Pengeluaranmu lewat budget sebesar ${formatRupiah(over)}, tapi total rencana masih sesuai pemasukan. Cek dulu transaksi, lalu lihat pos gaya hidup atau langganan yang bisa dikurangi. Kalau budget itu hanya perkiraan awal, kamu bisa menyesuaikannya dengan kondisi sebenarnya.`);
    } else if (left < 0) {
      addTip('bad', `Rencana pengeluaran lebih besar ${formatRupiah(-left)} dari pemasukan. Cek apakah ada transaksi yang terlewat; jika tidak, tinjau pos fleksibel atau langganan.`);
    } else if (calculationForm.goal <= 0) {
      addTip('warn', 'Isi batas budget supaya kamu bisa tahu apakah rencana pengeluaran masih sesuai anggaran.');
    } else if (predictedExpense === calculationForm.goal) {
      addTip('warn', `Pengeluaran pas dengan budget ${formatRupiah(calculationForm.goal)}. Rencanamu masih muat, tetapi belum ada ruang dari budget untuk kejutan.`);
    } else {
      addTip('ok', `Pengeluaran masih dalam budget, dengan sisa ruang ${formatRupiah(calculationForm.goal - predictedExpense)}.`);
    }

    if (emgMonths < 3) {
      addTip(
        'warn',
        `Dana daruratmu kira-kira cukup ${emgMonths.toFixed(1)} bulan berdasarkan rencana ini. Kalau memungkinkan, bangun bertahap menuju cadangan 3–6 bulan pengeluaran.`
      );
    }

    if (
      predictionFromApi !== null &&
      monthlyEquivalent.expense > 0 &&
      tips.length < 3
    ) {
      const difference = predictedExpense - monthlyEquivalent.expense;
      addTip(
        'warn',
        `Dibanding perkiraan laju pengeluaran (${periodLabels[period]}, disetarakan ke 30 hari), rencana ini ${difference >= 0 ? 'lebih tinggi' : 'lebih rendah'} ${formatRupiah(Math.abs(difference))}. Pastikan semua transaksi sudah masuk.`
      );
    }

    if (tips.length < 2 && calculationForm.type === 'Freelance') {
      addTip(
        'warn',
        'Karena pemasukan freelance bisa berubah-ubah, sisihkan sebagian sisa bulan ini sebagai buffer untuk bulan yang lebih sepi.'
      );
    }

    if (tips.length < 2 && left > 0 && calculationForm.goal > 0) {
      addTip(
        'ok',
        `Setelah pengeluaran, masih ada sisa ${formatRupiah(left)}. Sisihkan sekitar ${formatRupiah(saveAmt)} untuk tabungan dan pertahankan ${formatRupiah(allocationLeft)} sebagai buffer.`
      );
    }

    if (tips.length < 2 && left === 0 && calculationForm.goal > 0) {
      addTip('warn', 'Pemasukan dan pengeluaran pas. Belum ada sisa yang bisa dialokasikan ke tabungan dari simulasi ini.');
    }

    if (tips.length === 0) {
      addTip(
        'ok',
        `Rencana pengeluaran ${formatRupiah(predictedExpense)} masih seimbang dengan budget dan pemasukanmu.`
      );
    }

    const mood: 'ok' | 'warn' | 'bad' =
      (calculationForm.goal > 0 && over > 0) || left < 0 || score < 50
        ? 'bad'
        : score < 75
          ? 'warn'
          : 'ok';

    return {
      fixed,
      flex,
      predictedExpense,
      saveAmt,
      savingTargetRemaining,
      savingTargetMonths,
      savingTargetAmount: targetAmount,
      savingPocketName: savingPocket?.name ?? null,
      currentSavingBalance,
      left,
      allocationLeft,
      ratio,
      parts,
      totalAllocated,
      over,
      budgetStatus,
      score,
      emgMonths,
      tips,
      mood,
      onlyBufferCausesOverage,
    };
  }, [calculationForm, predictionFromApi, monthlyEquivalent.expense, period, savingPocket, expenseEstimate]);

  // Flash animation trigger
  const triggerFlash = () => {
    setIsHeroFlashing(true);
    setTimeout(() => setIsHeroFlashing(false), 500);
  };

  // Helper updates
  const updateNumberField = (key: keyof FormState, val: number) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  // Copy actual totals for the selected dashboard period; do not extrapolate them to 30 days.
  const handleAutoFill = () => {
    setForm((prev) => ({
      ...prev,
      income: summary.total_income,
      goal: summary.total_expense,
      emg: emergencyFundBalance,
      needs: categorizedPeriodExpenses.needs,
      subs: categorizedPeriodExpenses.subscriptions,
      fun: categorizedPeriodExpenses.lifestyle,
    }));

    setExpenseEstimate(null);
    setPredictionBaseline(null);
    setAnalyzedForm(null);
    setIsScenarioOpen(false);
    triggerFlash();

    if (
      summary.total_income > 0 ||
      emergencyFundBalance > 0 ||
      categorizedPeriodExpenses.needs > 0 ||
      categorizedPeriodExpenses.subscriptions > 0 ||
      categorizedPeriodExpenses.lifestyle > 0
    ) {
      toast.success(`Data transaksi periode ${periodLabels[period]} dan saldo kantong disalin sesuai nilai aslinya; tanpa proyeksi.`);
    } else {
      toast.info('Belum ada data yang cocok dari transaksi atau kantong; input terkait dikosongkan.');
    }
  };

  // Reset to default
  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setExpenseEstimate(null);
    setPredictionBaseline(null);
    setAnalyzedForm(null);
    setIsScenarioOpen(false);
    triggerFlash();
    toast.info('Formulir dikosongkan.');
  };

  // Calculate a transparent estimate from the submitted budget fields.
  const handleCalculateEstimate = async (values: FormState = form) => {
    if (values.income <= 0) {
      toast.error('Pendapatan bulanan harus lebih dari Rp 0.');
      return;
    }

    setIsLoading(true);
    setExpenseEstimate(null);
    setPredictionBaseline(null);
    setAnalyzedForm(null);
    setIsScenarioOpen(false);
    triggerFlash();
    const requestStartedAt = Date.now();

    const payload = {
      monthly_income: values.income,
      budget_goal: values.goal,
      emergency_fund: values.emg,
      transaction_count: monthlyEquivalent.transactionCount,
      financial_stress_level: values.stress === 'Rendah' ? 0 : values.stress === 'Tinggi' ? 2 : 1,
      income_type_Freelance: values.type === 'Freelance' ? 1 : 0,
      income_type_Mixed: values.type === 'Campuran' ? 1 : 0,
      subscription_services: values.subs,
      discretionary_spending: values.fun,
      essential_spending: values.needs,
    };

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Gagal menghitung estimasi anggaran.');
      }

      const resJson = await response.json();
      if (resJson.status === 'success' && resJson.data) {
        if (!Number.isFinite(resJson.data.predicted_expense) || resJson.data.predicted_expense < 0) {
          throw new Error('API mengembalikan angka estimasi yang tidak valid.');
        }
        setExpenseEstimate(resJson.data);
        setAnalyzedForm(values);
        setPredictionBaseline({
          sourceLabel: monthlyEquivalent.sourceLabel,
          income: values.income,
          actualIncome: monthlyEquivalent.income,
          // Keep this as the actual sum for the selected period. `expense` is
          // normalized to a 30-day pace and should not be labeled as actual.
          actualExpense: monthlyEquivalent.sourceExpense,
          sourceIncome: monthlyEquivalent.sourceIncome,
          sourceExpense: monthlyEquivalent.sourceExpense,
          savedBalance: summary.total_saved,
          transactionCount: monthlyEquivalent.transactionCount,
          observedDays: monthlyEquivalent.observedDays,
          categories: expenseCategories.slice(0, 5),
        });
        setShowResultModal(true);
        toast.success('Estimasi anggaran berhasil dihitung!');
      } else {
        throw new Error(resJson.message || 'Respons API tidak valid.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghitung estimasi.');
    } finally {
      const remainingLoadingTime = MIN_ANALYSIS_INDICATOR_MS - (Date.now() - requestStartedAt);
      if (remainingLoadingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingLoadingTime));
      }
      setIsLoading(false);
    }
  };

  // Scenario quick adjustments
  const applyScenario = (action: 'fun' | 'needs') => {
    let nextForm: FormState;
    if (action === 'fun') {
      nextForm = { ...form, fun: Math.round((form.fun * 0.8) / 1000) * 1000 };
      toast.success('Pengeluaran gaya hidup dikurangi 20%');
    } else {
      nextForm = { ...form, needs: Math.round((form.needs * 0.9) / 1000) * 1000 };
      toast.success('Pengeluaran kebutuhan pokok dikurangi 10%');
    }
    setForm(nextForm);
    setExpenseEstimate(null);
    setPredictionBaseline(null);
    setAnalyzedForm(null);
    setIsScenarioOpen(false);
    triggerFlash();
    void handleCalculateEstimate(nextForm);
  };

  // Circular gauge SVG calculations
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (calculation.score / 100) * circumference;
  const scoreRingColor =
    calculation.score >= 75 ? '#10b981' : calculation.score >= 50 ? '#f59e0b' : '#ef4444';

  // Modal mood titles & descriptions
  const moodContent = {
    ok: {
      title: 'Keuangan Anda Sehat! 🎉',
      desc: 'Rencana pengeluaran, sisa dana, dan dana darurat menunjukkan kondisi yang relatif terkendali.',
      faceColor: '#10b981',
      mouthD: 'M44 72 Q60 88 76 72',
    },
    warn: {
      title: 'Hampir di Batas Maksimal ⚠️',
      desc: 'Arus kas Anda masih aman, namun pengeluaran mendekati batas target. Perhatikan pos yang bisa dipangkas.',
      faceColor: '#f59e0b',
      mouthD: 'M46 75 H74',
    },
    bad: {
      title: 'Perlu Perhatian Segera! 🚨',
      desc: 'Rencana pengeluaran berisiko menekan arus kas. Evaluasi kembali anggaran dan pos input.',
      faceColor: '#ef4444',
      mouthD: 'M44 80 Q60 66 76 80',
    },
  }[calculation.mood];

  return (
    <div className="space-y-6 pb-20">
      {/* TOP HEADER & ACTION BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Simulasi Anggaran Bulanan</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Prediksi Pengeluaran Bulanan
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Isi rencana pemasukan, pengeluaran, dan tabunganmu. Estimasi dihitung dari pos yang kamu masukkan, lalu dibandingkan dengan budget dan pemasukan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoFill}
            leftIcon={<Wand2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            className="shadow-sm"
          >
            Isi dari Data Saya
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Atur Ulang
          </Button>
        </div>
      </div>

      {/* QUICK DATA SYNC ACCORDION */}
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-medium">
            <Badge variant="blue">Periode Aktif: {periodLabels[period]}</Badge>
            <span>• Pemasukan tercatat: <strong>{formatRupiah(summary.total_income)}</strong></span>
            <span>• Pengeluaran: <strong>{formatRupiah(summary.total_expense)}</strong></span>
            <span>• Dana darurat tersimpan: <strong>{formatRupiah(emergencyFundBalance)}</strong></span>
            <span>• Transaksi tercatat: <strong>{periodTransactionCount} transaksi</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setShowAiDetails(!showAiDetails)}
            className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <span>{showAiDetails ? 'Sembunyikan cara hitung' : 'Lihat cara hitung'}</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAiDetails ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showAiDetails && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">Bagian yang dihitung</th>
                    <th className="px-3.5 py-2.5 font-semibold">Sumber Sistem Web</th>
                    <th className="px-3.5 py-2.5 font-semibold">Transformasi / Aturan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {featureConnections.map(([feature, source, transform]) => (
                    <tr key={feature} className="align-top hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                      <td className="whitespace-nowrap px-3.5 py-2 font-mono font-semibold text-blue-700 dark:text-blue-300">{feature}</td>
                      <td className="px-3.5 py-2 text-zinc-700 dark:text-zinc-300">{source}</td>
                      <td className="px-3.5 py-2 text-zinc-500 dark:text-zinc-400">{transform}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: FORMS & INPUTS (Span 7) */}
        <div className="space-y-6 lg:col-span-7">
          {/* SECTION 1: PENDAPATAN & TARGET */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Pendapatan dan Target</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Pemasukan bersih dan batas pengeluaran bulanan</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Income */}
              <MoneyInput
                label="Pendapatan Bulanan"
                value={form.income}
                onChange={(v) => updateNumberField('income', v)}
                income={form.income}
              />

              {/* Budget Goal */}
              <MoneyInput
                label="Batas Budget Bulanan"
                value={form.goal}
                onChange={(v) => updateNumberField('goal', v)}
                income={form.income}
                helperText="Anggaran pengeluaran maksimal yang Anda rencanakan"
              />

            </div>
          </div>

          {/* SECTION 2: PENGELUARAN TETAP & POKOK */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Pengeluaran Pokok</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Kebutuhan dasar dan langganan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MoneyInput
                label="Kebutuhan Pokok"
                subLabel="(makan, transport)"
                value={form.needs}
                onChange={(v) => updateNumberField('needs', v)}
                income={form.income}
              />
              <MoneyInput
                label="Langganan"
                subLabel="(termasuk kategori Tagihan & Utilities)"
                value={form.subs}
                onChange={(v) => updateNumberField('subs', v)}
                income={form.income}
              />
            </div>
          </div>

          {/* SECTION 3: DANA DARURAT & GAYA HIDUP */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Dana Darurat dan Gaya Hidup</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Dana darurat dan hiburan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MoneyInput
                label="Dana Darurat Tersedia"
                value={form.emg}
                onChange={(v) => updateNumberField('emg', v)}
                income={form.income}
                isEmergencyFund
                predictedExpense={calculation.predictedExpense}
              />
              <MoneyInput
                label="Hiburan dan Gaya Hidup"
                value={form.fun}
                onChange={(v) => updateNumberField('fun', v)}
                income={form.income}
              />
            </div>
          </div>

          {/* SECTION 4: PROFIL & KONDISI */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Profil dan Kondisi</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Karakteristik pekerjaan dan situasi ekonomi saat ini</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Sumber Pendapatan */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Sumber Pendapatan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Kiriman ortu', 'Freelance', 'Campuran'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, type: t }))}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-bold transition-all ${form.type === t
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-300 shadow-sm'
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400'
                        }`}
                    >
                      <span>{t === 'Kiriman ortu' ? '🏠' : t === 'Freelance' ? '💻' : '🔀'}</span>
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kondisi Ekonomi */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Kondisi Ekonomi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Hemat', 'Sedang', 'Normal'] as const).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, eco: e }))}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-bold transition-all ${form.eco === e
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300 shadow-sm'
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400'
                        }`}
                    >
                      <span>{e === 'Hemat' ? '🌱' : e === 'Sedang' ? '⚖️' : '🌤️'}</span>
                      <span>{e}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                  Pilihan ini untuk konteksmu; jumlah estimasi tetap mengikuti nominal yang kamu isi.
                </p>
              </div>

              {/* Beban Pikiran Finansial */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Beban Pikiran Finansial (Stress Level)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Rendah', 'Sedang', 'Tinggi'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, stress: s }))}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-bold transition-all ${form.stress === s
                          ? s === 'Rendah'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : s === 'Sedang'
                              ? 'border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400'
                        }`}
                    >
                      <span>{s === 'Rendah' ? '😌' : s === 'Sedang' ? '😐' : '😣'}</span>
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CALL-TO-ACTION BUTTON */}
          <div className="pt-2">
            <Button
              type="button"
              size="lg"
              isLoading={isLoading}
              onClick={() => handleCalculateEstimate()}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xl shadow-blue-500/25 py-4 text-base font-black rounded-2xl"
              leftIcon={<Sparkles className="h-5 w-5" />}
            >
              {isLoading ? 'Menghitung estimasi...' : 'Hitung Estimasi Bulanan'}
            </Button>
            <p className="mt-2 text-center text-[11px] text-zinc-400">
              Pengeluaran dihitung dari kebutuhan pokok, langganan, dan gaya hidup yang kamu masukkan. Ini simulasi rencana, bukan ramalan pasti.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: AI ANALYSIS RESULTS (Span 5) */}
        <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-24">
          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <LoaderCircle className="h-8 w-8 animate-spin" />
              </div>
              <h2 className="mt-5 text-base font-bold text-zinc-900 dark:text-zinc-100">
                Sedang menghitung rencana bulanan
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Menjumlahkan pos pengeluaran dan mencocokkannya dengan budget serta pemasukanmu.
              </p>
            </div>
          ) : hasCurrentAnalysis ? (
            <>
          {/* HERO SUMMARY CARD */}
          <div
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-800 p-6 text-white shadow-2xl shadow-blue-500/20 transition-transform duration-300 ${isHeroFlashing ? 'scale-[0.98] ring-4 ring-blue-400/50' : ''
              }`}
          >
            {/* Background decorative circles */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-xl" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  Estimasi Pengeluaran Bulanan
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    calculation.budgetStatus.level === 'ok'
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                      : calculation.budgetStatus.level === 'warn'
                        ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                        : calculation.budgetStatus.level === 'neutral'
                          ? 'bg-white/15 text-blue-100 border border-white/20'
                          : 'bg-rose-400/20 text-rose-200 border border-rose-400/30'
                  }`}
                >
                  {calculation.budgetStatus.text}
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-black tracking-tight font-number">
                {formatRupiah(calculation.predictedExpense)}
              </div>

              <div className="text-xs text-blue-100/80">
                {calculationForm.goal <= 0 ? (
                  <span className="text-blue-100/80 font-medium">
                    Isi batas budget supaya estimasi bisa dibandingkan dengan anggaran.
                  </span>
                ) : calculation.over > 0 ? (
                  <span className="text-rose-200 font-medium">
                    ⚠️ {formatRupiah(calculation.over)} di atas batas budget {formatRupiah(calculationForm.goal)}
                  </span>
                ) : calculation.predictedExpense === calculationForm.goal ? (
                  <span className="text-amber-200 font-medium">
                    Pengeluaran pas dengan batas budget {formatRupiah(calculationForm.goal)}
                  </span>
                ) : (
                  <span className="text-emerald-200 font-medium">
                    ✓ Sisa ruang budget {formatRupiah(-calculation.over)} dari {formatRupiah(calculationForm.goal)}
                  </span>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-white/10 text-[11px] text-blue-200/70">
                <span>Pemasukan: <strong>{formatRupiah(calculationForm.income)}</strong></span>
                <span>Sisa Arus Kas: <strong>{formatRupiah(calculation.left)}</strong></span>
              </div>
            </div>
          </div>

          {/* ALLOCATION BREAKDOWN: "KE MANA UANG ANDA PERGI" */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Ke mana Uang Anda Pergi</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ini adalah rencana pengeluaran; saran tabungan dihitung dari sisa pemasukan setelah pengeluaran.
            </p>

            {/* Segmented Bar */}
            <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              {calculation.parts.map((part) => {
                const widthPercent = (Math.max(0, part.amount) / calculation.totalAllocated) * 100;
                return (
                  <div
                    key={part.label}
                    className={`h-full transition-all duration-300 ${part.bgClass}`}
                    style={{ width: `${Math.max(0, widthPercent)}%` }}
                    title={`${part.label}: ${formatRupiah(part.amount)}`}
                  />
                );
              })}
            </div>

            {/* Legend Breakdown */}
            <div className="mt-4 space-y-2 text-xs">
              {calculation.parts.map((part) => {
                const pct = ((part.amount / Math.max(calculationForm.income, 1)) * 100).toFixed(0);
                const isDeficit = part.amount < 0;
                return (
                  <div key={part.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: part.color }} />
                      <span className="truncate text-zinc-600 dark:text-zinc-300">{part.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-number">
                      <span className={`font-bold ${isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {formatRupiah(part.amount)}
                      </span>
                      <span className="w-9 text-right text-zinc-400">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HEALTH SCORE GAUGE */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center gap-5">
              {/* Circular Ring Gauge */}
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 88 88">
                  <circle
                    cx="44"
                    cy="44"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-zinc-100 dark:text-zinc-800"
                    fill="transparent"
                  />
                  <circle
                    cx="44"
                    cy="44"
                    r="36"
                    stroke={scoreRingColor}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-2xl font-black font-number text-zinc-900 dark:text-zinc-100">
                  {calculation.score}
                </span>
              </div>

              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Indikator Kesehatan Finansial</h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {calculation.score >= 75
                    ? 'Indikator baik berdasarkan prediksi dan input'
                    : calculation.score >= 50
                      ? 'Beberapa pos perlu ditinjau'
                      : 'Perlu evaluasi arus kas dan anggaran'}
                </p>
                <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                  Skor ringkas dari rencana pengeluaran, budget, arus kas, dana darurat, dan tingkat stres yang kamu pilih.
                </p>
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => setIsScenarioOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Coba Skenario Cepat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TIPS & ADVICE CARD */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>💡 Saran & Rekomendasi Finansial</span>
              </h2>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${calculation.budgetStatus.color || 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                {calculation.budgetStatus.text}
              </span>
            </div>

            {/* Ringkasan Singkat & To the point (Bite-sized) */}
            <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
              {/* Kartu Tabungan */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/30">
                <p className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <span>💰 Rencana Menabung</span>
                </p>
                <p className="mt-1 text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11.5px]">
                  {calculation.left > 0 ? (
                    <>
                      Sisihkan <strong>{formatRupiah(calculation.saveAmt)}</strong> untuk tabungan, dan pertahankan <strong>{formatRupiah(calculation.allocationLeft)}</strong> sebagai buffer fleksibel.
                    </>
                  ) : (
                    'Belum ada sisa dana untuk ditabung. Evaluasi pos gaya hidup atau langganan untuk menambah ruang tabungan.'
                  )}
                </p>
              </div>

              {/* Kartu Dana Darurat */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <span>🛡️ Dana Darurat</span>
                </p>
                <p className="mt-1 text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11.5px]">
                  {calculation.emgMonths >= 3 ? (
                    <>Aman! Cadangan cukup untuk <strong>{calculation.emgMonths.toFixed(1)} bulan</strong> pengeluaran.</>
                  ) : (
                    <>Cadangan cukup untuk <strong>{calculation.emgMonths.toFixed(1)} bulan</strong>. Targetkan bertahap menuju 3–6 bulan.</>
                  )}
                </p>
              </div>
            </div>

            {/* Tips Tindakan Praktis */}
            {calculation.tips.length > 0 && (
              <div
                className={`rounded-xl p-3 border-l-4 text-xs leading-relaxed ${
                  calculation.tips[0].type === 'ok'
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                    : calculation.tips[0].type === 'warn'
                    ? 'border-amber-500 bg-amber-50/60 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
                    : 'border-rose-500 bg-rose-50/60 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                }`}
              >
                <span className="font-semibold">
                  {calculation.tips[0].type === 'ok' ? '✨ Tips: ' : calculation.tips[0].type === 'warn' ? '⚡ Perhatian: ' : '🚨 Evaluasi: '}
                </span>
                {calculation.tips[0].text}
              </div>
            )}

            {/* Dasar Estimasi */}
            {hasCurrentAnalysis && expenseEstimate && (
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                  <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      <span>Dasar Estimasi</span>
                    </div>
                    <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                      Metode: {expenseEstimate.meta?.model || 'Linear Regression'}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
                    <span>Estimasi pengeluaran:</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-number">{formatRupiah(calculation.predictedExpense)}</strong>
                  </div>

                  {predictionBaseline && predictionBaseline.actualExpense > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
                      <span>Pengeluaran tercatat ({predictionBaseline.sourceLabel}):</span>
                      <strong className="text-zinc-900 dark:text-zinc-100 font-number">{formatRupiah(predictionBaseline.actualExpense)}</strong>
                    </div>
                  )}

                  {expenseEstimate.saran && (
                    <p className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11.5px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {expenseEstimate.kategori_kesehatan === 'Sangat Sehat' ? '🌟 Rekomendasi (Sangat Sehat): ' :
                         expenseEstimate.kategori_kesehatan === 'Cukup Sehat' ? '👍 Rekomendasi (Cukup Sehat): ' :
                         expenseEstimate.kategori_kesehatan === 'Perlu Perhatian' ? '⚠️ Rekomendasi (Perlu Perhatian): ' :
                         '🚨 Rekomendasi (Kritis): '}
                      </span>
                      {expenseEstimate.saran}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
            </>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center shadow-sm dark:border-blue-900/60 dark:bg-zinc-900/60">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Calculator className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-base font-bold text-zinc-900 dark:text-zinc-100">
                Estimasi akan tampil di sini
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Lengkapi pemasukan dan pos pengeluaran, lalu klik <strong>Hitung Estimasi Bulanan</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* POPUP RINGKASAN HASIL ESTIMASI */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-slide-up-mobile">
            {/* Close Button X */}
            <button
              type="button"
              onClick={() => setShowResultModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 transition"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="text-center pb-2">
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl mb-3 shadow-inner text-2xl
                ${calculation.score >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/60' :
                  calculation.score >= 60 ? 'bg-blue-50 dark:bg-blue-950/60' :
                  calculation.score >= 40 ? 'bg-amber-50 dark:bg-amber-950/60' : 'bg-rose-50 dark:bg-rose-950/60'}`}>
                {calculation.score >= 80 ? '🌱' : calculation.score >= 60 ? '👍' : calculation.score >= 40 ? '⚠️' : '💸'}
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Ringkasan Estimasi Bulanan
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Berikut gambaran cepat kondisi finansialmu untuk bulan depan
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Estimasi Pengeluaran */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  💳 Estimasi Pengeluaran
                </span>
                <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100 font-number">
                  {formatRupiah(calculation.predictedExpense)}
                </p>
                <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${calculation.budgetStatus.color || 'bg-blue-50 text-blue-600'}`}>
                  {calculation.budgetStatus.text}
                </span>
              </div>

              {/* Sisa Arus Kas */}
              <div className={`rounded-2xl border p-3.5 ${
                calculation.left >= 0
                  ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/30'
                  : 'border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/30'
              }`}>
                <span className={`text-[11px] font-medium ${
                  calculation.left >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  💵 Sisa Dana Bersih
                </span>
                <p className={`mt-1 text-base font-bold font-number ${
                  calculation.left >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {calculation.left >= 0 ? '+' : ''}{formatRupiah(calculation.left)}
                </p>
                <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  calculation.left >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                }`}>
                  {calculation.left >= 0 ? 'Sisa Dana Aman' : 'Perlu evaluasi'}
                </span>
              </div>
            </div>

            {/* Status & Short Summary */}
            <div className="mt-3.5 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/30 text-xs">
              <div className="flex items-center justify-between font-semibold text-blue-900 dark:text-blue-200 mb-1">
                <span>
                  {calculation.score >= 80 ? '🌟 Kondisi: Sangat Sehat' :
                   calculation.score >= 60 ? '👍 Kondisi: Cukup Sehat' :
                   calculation.score >= 40 ? '⚠️ Kondisi: Perlu Perhatian' :
                   '🚨 Kondisi: Kritis'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  Skor: {calculation.score}/100
                </span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11.5px]">
                {calculation.left > 0
                  ? calculation.onlyBufferCausesOverage && expenseEstimate?.meta?.unplanned_risk_buffer
                    ? `Dengan alokasi cadangan buffer tak terduga ${formatRupiah(expenseEstimate.meta.unplanned_risk_buffer)}, kamu masih memiliki sisa dana bersih ${formatRupiah(calculation.left)} untuk ditabung!`
                    : `Pengeluaranmu terkontrol! Kamu memiliki sisa dana bersih ${formatRupiah(calculation.left)}, disarankan menyisihkan ${formatRupiah(calculation.saveAmt)} untuk tabungan.`
                  : `Pengeluaranmu melampaui pemasukan sebesar ${formatRupiah(-calculation.left)}. Segera tinjau pos hiburan atau langganan yang bisa dihemat.`}
              </p>
            </div>

            {/* Bottom Button */}
            <div className="mt-5">
              <Button
                type="button"
                onClick={() => setShowResultModal(false)}
                className="w-full justify-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
              >
                Oke, Paham! Lihat Detail Lengkap
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SKENARIO CEPAT (POPUP DIALOG) */}
      {isScenarioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-slide-up-mobile">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsScenarioOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Mood Illustration & Title */}
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center">
                <svg viewBox="0 0 120 120" className="h-24 w-24 drop-shadow-md">
                  <ellipse cx="60" cy="112" rx="30" ry="5" fill="#0f1b3d1f" />
                  <circle cx="60" cy="62" r="44" fill="#fde68a" stroke={moodContent.faceColor} strokeWidth="6" />
                  <circle cx="60" cy="62" r="34" fill="none" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="3 5" />
                  <circle cx="46" cy="56" r="4.5" fill="#0f1b3d" />
                  <circle cx="74" cy="56" r="4.5" fill="#0f1b3d" />
                  <path d={moodContent.mouthD} fill="none" stroke="#0f1b3d" strokeWidth="4" strokeLinecap="round" />
                  {calculation.mood === 'bad' && (
                    <path d="M96 30 Q102 40 96 44 Q90 40 96 30 Z" fill="#60a5fa" />
                  )}
                  {calculation.mood === 'ok' && (
                    <g stroke="#f59e0b" strokeWidth="3" strokeLinecap="round">
                      <path d="M16 22 V32 M11 27 H21" />
                      <path d="M104 14 V22 M100 18 H108" />
                    </g>
                  )}
                </svg>
              </div>

              <h3 className="mt-3 text-lg font-black text-zinc-900 dark:text-zinc-50">
                {moodContent.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {moodContent.desc}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="my-5 grid grid-cols-3 gap-2 rounded-2xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
              <div>
                <span className="block text-[11px] text-zinc-400">Prediksi</span>
                <b className="text-xs font-bold text-blue-600 dark:text-blue-400 font-number">
                  {formatRupiah(calculation.predictedExpense)}
                </b>
              </div>
              <div>
                <span className="block text-[11px] text-zinc-400">Sisa Arus Kas</span>
                <b className={`text-xs font-bold font-number ${calculation.left >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatRupiah(calculation.left)}
                </b>
              </div>
              <div>
                <span className="block text-[11px] text-zinc-400">Skor</span>
                <b className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-number">
                  {calculation.score} / 100
                </b>
              </div>
            </div>

            {/* Skenario Action Chips */}
            <div>
              <span className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Coba Skenario Cepat
              </span>
              <p className="mb-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Memilih skenario akan mengubah nominal input terkait, lalu menghitung ulang estimasi anggaran.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyScenario('fun')}
                  disabled={isLoading}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  ✂️ Hemat gaya hidup 20%
                </button>
                <button
                  type="button"
                  onClick={() => applyScenario('needs')}
                  disabled={isLoading}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  🛒 Hemat kebutuhan pokok 10%
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScenarioOpen(false)}
              >
                Selesai
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Formatted Money Input with Percentage / Buffer indicator
interface MoneyInputProps {
  label: string;
  subLabel?: string;
  value: number;
  onChange: (val: number) => void;
  income: number;
  helperText?: string;
  isEmergencyFund?: boolean;
  predictedExpense?: number;
}

function MoneyInput({
  label,
  subLabel,
  value,
  onChange,
  income,
  helperText,
  isEmergencyFund,
  predictedExpense = 1,
}: MoneyInputProps) {
  const displayVal = value > 0 ? value.toLocaleString('id-ID') : '';

  const pct = income > 0 ? ((value / income) * 100).toFixed(0) : '0';
  const emgMonths = (value / Math.max(predictedExpense, 1)).toFixed(1);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {label} {subLabel && <span className="font-normal text-zinc-400">{subLabel}</span>}
        </label>
      </div>

      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          Rp
        </span>

        <input
          type="text"
          inputMode="numeric"
          value={displayVal}
          onChange={(e) => onChange(parseRupiahInput(e.target.value))}
          placeholder="0"
          className="flex h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-12 pr-16 text-sm font-bold font-number text-zinc-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-900"
        />

        <div className="pointer-events-none absolute right-2.5">
          {isEmergencyFund ? (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 font-number">
              {emgMonths} bln
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 font-number">
              {pct}%
            </span>
          )}
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{helperText}</p>
      )}
    </div>
  );
}
