"use client";

import * as React from "react";
import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { formatRupiah, formatDate, formatPercentage } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { IconRenderer } from "@/components/shared/IconRenderer";
import { EmptyState } from "@/components/shared/EmptyState";
import { PocketModal } from "@/components/forms/PocketModal";
import { QuickActionModal } from "@/components/shared/QuickActionModal";
import { Modal } from "@/components/ui/Modal";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Plus,
  ArrowRight,
  TrendingUp,
  ArrowRightLeft,
  Sparkles,
  Brain,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  TrendingDown,
  Zap,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";

import { PeriodFilterPills } from "@/components/shared/PeriodFilterPills";

// ─────────────────────────────────────────────
// Helper: compute financial health score (0–100)
// Relasi kolom yang digunakan:
//   • saving_rate   = (income - expense) / income  → bobot 40 poin
//   • expense_ratio = expense / income             → bobot 35 poin
//   • balance_bonus = total_balance > 0            → bobot 25 poin
// ─────────────────────────────────────────────
function computeHealthScore(
  income: number,
  expense: number,
  balance: number
): {
  score: number;
  label: string;
  color: string;
  bg: string;
  tip: string;
} {
  if (income === 0 && expense === 0) {
    return {
      score: 0,
      label: "Belum Ada Data",
      color: "#94a3b8",
      bg: "from-slate-500 to-slate-600",
      tip: "Mulai catat pemasukan & pengeluaranmu untuk melihat analisis kesehatan finansial.",
    };
  }

  const savingRate = income > 0 ? Math.max(0, (income - expense) / income) : 0;
  const expenseRatio = income > 0 ? Math.min(1, expense / income) : 1;
  const balanceBonus = balance > 0 ? 1 : 0;

  const savingScore = Math.round(savingRate * 40);
  const expenseScore = Math.round((1 - expenseRatio) * 35);
  const balanceScore = balanceBonus * 25;
  const score = Math.min(100, savingScore + expenseScore + balanceScore);

  if (score >= 75)
    return {
      score,
      label: "Sangat Sehat",
      color: "#10b981",
      bg: "from-emerald-500 to-teal-600",
      tip: "Keuanganmu dalam kondisi prima! Pertahankan rasio tabungan yang baik.",
    };
  if (score >= 50)
    return {
      score,
      label: "Cukup Baik",
      color: "#f59e0b",
      bg: "from-amber-500 to-orange-500",
      tip: "Ada ruang perbaikan. Coba kurangi pengeluaran atau tingkatkan pemasukan.",
    };
  if (score >= 25)
    return {
      score,
      label: "Perlu Perhatian",
      color: "#f97316",
      bg: "from-orange-500 to-red-500",
      tip: "Pengeluaran mendekati atau melebihi pemasukan. Tinjau kembali anggaranmu.",
    };
  return {
    score,
    label: "Kritis",
    color: "#ef4444",
    bg: "from-red-500 to-rose-700",
    tip: "Pengeluaran jauh melebihi pemasukan. Segera lakukan penyesuaian anggaran!",
  };
}

