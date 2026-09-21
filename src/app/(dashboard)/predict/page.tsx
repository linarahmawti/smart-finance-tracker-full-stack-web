'use client';

import * as React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RupiahInput } from '@/components/ui/RupiahInput';
import { formatRupiah } from '@/lib/formatters';
import { toast } from 'sonner';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Wand2,
  Wallet,
  Home,
  PieChart,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
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

export default function PredictPage() {
  const { summary, pockets } = useFinance();

  // Form State
  const [monthlyIncome, setMonthlyIncome] = React.useState<number>(4000000);
  const [savingsRate, setSavingsRate] = React.useState<number>(20); // dalam persen (20 = 20%)
  const [budgetGoal, setBudgetGoal] = React.useState<number>(2800000);
  const [debtToIncomeRatio, setDebtToIncomeRatio] = React.useState<number>(15); // dalam persen (15 = 15%)

  const [rentOrMortgage, setRentOrMortgage] = React.useState<number>(1200000);
  const [loanPayment, setLoanPayment] = React.useState<number>(500000);
  const [essentialSpending, setEssentialSpending] = React.useState<number>(2200000);
  const [subscriptionServices, setSubscriptionServices] = React.useState<number>(150000);

  const [investmentAmount, setInvestmentAmount] = React.useState<number>(400000);
  const [emergencyFund, setEmergencyFund] = React.useState<number>(1000000);
  const [discretionarySpending, setDiscretionarySpending] = React.useState<number>(500000);
  const [transactionCount, setTransactionCount] = React.useState<number>(45);

  const [incomeType, setIncomeType] = React.useState<'Salary' | 'Freelance' | 'Mixed'>('Salary');
  const [scenario, setScenario] = React.useState<'normal' | 'inflation' | 'recession'>('normal');
  const [stressLevel, setStressLevel] = React.useState<number>(1); // 0=Low, 1=Medium, 2=High

  // Execution state
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [result, setResult] = React.useState<PredictionData | null>(null);

  // Auto-fill from user active finance data
  const handleAutoFill = () => {
    let filled = false;

    if (summary.total_income > 0) {
      setMonthlyIncome(summary.total_income);
      filled = true;
    }

    if (summary.total_expense > 0) {
      // Proporsikan pengeluaran
      const totalExp = summary.total_expense;
      setEssentialSpending(Math.round(totalExp * 0.6));
      setDiscretionarySpending(Math.round(totalExp * 0.25));
      setBudgetGoal(Math.round(totalExp * 0.9));
      filled = true;
    }

    if (summary.total_balance > 0) {
      setEmergencyFund(Math.round(summary.total_balance * 0.4));
      filled = true;
    }

    if (filled) {
      toast.success('Data formulir berhasil diisi otomatis dari ringkasan finansial Anda!');
    } else {
      toast.info('Belum ada riwayat transaksi aktif. Menggunakan contoh data default.');
    }
  };

  const handleReset = () => {
    setMonthlyIncome(4000000);
    setSavingsRate(20);
    setBudgetGoal(2800000);
    setDebtToIncomeRatio(15);
    setRentOrMortgage(1200000);
    setLoanPayment(500000);
    setEssentialSpending(2200000);
    setSubscriptionServices(150000);
    setInvestmentAmount(400000);
    setEmergencyFund(1000000);
    setDiscretionarySpending(500000);
    setTransactionCount(45);
    setIncomeType('Salary');
    setScenario('normal');
    setStressLevel(1);
    setResult(null);
    toast.info('Formulir berhasil direset ke nilai awal.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (monthlyIncome <= 0) {
      toast.error('Pendapatan bulanan harus lebih dari Rp 0.');
      return;
    }

    setIsLoading(true);

    const payload = {
      monthly_income: monthlyIncome,
      savings_rate: savingsRate / 100, // konversi 20% -> 0.20
      budget_goal: budgetGoal,
      debt_to_income_ratio: debtToIncomeRatio / 100, // konversi 15% -> 0.15
      loan_payment: loanPayment,
      investment_amount: investmentAmount,
      subscription_services: subscriptionServices,
      emergency_fund: emergencyFund,
      transaction_count: transactionCount,
      discretionary_spending: discretionarySpending,
      essential_spending: essentialSpending,
      rent_or_mortgage: rentOrMortgage,
      financial_stress_level: stressLevel,
      income_type_Freelance: incomeType === 'Freelance' ? 1 : 0,
      income_type_Mixed: incomeType === 'Mixed' ? 1 : 0,
      income_type_Salary: incomeType === 'Salary' ? 1 : 0,
      financial_scenario_inflation: scenario === 'inflation' ? 1 : 0,
      financial_scenario_normal: scenario === 'normal' ? 1 : 0,
      financial_scenario_recession: scenario === 'recession' ? 1 : 0,
    };

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Gagal memproses prediksi dari server.');
      }

      const resJson = await response.json();
      if (resJson.status === 'success' && resJson.data) {
        setResult(resJson.data);
        toast.success('Prediksi pengeluaran berhasil dihitung oleh AI!');

        // Scroll to result card
        setTimeout(() => {
          const el = document.getElementById('prediction-result');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        throw new Error(resJson.message || 'Respons API tidak valid.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memproses prediksi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Didukung AI Linear Regression</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Prediksi Pengeluaran Bulanan
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Simulasikan profil keuangan Anda untuk memprediksi total pengeluaran dan evaluasi kesehatan finansial secara akurat.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoFill}
            leftIcon={<Wand2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
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
            Reset
          </Button>
        </div>
      </div>

      {/* FORM INPUT CONTAINER */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* CARD 1: PENDAPATAN & TARGET */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Informasi Pendapatan & Target</CardTitle>
                  <CardDescription>Pemasukan bulanan dan target tabungan Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <RupiahInput
                label="Pendapatan Bulanan (Monthly Income)"
                value={monthlyIncome}
                onChange={setMonthlyIncome}
                placeholder="4.000.000"
                helperText="Total pemasukan bersih bulanan Anda"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Target Tabungan (Savings Rate): <span className="text-blue-600 font-bold">{savingsRate}%</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={savingsRate}
                    onChange={(e) => setSavingsRate(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 dark:bg-zinc-700 accent-blue-600"
                  />
                  <span className="w-12 text-right text-sm font-bold font-number text-zinc-700 dark:text-zinc-200">
                    {savingsRate}%
                  </span>
                </div>
              </div>

              <RupiahInput
                label="Batas Budget Bulanan (Budget Goal)"
                value={budgetGoal}
                onChange={setBudgetGoal}
                placeholder="2.800.000"
                helperText="Target maksimal anggaran pengeluaran yang Anda rencanakan"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Rasio Utang / Pendapatan (Debt to Income): <span className="text-blue-600 font-bold">{debtToIncomeRatio}%</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={debtToIncomeRatio}
                    onChange={(e) => setDebtToIncomeRatio(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 dark:bg-zinc-700 accent-blue-600"
                  />
                  <span className="w-12 text-right text-sm font-bold font-number text-zinc-700 dark:text-zinc-200">
                    {debtToIncomeRatio}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: PENGELUARAN TETAP & POKOK */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Pengeluaran Tetap & Pokok</CardTitle>
                  <CardDescription>Biaya tempat tinggal, cicilan, dan kebutuhan dasar</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <RupiahInput
                label="Sewa Tempat Tinggal / KPR (Rent / Mortgage)"
                value={rentOrMortgage}
                onChange={setRentOrMortgage}
                placeholder="1.200.000"
              />

              <RupiahInput
                label="Cicilan & Angsuran Pinjaman (Loan Payment)"
                value={loanPayment}
                onChange={setLoanPayment}
                placeholder="500.000"
              />

              <RupiahInput
                label="Kebutuhan Pokok (Makan, Belanja Pokok, Transport)"
                value={essentialSpending}
                onChange={setEssentialSpending}
                placeholder="2.200.000"
              />

              <RupiahInput
                label="Layanan Langganan (Netflix, Spotify, Wifi, Gym)"
                value={subscriptionServices}
                onChange={setSubscriptionServices}
                placeholder="150.000"
              />
            </CardContent>
          </Card>

          {/* CARD 3: INVESTASI & DANA LAINNYA */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Investasi & Gaya Hidup</CardTitle>
                  <CardDescription>Alokasi investasi, dana darurat, dan gaya hidup</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <RupiahInput
                label="Investasi Bulanan (Investment Amount)"
                value={investmentAmount}
                onChange={setInvestmentAmount}
                placeholder="400.000"
              />

              <RupiahInput
                label="Dana Darurat yang Disiapkan (Emergency Fund)"
                value={emergencyFund}
                onChange={setEmergencyFund}
                placeholder="1.000.000"
              />

              <RupiahInput
                label="Hiburan & Gaya Hidup (Discretionary Spending)"
                value={discretionarySpending}
                onChange={setDiscretionarySpending}
                placeholder="500.000"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Perkiraan Frekuensi Transaksi Bulanan
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={transactionCount}
                    onChange={(e) => setTransactionCount(Number(e.target.value))}
                    className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
                  />
                  <span className="pointer-events-none absolute right-3.5 text-xs text-zinc-400">
                    kali / bulan
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: PROFIL FINANSIAL & SKENARIO */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Profil Finansial & Kondisi</CardTitle>
                  <CardDescription>Karakteristik pekerjaan dan kondisi ekonomi</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Income Type */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Tipe Sumber Pendapatan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Salary', 'Freelance', 'Mixed'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIncomeType(type)}
                      className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                        incomeType === type
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 shadow-sm'
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400'
                      }`}
                    >
                      {type === 'Salary' ? 'Gaji Tetap' : type === 'Freelance' ? 'Freelance' : 'Campuran'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Economic Scenario */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Kondisi Ekonomi Saat Ini
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'inflation', 'recession'] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setScenario(sc)}
                      className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                        scenario === sc
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 shadow-sm'
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400'
                      }`}
                    >
                      {sc === 'normal' ? 'Normal' : sc === 'inflation' ? 'Inflasi' : 'Resesi'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Stress Level */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Tingkat Beban Pikiran Finansial (Stress Level)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Rendah (Low)', val: 0 },
                    { label: 'Sedang (Medium)', val: 1 },
                    { label: 'Tinggi (High)', val: 2 },
                  ].map((st) => (
                    <button
                      key={st.val}
                      type="button"
                      onClick={() => setStressLevel(st.val)}
                      className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                        stressLevel === st.val
                          ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 shadow-sm'
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-center pt-2">
          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="w-full max-w-md bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg shadow-blue-500/25 py-3.5 text-base font-bold"
            leftIcon={<Sparkles className="h-5 w-5" />}
          >
            {isLoading ? 'Menghitung Prediksi AI...' : 'Hitung Prediksi Pengeluaran'}
          </Button>
        </div>
      </form>

      {/* PREDICTION RESULT SECTION */}
      {result && (
        <div id="prediction-result" className="pt-4 animate-slide-up">
          <Card className="border-2 border-blue-500/30 bg-gradient-to-b from-blue-50/40 via-white to-white dark:from-blue-950/20 dark:via-zinc-900 dark:to-zinc-900 shadow-xl shadow-blue-500/10">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Hasil Prediksi AI Selesai
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Kesehatan Finansial:</span>
                  <Badge
                    variant={
                      result.kategori_kesehatan === 'Sangat Sehat'
                        ? 'income'
                        : result.kategori_kesehatan === 'Cukup Sehat'
                        ? 'blue'
                        : result.kategori_kesehatan === 'Perlu Perhatian'
                        ? 'neutral'
                        : 'expense'
                    }
                    className="text-xs px-3 py-1 font-bold"
                  >
                    {result.kategori_kesehatan}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* PRIMARY STATISTIC HERO */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-center sm:text-left">
                <div className="rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Prediksi Pengeluaran
                  </span>
                  <div className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400 font-number">
                    {result.predicted_expense_formatted}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                    <span>Estimasi total biaya bulan ini</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Rasio Pengeluaran
                  </span>
                  <div className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-number">
                    {result.expense_ratio_persen}%
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                    <span>dari pendapatan bulanan Anda</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Estimasi Sisa Saldo
                  </span>
                  <div
                    className={`mt-1.5 text-2xl sm:text-3xl font-black tracking-tight font-number ${
                      result.sisa_saldo >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {result.sisa_saldo_formatted}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                    {result.sisa_saldo >= 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                    )}
                    <span>{result.sisa_saldo >= 0 ? 'Surplus anggaran aman' : 'Potensi defisit anggaran'}</span>
                  </div>
                </div>
              </div>

              {/* ACTIONABLE AI ADVICE */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/60 dark:bg-blue-950/20">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Rekomendasi Cerdas AI
                    </h4>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {result.saran}
                    </p>
                  </div>
                </div>
              </div>

              {/* MODEL METADATA BAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
                <span>
                  Model: <strong className="text-zinc-600 dark:text-zinc-300">Linear Regression 26 Fitur</strong> (Proyek Capstone SIB DBS Foundation)
                </span>
                <div className="flex items-center gap-3">
                  <span>MAE: <strong>Rp {result.meta?.mae?.toFixed(2) || '596.85'}</strong></span>
                  <span>•</span>
                  <span>R² Score: <strong>{result.meta?.r2?.toFixed(4) || '0.0927'}</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
