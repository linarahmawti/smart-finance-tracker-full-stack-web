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
  BrainCircuit,
  ChevronDown,
  Sliders,
  X,
  LoaderCircle,
} from 'lucide-react';

interface PredictionData {
  predicted_expense: number;
  predicted_expense_formatted: string;
  monthly_income: number;
  sisa_saldo: number;
  sisa_saldo_formatted: string;
  expense_ratio_persen: number;
  kategori_kesehatan: string;
  saran: string;
  meta: {
    model: string;
    mae: number;
    r2: number;
    source?: string;
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
  ['monthly_income', 'transactions.amount (income)', 'Dinormalisasi 30 hari; Semua waktu memakai 30 hari terakhir.'],
  ['savings_rate', 'Input manual / transactions', 'Target tabungan ÷ pendapatan; Isi dari Data Saya memakai selisih pemasukan dan pengeluaran aktual.'],
  ['budget_goal', 'Input manual / transactions.amount (expense)', 'Batas budget yang dimasukkan pengguna; Isi dari Data Saya memakai total pengeluaran aktual yang dinormalisasi 30 hari.'],
  ['debt_to_income_ratio', 'Rerata data latih', 'Dinetralkan pada rerata data latih; tidak diminta dari form.'],
  ['loan_payment', 'Rerata data latih', 'Dinetralkan pada rerata data latih; tidak diminta dari form.'],
  ['investment_amount', 'Rerata data latih', 'Dinetralkan pada rerata data latih; tidak diminta dari form.'],
  ['subscription_services', 'Input manual / transactions + categories', 'Isi dari Data Saya menjumlahkan transaksi pengeluaran yang kategorinya atau judulnya cocok dengan langganan.'],
  ['emergency_fund', 'pockets (Dana Darurat / Emergency)', 'Saldo kantong darurat aktif.'],
  ['transaction_count', 'transactions count (30 hari)', 'Jumlah transaksi bulanan dinormalisasi.'],
  ['discretionary_spending', 'Input manual / transactions + categories', 'Isi dari Data Saya mengambil transaksi yang cocok dengan hiburan atau gaya hidup.'],
  ['essential_spending', 'Input manual / transactions + categories', 'Isi dari Data Saya mengambil kebutuhan pokok dan transaksi yang kategorinya belum dikenali.'],
  ['rent_or_mortgage', 'Rerata data latih', 'Dinetralkan pada rerata data latih; tidak diminta dari form.'],
  ['financial_stress_level', 'Pilihan manual', 'Rendah = 0, Sedang = 1, Tinggi = 2.'],
  ['income_type', 'Pilihan manual', 'Kiriman ortu menggunakan kategori pendapatan tetap pada model; Freelance dan Campuran tetap sesuai kategori latih.'],
  ['financial_scenario', 'Netral', 'Pilihan Hemat/Sedang/Normal hanya memengaruhi estimasi cepat; model menggunakan nilai netral.'],
] as const;

interface FormState {
  income: number;
  goal: number;
  save: number;
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
  save: 0,
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
  const monthlyTransactionCount = monthlyEquivalent.transactionCount;