export default function DashboardPage() {
  const { pockets, categories, unifiedActivities, summary, period, isLoading } =
    useFinance();
  const [isPocketModalOpen, setIsPocketModalOpen] = React.useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = React.useState(false);
  const [isInsightModalOpen, setIsInsightModalOpen] = React.useState(false);
  const [activeInsightTab, setActiveInsightTab] = React.useState<"expense" | "savings">("expense");
  const [selectedExpenseCategoryName, setSelectedExpenseCategoryName] = React.useState<string | null>(null);
  const [quickActionType, setQuickActionType] = React.useState<
    "income" | "expense" | "transfer" | "saving" | null
  >(null);

  const pocketGroups = React.useMemo(() => {
    const groups = new Map<string, typeof pockets>();
    pockets.forEach((pocket) => {
      const key = pocket.name.trim().replace(/\s+/g, " ").toLowerCase();
      groups.set(key, [...(groups.get(key) ?? []), pocket]);
    });
    return Array.from(groups, ([key, groupedPockets]) => ({ key, pockets: groupedPockets }));
  }, [pockets]);

  // ─── Category Expense Pie ───
  const categoryExpenseData = React.useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    unifiedActivities
      .filter((a) => a.type === "expense")
      .forEach((item) => {
        const catName = item.category_name || "Lainnya";
        const color = item.category_color || "#64748B";
        if (!map[catName]) map[catName] = { name: catName, value: 0, color };
        map[catName].value += item.amount;
      });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [unifiedActivities]);

  // ─── Cashflow Bar ───
  const cashflowChartData = React.useMemo(
    () => [
      { name: "Pemasukan", amount: summary.total_income, fill: "#10B981" },
      { name: "Pengeluaran", amount: summary.total_expense, fill: "#F43F5E" },
      { name: "Ditabung", amount: summary.total_saved, fill: "#8B5CF6" },
    ],
    [summary]
  );

  // ─────────────────────────────────────────────────────────────
  // AI PREDICTION: relasi kolom yang dianalisis
  //   transactions.type / amount → income & expense agregat
  //   summary.total_income       → pemasukan periode ini
  //   summary.total_expense      → pengeluaran periode ini
  //   summary.total_saved        → tabungan aktif
  //   summary.total_balance      → saldo berjalan seluruh kantong
  //   categoryExpenseData[0]     → kategori pengeluaran dominan
  // ─────────────────────────────────────────────────────────────

  // 1. Skor Kesehatan Finansial
  const health = React.useMemo(
    () =>
      computeHealthScore(
        summary.total_income,
        summary.total_expense,
        summary.total_balance
      ),
    [summary]
  );

  const healthRadialData = React.useMemo(
    () => [{ name: "Skor", value: health.score, fill: health.color }],
    [health]
  );

  // 2. Proyeksi Saldo: saldo_sekarang + net_cashflow
  const projectionData = React.useMemo(() => {
    const net = summary.total_income - summary.total_expense;
    const projectedBalance = summary.total_balance + net;
    const growth =
      summary.total_balance > 0
        ? ((projectedBalance - summary.total_balance) / summary.total_balance) * 100
        : 0;
    return { net, projectedBalance, growth };
  }, [summary]);

  // 3. Saving Rate Insight: (income - expense) / income × 100
  const savingInsight = React.useMemo(() => {
    const rate =
      summary.total_income > 0
        ? Math.round(
            ((summary.total_income - summary.total_expense) /
              summary.total_income) *
              100
          )
        : 0;
    const gap = 20 - rate;
    const topCat = categoryExpenseData[0];
    const dominantWarning =
      topCat && summary.total_income > 0
        ? (topCat.value / summary.total_income) * 100
        : 0;
    return { rate, gap, topCat, dominantWarning };
  }, [summary, categoryExpenseData]);

  const expenseInsight = React.useMemo(() => {
    const income = summary.total_income;
    const expense = summary.total_expense;
    const topCategory = categoryExpenseData[0];

    if (income <= 0) {
      return {
        title: expense > 0 ? "Pemasukan belum tercatat" : "Belum ada data",
        message:
          expense > 0
            ? "Ada pengeluaran, tetapi belum ada pemasukan pada periode ini."
            : "Catat transaksi untuk mendapatkan analisis keuangan.",
        recommendation:
          expense > 0
            ? "Periksa kembali periode dan transaksi pemasukan Anda."
            : "Mulai catat pemasukan dan pengeluaran Anda.",
        expenseRate: null,
        isWarning: expense > 0,
      };
    }

    const expenseRate = Math.round((expense / income) * 100);
    const isDeficit = expense > income;
    const isWarning = isDeficit || expenseRate >= 70;

    return {
      title: isDeficit
        ? "Pengeluaran melebihi pemasukan"
        : isWarning
          ? "Pengeluaran cukup tinggi"
          : "Arus kas terjaga",
      message: isDeficit
        ? `Pengeluaran lebih besar ${formatRupiah(expense - income)} dari pemasukan periode ini.`
        : `${expenseRate}% pemasukan digunakan untuk pengeluaran periode ini.`,
      recommendation: isWarning
        ? topCategory
          ? `Tinjau kembali pengeluaran pada kategori ${topCategory.name}.`
          : "Tinjau kembali pengeluaran agar tidak melebihi pemasukan."
        : summary.total_saved > 0
          ? "Pertahankan pola ini dan jaga saldo kantong tabungan Anda."
          : "Sisihkan sebagian sisa pemasukan ke kantong tabungan.",
      expenseRate,
      isWarning,
    };
  }, [summary, categoryExpenseData]);

  const savingsPockets = React.useMemo(
    () =>
      pockets
        .filter((pocket) => {
          const name = (pocket.name || "").toLowerCase();
          return (
            Number(pocket.target_amount || 0) > 0 ||
            pocket.icon === "PiggyBank" ||
            pocket.icon === "Target" ||
            name.includes("tabungan") ||
            name.includes("target") ||
            name.includes("simpanan")
          );
        })
        .sort((a, b) => b.current_balance - a.current_balance),
    [pockets]
  );

  const selectedExpenseCategory =
    categoryExpenseData.find((category) => category.name === selectedExpenseCategoryName) ??
    categoryExpenseData[0];
  const selectedExpenseTransactionCount = selectedExpenseCategory
    ? unifiedActivities.filter(
        (activity) =>
          activity.type === "expense" &&
          (activity.category_name || "Lainnya") === selectedExpenseCategory.name
      ).length
    : 0;
  const selectedExpenseShare =
    selectedExpenseCategory && summary.total_expense > 0
      ? Math.round((selectedExpenseCategory.value / summary.total_expense) * 100)
      : 0;

  // ─── LOADING ───
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Loading key={i} variant="skeleton" className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Loading variant="skeleton" className="h-80 lg:col-span-2 rounded-2xl" />
          <Loading variant="skeleton" className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* MOBILE GREETING */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-zinc-400">Selamat Datang 👋</div>
            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {summary.total_balance > 0 ? "Keuangan Pribadi" : "Smart Finance"}
            </h2>
          </div>
        </div>
        <PeriodFilterPills />
      </div>

      {/* 1. TOP METRICS & HERO CARD */}
      <section className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-800 p-5 sm:p-7 text-white shadow-xl shadow-blue-500/20 transition-all">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-100">
              Total Balance Smart Finance
            </span>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>

          <div className="mt-2.5 sm:mt-4">
            <div className="text-2xl sm:text-4xl font-black tracking-tight font-number truncate">
              {formatRupiah(summary.total_balance)}
            </div>
            <p className="mt-1 text-xs text-blue-100/80">
              Terbagi dalam {pockets.length} pos kantong aktif
            </p>
          </div>

          <div className="sm:hidden mt-3.5 pt-3 border-t border-white/20 grid grid-cols-3 gap-1 text-center">
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wide block">Masuk</span>
              <span className="text-xs font-black text-white font-number truncate block">+{formatRupiah(summary.total_income)}</span>
            </div>
            <div className="min-w-0 border-x border-white/15 px-1">
              <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wide block">Keluar</span>
              <span className="text-xs font-black text-white font-number truncate block">-{formatRupiah(summary.total_expense)}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-violet-200 font-bold uppercase tracking-wide block">Ditabung</span>
              <span className="text-xs font-black text-white font-number truncate block">{formatRupiah(summary.total_saved)}</span>
            </div>
          </div>

          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={() => { setQuickActionType("income"); setIsQuickActionOpen(true); }} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-white/15 py-2.5 px-2 backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all text-xs font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-zinc-900 shrink-0"><ArrowDownLeft className="h-3.5 w-3.5 stroke-[3]" /></div>
              <span className="truncate">Pemasukan</span>
            </button>
            <button onClick={() => { setQuickActionType("saving"); setIsQuickActionOpen(true); }} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-white/15 py-2.5 px-2 backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all text-xs font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-zinc-900 shrink-0"><PiggyBank className="h-3.5 w-3.5 stroke-[3]" /></div>
              <span className="truncate">Nabung</span>
            </button>
            <button onClick={() => { setQuickActionType("expense"); setIsQuickActionOpen(true); }} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-white/15 py-2.5 px-2 backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all text-xs font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-400 text-zinc-900 shrink-0"><ArrowUpRight className="h-3.5 w-3.5 stroke-[3]" /></div>
              <span className="truncate">Pengeluaran</span>
            </button>
            <button onClick={() => { setQuickActionType("transfer"); setIsQuickActionOpen(true); }} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-white/15 py-2.5 px-2 backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all text-xs font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-300 text-zinc-900 shrink-0"><ArrowRightLeft className="h-3.5 w-3.5 stroke-[3]" /></div>
              <span className="truncate">Pindah Dana</span>
            </button>
          </div>

          <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* Desktop 3 Metric Cards */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          <Card className="rounded-3xl border-zinc-200/80 p-5 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pemasukan (Income)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"><ArrowDownLeft className="h-4 w-4" /></div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-number truncate">+{formatRupiah(summary.total_income)}</div>
              <p className="mt-0.5 text-[11px] text-zinc-400">Periode aktif terpilih</p>
            </div>
          </Card>
          <Card className="rounded-3xl border-zinc-200/80 p-5 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pengeluaran (Expense)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"><ArrowUpRight className="h-4 w-4" /></div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-number truncate">-{formatRupiah(summary.total_expense)}</div>
              <p className="mt-0.5 text-[11px] text-zinc-400">Dari alokasi kantong dana</p>
            </div>
          </Card>
          <Card className="rounded-3xl border-zinc-200/80 p-5 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Ditabung</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"><PiggyBank className="h-4 w-4" /></div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400 font-number truncate">{formatRupiah(summary.total_saved)}</div>
              <p className="mt-0.5 text-[11px] text-zinc-400">Disisihkan ke kantong target</p>
            </div>
          </Card>
        </div>
      </section>

      {/* 2. POCKET OVERVIEW */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Kantong Dana (Pockets)</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Alokasi dan saldo masing-masing pos keuangan Anda</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setIsPocketModalOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />} className="text-xs">Kantong Baru</Button>
            <Link href="/pockets"><Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />} className="text-xs">Lihat Semua</Button></Link>
          </div>
        </div>

        {pockets.length === 0 ? (
          <EmptyState icon="Wallet" title="Belum Ada Kantong Dana" description="Buat kantong pertama Anda untuk mulai memisahkan pos keuangan." actionLabel="Buat Kantong Sekarang" onAction={() => setIsPocketModalOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pocketGroups.map(({ key, pockets: group }) => {
              const pocket = group[0];
              const groupBalance = group.reduce((total, item) => total + item.current_balance, 0);
              const groupTarget = group.reduce((total, item) => total + Number(item.target_amount || 0), 0);
              const groupProgress = groupTarget > 0 ? Math.max(0, Math.min(100, (groupBalance / groupTarget) * 100)) : 0;

              return (
              <Link key={key} href={`/pockets/${pocket.id}`} className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/90">
                <div>
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: pocket.color }}>
                        <IconRenderer name={pocket.icon} size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{pocket.name}</h4>
                        <p className="line-clamp-2 break-words truncate text-xs text-zinc-500 dark:text-zinc-400">{pocket.description || "Kantong Keuangan"}</p>
                        {group.length > 1 && <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">{group.length} record</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Saldo Saat Ini</span>
                    <div className="text-xl font-bold font-number text-zinc-900 dark:text-zinc-50">{formatRupiah(groupBalance)}</div>
                  </div>
                </div>
                {groupTarget > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-zinc-500 dark:text-zinc-400">Target: {formatRupiah(groupTarget)}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{formatPercentage(groupProgress)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${groupProgress}%`, backgroundColor: pocket.color }} />
                    </div>
                  </div>
                )}
              </Link>
              );
            })}
            <button onClick={() => setIsPocketModalOpen(true)} className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 p-5 text-zinc-500 transition-all hover:border-blue-500 hover:text-blue-600 dark:border-zinc-800 dark:hover:border-blue-500 dark:text-zinc-400 dark:hover:text-blue-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800"><Plus className="h-5 w-5" /></div>
              <span className="text-xs font-bold">Tambah Kantong Dana</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. CHARTS & CASHFLOW */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="rounded-3xl p-5 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Ringkasan Arus Kas</CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Perbandingan pemasukan, pengeluaran &amp; tabungan</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">Periode: {period}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}jt`} />
                  <Tooltip formatter={(val) => [formatRupiah(Number(val)), "Nominal"]} contentStyle={{ backgroundColor: "rgba(24, 24, 27, 0.95)", borderRadius: "12px", color: "#fff", border: "none" }} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl p-5 sm:p-6 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base">Analisis Keuangan</CardTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Ringkasan periode ini</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pt-1">
            <div role="tablist" aria-label="Pilih analisis keuangan" className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
              <button
                id="insight-expense-tab"
                type="button"
                role="tab"
                aria-selected={activeInsightTab === "expense"}
                aria-controls="insight-panel"
                onClick={() => setActiveInsightTab("expense")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${activeInsightTab === "expense" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"}`}
              >
                Pengeluaran
              </button>
              <button
                id="insight-savings-tab"
                type="button"
                role="tab"
                aria-selected={activeInsightTab === "savings"}
                aria-controls="insight-panel"
                onClick={() => setActiveInsightTab("savings")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${activeInsightTab === "savings" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"}`}
              >
                Tabungan
              </button>
            </div>

            <div id="insight-panel" role="tabpanel" aria-labelledby={activeInsightTab === "expense" ? "insight-expense-tab" : "insight-savings-tab"} className="mt-3 flex-1">
              {activeInsightTab === "expense" ? (
                <div className="space-y-3">
                  <div className={`rounded-xl p-3 ${expenseInsight.expenseRate === null ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" : expenseInsight.isWarning ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"}`}>
                    <div className="flex items-start gap-2">
                      {expenseInsight.expenseRate === null ? <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" /> : expenseInsight.isWarning ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-snug">{expenseInsight.title}</p>
                        <p className="mt-1 text-xs leading-relaxed opacity-90">{expenseInsight.message}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">Porsi pemasukan terpakai</span>
                      <span className="shrink-0 font-bold text-zinc-900 dark:text-zinc-100">
                        {expenseInsight.expenseRate === null ? "—" : `${expenseInsight.expenseRate}%`}
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                      role="progressbar"
                      aria-label="Porsi pemasukan yang digunakan untuk pengeluaran"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(100, Math.max(0, expenseInsight.expenseRate ?? 0))}
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${expenseInsight.isWarning ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, Math.max(0, expenseInsight.expenseRate ?? 0))}%` }}
                      />
                    </div>
                  </div>
                  {categoryExpenseData[0] && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryExpenseData[0].color }} />
                        <span className="truncate text-xs text-zinc-600 dark:text-zinc-300">Terbesar: {categoryExpenseData[0].name}</span>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-zinc-900 dark:text-zinc-100">{formatRupiah(categoryExpenseData[0].value)}</span>
                    </div>
                  )}
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Rekomendasi: </span>
                    {expenseInsight.recommendation}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
                    <p className="text-xs text-blue-700 dark:text-blue-300">Saldo di kantong tabungan</p>
                    <p className="mt-1 text-xl font-bold font-number text-zinc-900 dark:text-zinc-100">{formatRupiah(summary.total_saved)}</p>
                  </div>
                  {savingsPockets.length > 0 ? (
                    <div className="space-y-2">
                      {savingsPockets.slice(0, 2).map((pocket) => (
                        <Link key={pocket.id} href={`/pockets/${pocket.id}`} className="block rounded-lg border border-zinc-100 px-3 py-2 transition-colors hover:border-blue-200 hover:bg-blue-50/50 dark:border-zinc-800 dark:hover:border-blue-900 dark:hover:bg-blue-950/20">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{pocket.name}</span>
                            <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100">{formatRupiah(pocket.current_balance)}</span>
                          </div>
                          {pocket.target_amount > 0 && (
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                              <div className="h-full rounded-full bg-blue-500 transition-[width]" style={{ width: `${Math.max(0, Math.min(100, pocket.progress_percentage))}%` }} />
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link href="/pockets" className="flex items-center justify-between rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-zinc-700 dark:text-blue-400 dark:hover:bg-blue-950/20">
                      Belum ada kantong tabungan <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Rekomendasi: </span>
                    {summary.total_income > summary.total_expense
                      ? `Ada sisa pemasukan ${formatRupiah(summary.total_income - summary.total_expense)}. Pertimbangkan menambahkannya ke target tabungan.`
                      : summary.total_income === 0 && summary.total_expense === 0
                        ? "Catat transaksi untuk melihat perkembangan saldo tabungan Anda."
                        : "Jaga pengeluaran agar arus kas kembali positif sebelum menambah target tabungan."}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-4">
              <button
                type="button"
                onClick={() => setIsInsightModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Sparkles className="h-3.5 w-3.5" /> Rincian
              </button>
              <Link
                href="/predict"
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Prediksi lengkap <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-2">
              <CardTitle>Alokasi Pengeluaran</CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Top kategori pengeluaran terbesar</p>
            </CardHeader>
            <CardContent className="pt-2">
              {categoryExpenseData.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-center text-xs text-zinc-400">
                  <Sparkles className="h-8 w-8 mb-2 opacity-50" />
                  Belum ada pengeluaran di periode ini
                </div>
              ) : (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryExpenseData} innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                        {categoryExpenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => [formatRupiah(Number(val)), "Total"]} contentStyle={{ backgroundColor: "rgba(24, 24, 27, 0.95)", borderRadius: "12px", color: "#fff", border: "none" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </div>
          {categoryExpenseData.length > 0 && (
            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
              {categoryExpenseData.slice(0, 3).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="font-semibold font-number text-zinc-900 dark:text-zinc-100">{formatRupiah(item.value)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. PREDIKSI & ANALISIS AI
          Kolom yang dianalisis:
          • total_income ↔ total_expense  → health score (bobot 40+35 poin)
          • total_balance                 → bonus skor & basis proyeksi
          • income - expense              → net cashflow & proyeksi saldo
          • categoryExpenseData[0]        → kategori pengeluaran dominan
          • (income-expense)/income×100   → saving rate vs benchmark 20%
          ═══════════════════════════════════════════════════════════════ */}
      <section hidden>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                <Brain className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Prediksi &amp; Analisis AI
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 ml-10">
              Berdasarkan relasi pemasukan, pengeluaran &amp; tabungan periode ini
            </p>
          </div>
          <Link href="/predict">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />} className="text-xs shrink-0">
              Detail Prediksi
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">

          {/* ── CARD A: Skor Kesehatan Finansial ── */}
          <Card className="rounded-3xl overflow-hidden border-zinc-200/80 dark:border-zinc-800/80 flex flex-col">
            <div className={`h-1.5 w-full bg-gradient-to-r ${health.bg}`} />
            <CardContent className="p-5 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Skor Kesehatan Finansial
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    income · expense · balance
                  </p>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white shrink-0"
                  style={{ backgroundColor: health.color }}
                >
                  <Brain className="h-4 w-4" />
                </div>
              </div>

              {/* Radial Gauge + stats */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      startAngle={220}
                      endAngle={-40}
                      data={[
                        { value: 100, fill: "#e2e8f0" },
                        ...healthRadialData,
                      ]}
                      barSize={11}
                    >
                      <RadialBar dataKey="value" background={false} cornerRadius={6} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-[26px] font-black font-number leading-none"
                      style={{ color: health.color }}
                    >
                      {health.score}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-bold">/100</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                    style={{ backgroundColor: health.color }}
                  >
                    {health.label}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">Rasio Tabungan</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {summary.total_income > 0
                          ? `${Math.max(0, Math.round(((summary.total_income - summary.total_expense) / summary.total_income) * 100))}%`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">Rasio Pengeluaran</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {summary.total_income > 0
                          ? `${Math.min(100, Math.round((summary.total_expense / summary.total_income) * 100))}%`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">Bonus Saldo</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {summary.total_balance > 0 ? "+25 poin" : "0 poin"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip box */}
              <div className="mt-auto rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-3 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                💡 {health.tip}
              </div>
            </CardContent>
          </Card>

          {/* ── CARD B: Proyeksi Saldo Berikutnya ── */}
          <Card className="rounded-3xl overflow-hidden border-zinc-200/80 dark:border-zinc-800/80 flex flex-col">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-blue-600" />
            <CardContent className="p-5 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Proyeksi Saldo Berikutnya
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    saldo + (income − expense)
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
                  <Target className="h-4 w-4" />
                </div>
              </div>

              {/* Projected value */}
              <div className="mb-1">
                <div className="text-[11px] text-zinc-500 mb-0.5">Estimasi Saldo Setelah Periode</div>
                <div className="text-2xl sm:text-3xl font-black font-number text-zinc-900 dark:text-zinc-100 truncate">
                  {formatRupiah(Math.max(0, projectionData.projectedBalance))}
                </div>
                <div
                  className={`flex items-center gap-1 mt-1 text-xs font-semibold ${
                    projectionData.growth >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {projectionData.growth >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {projectionData.growth >= 0 ? "+" : ""}
                    {projectionData.growth.toFixed(1)}% dari saldo saat ini
                  </span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-3 mt-5">
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-zinc-500">Saldo Saat Ini</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 font-number">
                      {formatRupiah(summary.total_balance)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-700 w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-zinc-500">Net Cashflow Periode</span>
                    <span
                      className={`font-bold font-number ${
                        projectionData.net >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {projectionData.net >= 0 ? "+" : ""}
                      {formatRupiah(projectionData.net)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        projectionData.net >= 0
                          ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                          : "bg-gradient-to-r from-rose-400 to-red-500"
                      }`}
                      style={{
                        width:
                          summary.total_income > 0
                            ? `${Math.min(
                                100,
                                Math.abs(
                                  (projectionData.net / summary.total_income) * 100
                                )
                              )}%`
                            : "50%",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-zinc-500">Total Ditabung</span>
                    <span className="font-bold text-violet-600 dark:text-violet-400 font-number">
                      {formatRupiah(summary.total_saved)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-700"
                      style={{
                        width:
                          summary.total_income > 0
                            ? `${Math.min(100, (summary.total_saved / summary.total_income) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 p-3 text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                📊 Proyeksi berdasarkan saldo aktif + selisih bersih income &amp; expense periode ini.
              </div>
            </CardContent>
          </Card>

          {/* ── CARD C: Insight Penghematan ── */}
          <Card className="rounded-3xl overflow-hidden border-zinc-200/80 dark:border-zinc-800/80 flex flex-col">
            <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-purple-600" />
            <CardContent className="p-5 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Insight Penghematan
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    saving rate &amp; kategori dominan
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
              </div>

              {/* Saving Rate bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Saving Rate</span>
                  <span
                    className={`text-lg font-black font-number ${
                      savingInsight.rate >= 20
                        ? "text-emerald-600 dark:text-emerald-400"
                        : savingInsight.rate >= 10
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {savingInsight.rate}%
                  </span>
                </div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      savingInsight.rate >= 20
                        ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                        : savingInsight.rate >= 10
                        ? "bg-gradient-to-r from-amber-400 to-orange-500"
                        : "bg-gradient-to-r from-rose-400 to-red-500"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, savingInsight.rate))}%` }}
                  />
                  {/* 20% ideal marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-zinc-500/50"
                    style={{ left: "20%" }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] mt-1.5 text-zinc-400">
                  <span>0%</span>
                  <span className="font-semibold text-zinc-500">▲ Ideal 20%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Status alert */}
              <div className="mb-4">
                {savingInsight.rate >= 20 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Target saving 20% tercapai! Luar biasa 🎉
                  </div>
                ) : savingInsight.rate >= 10 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <TrendingUp className="h-4 w-4 shrink-0" />
                    Butuh +{savingInsight.gap}% lagi untuk capai target 20%
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Saving rate sangat rendah — efisienkan pengeluaran
                  </div>
                )}
              </div>

              {/* Top spending category */}
              <div className="mt-auto space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Kategori Pengeluaran Terbesar
                </p>
                {savingInsight.topCat ? (
                  <>
                    <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-3.5 w-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: savingInsight.topCat.color }}
                        />
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">
                          {savingInsight.topCat.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <div className="text-xs font-black font-number text-rose-600 dark:text-rose-400">
                          {formatRupiah(savingInsight.topCat.value)}
                        </div>
                        {summary.total_income > 0 && (
                          <div className="text-[10px] text-zinc-400">
                            {Math.round(
                              (savingInsight.topCat.value / summary.total_income) * 100
                            )}% dari income
                          </div>
                        )}
                      </div>
                    </div>
                    {savingInsight.dominantWarning > 50 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Lebih dari 50% income tersedot ke 1 kategori!
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-3 text-[11px] text-zinc-500 text-center">
                    Belum ada data pengeluaran di periode ini
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. RECENT TRANSACTIONS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Aktivitas Finansial Terbaru</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Riwayat pemasukan, pengeluaran &amp; tabungan terakhir</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="primary" size="sm" onClick={() => setIsQuickActionOpen(true)} leftIcon={<Plus className="h-4 w-4" />} className="text-xs">
              Catat Transaksi
            </Button>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />} className="text-xs">Buka Transaksi</Button>
            </Link>
          </div>
        </div>

        {unifiedActivities.length === 0 ? (
          <EmptyState icon="Receipt" title="Belum Ada Transaksi" description="Mulai catat pemasukan, pengeluaran, atau aktivitas menabung pertama Anda." actionLabel="Catat Sekarang" onAction={() => setIsQuickActionOpen(true)} />
        ) : (
          <Card className="rounded-3xl p-0 overflow-hidden border-zinc-200/80 dark:border-zinc-800/80">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {unifiedActivities.slice(0, 7).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 sm:px-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${activity.type === "income" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" : activity.type === "expense" ? "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400" : "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"}`}>
                      {activity.type === "income" ? <ArrowDownLeft className="h-5 w-5 stroke-[2.5]" /> : activity.type === "expense" ? <ArrowUpRight className="h-5 w-5 stroke-[2.5]" /> : <ArrowRightLeft className="h-5 w-5 stroke-[2.5]" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-bold text-sm text-zinc-900 dark:text-zinc-100">{activity.title}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span>{formatDate(activity.date)}</span>
                        <span>&bull;</span>
                        {activity.type === "transfer" ? (
                          <span className="font-medium text-violet-600 dark:text-violet-400">{activity.from_pocket_name} → {activity.to_pocket_name}</span>
                        ) : (
                          <>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{activity.pocket_name}</span>
                            <span>&bull;</span>
                            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 text-[11px]">{activity.category_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <div className={`text-sm sm:text-base font-extrabold font-number ${activity.type === "income" ? "text-emerald-600 dark:text-emerald-400" : activity.type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-violet-600 dark:text-violet-400"}`}>
                      {activity.type === "income" ? `+${formatRupiah(activity.amount)}` : activity.type === "expense" ? `-${formatRupiah(activity.amount)}` : `↗ ${formatRupiah(activity.amount)}`}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-400 capitalize">
                      {activity.type === "income" ? "Pemasukan" : activity.type === "expense" ? "Pengeluaran" : "Transfer"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* Modals */}
      <PocketModal isOpen={isPocketModalOpen} onClose={() => setIsPocketModalOpen(false)} />
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => { setIsQuickActionOpen(false); setQuickActionType(null); }}
        defaultAction={quickActionType}
      />
      <Modal
        isOpen={isInsightModalOpen}
        onClose={() => setIsInsightModalOpen(false)}
        title="Rincian Analisis Keuangan"
        description="Jelajahi pengeluaran dan saldo tabungan pada data Anda."
        maxWidth="2xl"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-600 p-4 text-white">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">Ringkasan kondisi finansial</p>
              <p className="mt-0.5 text-xs text-blue-50">Pilih fokus untuk melihat rincian dan rekomendasi.</p>
            </div>
          </div>

          <div role="tablist" aria-label="Fokus rincian analisis" className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              id="insight-modal-expense-tab"
              type="button"
              role="tab"
              aria-selected={activeInsightTab === "expense"}
              aria-controls="insight-modal-panel"
              onClick={() => setActiveInsightTab("expense")}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${activeInsightTab === "expense" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"}`}
            >
              Pengeluaran
            </button>
            <button
              id="insight-modal-savings-tab"
              type="button"
              role="tab"
              aria-selected={activeInsightTab === "savings"}
              aria-controls="insight-modal-panel"
              onClick={() => setActiveInsightTab("savings")}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${activeInsightTab === "savings" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"}`}
            >
              Tabungan
            </button>
          </div>

          <div
            id="insight-modal-panel"
            role="tabpanel"
            aria-labelledby={activeInsightTab === "expense" ? "insight-modal-expense-tab" : "insight-modal-savings-tab"}
          >
            {activeInsightTab === "expense" ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Pemasukan</p>
                    <p className="mt-1 truncate text-base font-bold font-number text-emerald-600 dark:text-emerald-400">{formatRupiah(summary.total_income)}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Pengeluaran</p>
                    <p className="mt-1 truncate text-base font-bold font-number text-rose-600 dark:text-rose-400">{formatRupiah(summary.total_expense)}</p>
                  </div>
                </div>

                <div className={`rounded-xl p-3 ${expenseInsight.expenseRate === null ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" : expenseInsight.isWarning ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"}`}>
                  <div className="flex items-start gap-2">
                    {expenseInsight.expenseRate === null ? <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" /> : expenseInsight.isWarning ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                    <div>
                      <p className="text-sm font-bold">{expenseInsight.title}</p>
                      <p className="mt-1 text-xs leading-relaxed">{expenseInsight.message}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span>Porsi pemasukan terpakai</span>
                    <span className="font-bold">{expenseInsight.expenseRate === null ? "—" : `${expenseInsight.expenseRate}%`}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-black/20">
                    <div
                      className="h-full rounded-full bg-current transition-[width] duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, expenseInsight.expenseRate ?? 0))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Kategori pengeluaran</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Pilih kategori untuk melihat porsinya.</p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-500">{categoryExpenseData.length} kategori</span>
                  </div>
                  {categoryExpenseData.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {categoryExpenseData.map((category) => {
                        const share = summary.total_expense > 0
                          ? Math.round((category.value / summary.total_expense) * 100)
                          : 0;
                        const isSelected = (selectedExpenseCategory?.name ?? null) === category.name;
                        return (
                          <button
                            key={category.name}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSelectedExpenseCategoryName(category.name)}
                            className={`rounded-xl border p-3 text-left transition-colors ${isSelected ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                                <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">{category.name}</span>
                              </span>
                              <span className="shrink-0 text-xs font-semibold text-zinc-900 dark:text-zinc-100">{formatRupiah(category.value)}</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
                              <div className="h-full rounded-full transition-[width]" style={{ width: `${share}%`, backgroundColor: category.color }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700">
                      Belum ada pengeluaran di periode ini.
                    </div>
                  )}
                </div>

                {selectedExpenseCategory && (
                  <div className="flex flex-col gap-2 rounded-xl bg-zinc-900 p-4 text-white dark:bg-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: selectedExpenseCategory.color }} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{selectedExpenseCategory.name}</p>
                        <p className="text-xs text-zinc-300">{selectedExpenseTransactionCount} transaksi · {selectedExpenseShare}% dari pengeluaran</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold font-number sm:text-right">{formatRupiah(selectedExpenseCategory.value)}</p>
                  </div>
                )}

                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Rekomendasi: </span>
                  {expenseInsight.recommendation}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Saldo pada kantong tabungan dan target</p>
                  <p className="mt-1 text-2xl font-bold font-number text-zinc-900 dark:text-zinc-100">{formatRupiah(summary.total_saved)}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Saldo berjalan, bukan akumulasi tabungan pada periode terpilih.</p>
                </div>
                {savingsPockets.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Kantong tabungan</h3>
                    {savingsPockets.map((pocket) => (
                      <Link key={pocket.id} href={`/pockets/${pocket.id}`} className="block rounded-xl border border-zinc-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-800 dark:hover:border-blue-800 dark:hover:bg-blue-950/20">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">{pocket.name}</span>
                          <span className="shrink-0 text-sm font-bold font-number text-zinc-900 dark:text-zinc-100">{formatRupiah(pocket.current_balance)}</span>
                        </div>
                        {pocket.target_amount > 0 && (
                          <div className="mt-2">
                            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                              <span>Target {formatRupiah(pocket.target_amount)}</span>
                              <span>{formatPercentage(pocket.progress_percentage)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
                              <div className="h-full rounded-full bg-blue-500 transition-[width]" style={{ width: `${Math.max(0, Math.min(100, pocket.progress_percentage))}%` }} />
                            </div>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link href="/pockets" className="flex items-center justify-between rounded-xl border border-dashed border-zinc-300 p-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:border-zinc-700 dark:text-blue-400 dark:hover:bg-blue-950/20">
                    Buat kantong tabungan pertama <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Rekomendasi: </span>
                  {summary.total_income > summary.total_expense
                    ? `Ada sisa pemasukan ${formatRupiah(summary.total_income - summary.total_expense)}. Pertimbangkan menambahkannya ke target tabungan.`
                    : summary.total_income === 0 && summary.total_expense === 0
                      ? "Catat transaksi untuk melihat perkembangan saldo tabungan Anda."
                      : "Jaga pengeluaran agar arus kas kembali positif sebelum menambah target tabungan."}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/predict" className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Buka prediksi lengkap <ArrowRight className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => setIsInsightModalOpen(false)} className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">
              Selesai
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