  const categorizedPeriodExpenses = React.useMemo(() => {
    const categoryNames = new Map(categories.map((category) => [category.id, category.name.toLowerCase()]));
    const totals = { needs: 0, subscriptions: 0, lifestyle: 0 };

    periodTransactions.forEach((transaction) => {
      if (transaction.type !== 'expense') return;

      const categoryName = categoryNames.get(transaction.category_id) ?? '';
      const searchableText = `${categoryName} ${transaction.title} ${transaction.description ?? ''}`.toLowerCase();
      const amount = Number(transaction.amount);
      if (/langganan|subscription|wi.?fi|internet|streaming|netflix|gym|pulsa|paket data/.test(searchableText)) {
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

  // Form State
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);
  const [isScenarioOpen, setIsScenarioOpen] = React.useState<boolean>(false);
  const [isHeroFlashing, setIsHeroFlashing] = React.useState<boolean>(false);
  const [showAiDetails, setShowAiDetails] = React.useState<boolean>(false);

  // ML API execution state
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [aiResult, setAiResult] = React.useState<PredictionData | null>(null);
  const [predictionBaseline, setPredictionBaseline] = React.useState<PredictionBaseline | null>(null);
  const [analyzedForm, setAnalyzedForm] = React.useState<FormState | null>(null);
  const hasCurrentAnalysis =
    aiResult !== null &&
    analyzedForm !== null &&
    JSON.stringify(analyzedForm) === JSON.stringify(form);

  const calculationForm = hasCurrentAnalysis && analyzedForm ? analyzedForm : form;
  const modelPrediction = hasCurrentAnalysis ? aiResult?.predicted_expense ?? null : null;

  // Results use the analyzed form snapshot and the model prediction, never a live estimate.
  const calculation = React.useMemo(() => {
    const fixed = calculationForm.needs + calculationForm.subs;
    const flex = calculationForm.fun;
    const predictedExpense = modelPrediction ?? fixed + flex;
    const safeIncome = Math.max(calculationForm.income, 1);
    const saveAmt = calculationForm.save;
    const left = calculationForm.income - predictedExpense - saveAmt;
    const allocationLeft = calculationForm.income - fixed - flex - saveAmt;
    const ratio = (predictedExpense / safeIncome) * 100;

    const parts = [
      { label: 'Kebutuhan pokok & langganan', amount: fixed, color: '#3b82f6', bgClass: 'bg-blue-500' },
      { label: 'Hiburan & gaya hidup', amount: flex, color: '#f59e0b', bgClass: 'bg-amber-500' },
      { label: 'Tabungan', amount: saveAmt, color: '#8b5cf6', bgClass: 'bg-violet-500' },
      { label: 'Sisa belum dialokasikan', amount: allocationLeft, color: '#94a3b8', bgClass: 'bg-slate-400' },
    ];
    const totalAllocated = safeIncome;

    const over = calculationForm.goal > 0 ? predictedExpense - calculationForm.goal : 0;
    const budgetStatus =
      calculationForm.goal <= 0
        ? { level: 'neutral', text: 'Budget belum diisi' }
        : over > 0
        ? { level: 'bad', text: 'Melebihi budget', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }
        : predictedExpense > calculationForm.goal * 0.9
          ? { level: 'warn', text: 'Mendekati batas budget', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
          : { level: 'ok', text: 'Aman dalam budget', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };

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
    const savingsRate = (saveAmt / safeIncome) * 100;

    if (left < 0) {
      addTip(
        'bad',
        `Prediksi pengeluaran dan target tabungan membuat arus kas defisit ${formatRupiah(-left)}. Kurangi pos pengeluaran atau sesuaikan target tabungan.`
      );
    }

    if (calculationForm.goal <= 0) {
      addTip('warn', 'Batas budget belum diisi, jadi prediksi belum dapat dibandingkan dengan anggaran bulanan.');
    } else if (over > 0) {
      addTip(
        'bad',
        `Prediksi model ${formatRupiah(predictedExpense)} melebihi batas budget ${formatRupiah(calculationForm.goal)} sebesar ${formatRupiah(over)}.`
      );
    } else if (predictedExpense >= calculationForm.goal * 0.9) {
      addTip(
        'warn',
        `Prediksi sudah memakai ${Math.round((predictedExpense / calculationForm.goal) * 100)}% dari budget. Sisakan ruang untuk kebutuhan tak terduga.`
      );
    } else {
      addTip(
        'ok',
        `Prediksi masih di bawah batas budget dengan sisa ruang ${formatRupiah(calculationForm.goal - predictedExpense)}.`
      );
    }

    if (emgMonths < 3) {
      addTip(
        'warn',
        `Dana darurat baru cukup sekitar ${emgMonths.toFixed(1)} bulan menurut prediksi. Sasaran umum adalah 3–6 bulan pengeluaran.`
      );
    }

    if (left >= 0 && savingsRate < 10) {
      addTip(
        'warn',
        `Target tabungan baru ${savingsRate.toFixed(0)}% dari pendapatan. Jika arus kas memungkinkan, naikkan bertahap agar ada cadangan lebih kuat.`
      );
    }

    if (
      modelPrediction !== null &&
      monthlyEquivalent.expense > 0 &&
      tips.length < 3
    ) {
      const difference = predictedExpense - monthlyEquivalent.expense;
      addTip(
        'warn',
        `Dibanding realisasi ${periodLabels[period]}, prediksi model ${difference >= 0 ? 'lebih tinggi' : 'lebih rendah'} ${formatRupiah(Math.abs(difference))}. Jadikan ini pembanding, bukan kepastian.`
      );
    }

    if (tips.length < 2 && calculationForm.type === 'Freelance') {
      addTip(
        'warn',
        'Pemasukan freelance dapat berubah-ubah; sisakan buffer arus kas dan hitung ulang saat pemasukan berubah.'
      );
    }

    if (tips.length < 2 && left >= 0 && calculationForm.goal > 0) {
      addTip(
        'ok',
        `Setelah prediksi dan target tabungan ${formatRupiah(saveAmt)}, estimasi sisa arus kas ${formatRupiah(left)}.`
      );
    }

    if (tips.length === 0) {
      addTip(
        'ok',
        `Prediksi sebesar ${formatRupiah(predictedExpense)} masih seimbang dengan budget dan target tabungan yang Anda masukkan.`
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
    };
  }, [calculationForm, modelPrediction, monthlyEquivalent.expense, period]);

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
      save: 0,
      emg: emergencyFundBalance,
      needs: categorizedPeriodExpenses.needs,
      subs: categorizedPeriodExpenses.subscriptions,
      fun: categorizedPeriodExpenses.lifestyle,
    }));

    setAiResult(null);
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
    setAiResult(null);
    setPredictionBaseline(null);
    setAnalyzedForm(null);
    setIsScenarioOpen(false);
    triggerFlash();
    toast.info('Formulir dikosongkan.');
  };

  // Call the official ML backend endpoint (/api/predict)
  const handleCalculateAi = async (values: FormState = form) => {
    if (values.income <= 0) {
      toast.error('Pendapatan bulanan harus lebih dari Rp 0.');
      return;
    }

    setIsLoading(true);
    setAiResult(null);
    setPredictionBaseline(null);
    setAnalyzedForm(null);
    setIsScenarioOpen(false);
    triggerFlash();
    const requestStartedAt = Date.now();

    const payload = {
      monthly_income: values.income,
      savings_rate: values.save / Math.max(values.income, 1),
      budget_goal: values.goal,
      subscription_services: values.subs,
      emergency_fund: values.emg,
      ...(monthlyTransactionCount > 0 ? { transaction_count: monthlyTransactionCount } : {}),
      discretionary_spending: values.fun,
      essential_spending: values.needs,
      financial_stress_level: values.stress === 'Tinggi' ? 2 : values.stress === 'Sedang' ? 1 : 0,
      income_type_Freelance: values.type === 'Freelance' ? 1 : 0,
      income_type_Mixed: values.type === 'Campuran' ? 1 : 0,
      income_type_Salary: values.type === 'Kiriman ortu' ? 1 : 0,
      financial_scenario_inflation: 0,
      financial_scenario_normal: 0,
      financial_scenario_recession: 0,
    };

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Gagal memproses prediksi dari model AI.');
      }

      const resJson = await response.json();
      if (resJson.status === 'success' && resJson.data) {
        setAiResult(resJson.data);
        setAnalyzedForm(values);
        setPredictionBaseline({
          sourceLabel: monthlyEquivalent.sourceLabel,
          income: values.income,
          actualIncome: monthlyEquivalent.income,
          actualExpense: monthlyEquivalent.expense,
          sourceIncome: monthlyEquivalent.sourceIncome,
          sourceExpense: monthlyEquivalent.sourceExpense,
          savedBalance: summary.total_saved,
          transactionCount: monthlyEquivalent.transactionCount,
          observedDays: monthlyEquivalent.observedDays,
          categories: expenseCategories.slice(0, 5),
        });
        toast.success('Estimasi model AI berhasil dihitung!');
      } else {
        throw new Error(resJson.message || 'Respons API tidak valid.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses model prediksi.');
    } finally {
      const remainingLoadingTime = MIN_ANALYSIS_INDICATOR_MS - (Date.now() - requestStartedAt);
      if (remainingLoadingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingLoadingTime));
      }
      setIsLoading(false);
    }
  };

  // Scenario quick adjustments
  const applyScenario = (action: 'fun' | 'save' | 'needs') => {
    let nextForm: FormState;
    if (action === 'fun') {
      nextForm = { ...form, fun: Math.round((form.fun * 0.8) / 1000) * 1000 };
      toast.success('Pengeluaran gaya hidup dikurangi 20%');
    } else if (action === 'save') {
      nextForm = {
        ...form,
        save: Math.min(Math.round(form.income * 0.6), form.save + Math.round(form.income * 0.05)),
      };
      toast.success('Target tabungan dinaikkan +5%');
    } else {
      nextForm = { ...form, needs: Math.round((form.needs * 0.9) / 1000) * 1000 };
      toast.success('Pengeluaran kebutuhan pokok dikurangi 10%');
    }
    setForm(nextForm);
    setAiResult(null);
    setPredictionBaseline(null);
    setAnalyzedForm(null);
    setIsScenarioOpen(false);
    triggerFlash();
    void handleCalculateAi(nextForm);
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
      desc: 'Prediksi pengeluaran, target tabungan, dan dana darurat menunjukkan kondisi yang relatif terkendali.',
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
      desc: 'Prediksi pengeluaran atau target tabungan berisiko menekan arus kas. Evaluasi kembali anggaran dan pos input.',
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
            <span>Simulasi & Prediksi Finansial Pintar</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Prediksi Pengeluaran Bulanan
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Isi data yang tersedia atau sinkronkan dari sistem. Setelah tombol hitung ditekan, hasil analisis model akan tampil di sisi kanan.
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
            <span>{showAiDetails ? 'Sembunyikan Kontrak AI' : 'Lihat Relasi Kontrak AI'}</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAiDetails ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showAiDetails && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">Field Model AI</th>
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
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Pemasukan bersih dan target tabungan Anda</p>
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

              <MoneyInput
                label="Target Tabungan Bulanan"
                value={form.save}
                onChange={(v) => updateNumberField('save', v)}
                income={form.income}
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
                subLabel="(Wi-Fi, gym, Netflix)"
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
              onClick={() => handleCalculateAi()}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xl shadow-blue-500/25 py-4 text-base font-black rounded-2xl"
              leftIcon={<Sparkles className="h-5 w-5" />}
            >
              {isLoading ? 'Menghitung Model AI...' : 'Hitung Prediksi dengan Model AI'}
            </Button>
            <p className="mt-2 text-center text-[11px] text-zinc-400">
              Model menganalisis input dan data transaksi yang tersedia. Hasil merupakan estimasi, bukan kepastian.
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
                Model AI sedang menganalisis
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Mengolah data yang Anda masukkan dan menyiapkan estimasi pengeluaran serta rekomendasi.
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
                  {aiResult ? 'Prediksi Model AI Bulan Depan' : 'Prediksi Pengeluaran Bulan Depan'}
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
                {aiResult?.predicted_expense_formatted}
              </div>

              <div className="text-xs text-blue-100/80">
                {calculationForm.goal <= 0 ? (
                  <span className="text-blue-100/80 font-medium">
                    Isi batas budget untuk membandingkan hasil model dengan anggaran.
                  </span>
                ) : calculation.over > 0 ? (
                  <span className="text-rose-200 font-medium">
                    ⚠️ {formatRupiah(calculation.over)} di atas batas budget {formatRupiah(calculationForm.goal)}
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
              Rincian mengikuti nominal input. Prediksi AI memakai model dan dapat berbeda dari total pos.
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
                  Skor indikator dihitung dari hasil model, budget, target tabungan, dan kecukupan dana darurat.
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
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Saran untuk Anda</h2>
            <ul className="space-y-2 text-xs">
              {calculation.tips.map((tip, idx) => (
                <li
                  key={idx}
                  className={`rounded-xl p-3 border-l-4 leading-relaxed ${tip.type === 'ok'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                      : tip.type === 'warn'
                        ? 'border-amber-500 bg-amber-50/60 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
                        : 'border-rose-500 bg-rose-50/60 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                    }`}
                >
                  {tip.text}
                </li>
              ))}
            </ul>

            {/* AI Result deep metrics if available */}
            {aiResult && (
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="rounded-xl bg-blue-50/80 p-3.5 text-xs dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
                    <BrainCircuit className="h-4 w-4 text-blue-600" />
                    <span>Rekomendasi Model AI</span>
                  </div>
                  <p className="mt-1.5 text-zinc-700 dark:text-zinc-300 leading-relaxed">{aiResult.saran}</p>

                  {predictionBaseline && (
                    <div className="mt-3 pt-2.5 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
                      <span>Realisasi pengeluaran ({predictionBaseline.sourceLabel}):</span>
                      <strong className="text-zinc-900 dark:text-zinc-100 font-number">{formatRupiah(predictionBaseline.actualExpense)}</strong>
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>Sumber: {aiResult.meta?.model || 'Linear Regression 26 Fitur'}</span>
                    <span>MAE: Rp {aiResult.meta?.mae?.toFixed(0) || '597'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
            </>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center shadow-sm dark:border-blue-900/60 dark:bg-zinc-900/60">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <BrainCircuit className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-base font-bold text-zinc-900 dark:text-zinc-100">
                Hasil analisis akan tampil di sini
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Lengkapi data yang tersedia, lalu klik <strong>Hitung Prediksi dengan Model AI</strong> untuk mulai analisis.
              </p>
            </div>
          )}
        </div>
      </div>

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
                  {aiResult?.predicted_expense_formatted}
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
                Memilih skenario akan mengubah nominal input terkait, lalu menjalankan analisis model AI ulang.
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
                  onClick={() => applyScenario('save')}
                  disabled={isLoading}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  📈 Tabungan +5%
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
