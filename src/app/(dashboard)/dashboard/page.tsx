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
} from "recharts";

import { PeriodFilterPills } from "@/components/shared/PeriodFilterPills";

export default function DashboardPage() {
  const { pockets, categories, unifiedActivities, summary, period, isLoading } =
    useFinance();
  const [isPocketModalOpen, setIsPocketModalOpen] = React.useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = React.useState(false);
  const [quickActionType, setQuickActionType] = React.useState<
    "income" | "expense" | "transfer" | "saving" | null
  >(null);

  // Prepare Category Spending Chart Data
  const categoryExpenseData = React.useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> =
      {};

    unifiedActivities
      .filter((a) => a.type === "expense")
      .forEach((item) => {
        const catName = item.category_name || "Lainnya";
        const color = item.category_color || "#64748B";
        if (!map[catName]) {
          map[catName] = { name: catName, value: 0, color };
        }
        map[catName].value += item.amount;
      });

    return Object.values(map)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [unifiedActivities]);

  // Prepare Cashflow Bar Chart Data
  const cashflowChartData = React.useMemo(() => {
    return [
      { name: "Pemasukan", amount: summary.total_income, fill: "#10B981" },
      { name: "Pengeluaran", amount: summary.total_expense, fill: "#F43F5E" },
      { name: "Ditabung", amount: summary.total_saved, fill: "#8B5CF6" },
    ];
  }, [summary]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Loading key={i} variant="skeleton" className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Loading
            variant="skeleton"
            className="h-80 lg:col-span-2 rounded-2xl"
          />
          <Loading variant="skeleton" className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* MOBILE NATIVE GREETING & HERO CARD */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-zinc-400">
              Selamat Datang 👋
            </div>
            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {summary.total_balance > 0 ? "Keuangan Pribadi" : "Smart Finance"}
            </h2>
          </div>
        </div>
        <PeriodFilterPills />
      </div>

      {/* 1. TOP METRICS & MOBILE APP HERO CARD */}
      <section className="space-y-4">
        {/* Main Wallet Hero Card */}
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

          {/* Mobile-only Compact Stats Row inside Card */}
          <div className="sm:hidden mt-3.5 pt-3 border-t border-white/20 grid grid-cols-3 gap-1 text-center">
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wide block">
                Masuk
              </span>
              <span className="text-xs font-black text-white font-number truncate block">
                +{formatRupiah(summary.total_income)}
              </span>
            </div>
            <div className="min-w-0 border-x border-white/15 px-1">
              <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wide block">
                Keluar
              </span>
              <span className="text-xs font-black text-white font-number truncate block">
                -{formatRupiah(summary.total_expense)}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-violet-200 font-bold uppercase tracking-wide block">
                Ditabung
              </span>
              <span className="text-xs font-black text-white font-number truncate block">
                {formatRupiah(summary.total_saved)}
              </span>
            </div>
          </div>

          {/* Quick Action Embedded Buttons inside Card */}
          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => {
                setQuickActionType("income");
                setIsQuickActionOpen(true);
              }}
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-white/15 py-2.5 px-2 backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all text-xs font-bold"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-zinc-900 shrink-0">
                <ArrowDownLeft className="h-3.5 w-3.5 stroke-[3]" />
              </div>
              <span className="truncate">Pemasukan</span>
            </button>

            <button
              onClick={() => {
                setQuickActionType("saving");
                setIsQuickActionOpen(true);
              }}
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-white/15 py-2.5 px-2 backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all text-xs font-bold"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-zinc-900 shrink-0">
                <PiggyBank className="h-3.5 w-3.5 stroke-[3]" />
              </div>
              <span className="truncate">Nabung</span>
            </button>

            <button
              onClick={() => {
                setQuickActionType("expense");
                setIsQuickActionOpen(true);
              }}
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-white/15 py-2.5 px-2 backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all text-xs font-bold"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-400 text-zinc-900 shrink-0">
                <ArrowUpRight className="h-3.5 w-3.5 stroke-[3]" />
              </div>
              <span className="truncate">Pengeluaran</span>
            </button>

            <button
              onClick={() => {
                setQuickActionType("transfer");
                setIsQuickActionOpen(true);
              }}
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-white/15 py-2.5 px-2 backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all text-xs font-bold"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-300 text-zinc-900 shrink-0">
                <ArrowRightLeft className="h-3.5 w-3.5 stroke-[3]" />
              </div>
              <span className="truncate">Transfer</span>
            </button>
          </div>

          <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* 3 Metric Cards Grid (Desktop / Tablet only) */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          {/* Total Income Card */}
          <Card className="rounded-3xl border-zinc-200/80 p-5 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Pemasukan (Income)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-number truncate">
                +{formatRupiah(summary.total_income)}
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Periode aktif terpilih
              </p>
            </div>
          </Card>

          {/* Total Expense Card */}
          <Card className="rounded-3xl border-zinc-200/80 p-5 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Pengeluaran (Expense)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-number truncate">
                -{formatRupiah(summary.total_expense)}
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Dari alokasi kantong dana
              </p>
            </div>
          </Card>

          {/* Total Saved Card */}
          <Card className="rounded-3xl border-zinc-200/80 p-5 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Total Ditabung
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400 font-number truncate">
                {formatRupiah(summary.total_saved)}
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Disisihkan ke kantong target
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* 2. POCKET OVERVIEW SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Kantong Dana (Pockets)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Alokasi dan saldo masing-masing pos keuangan Anda
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPocketModalOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              Kantong Baru
            </Button>
            <Link href="/pockets">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                Lihat Semua
              </Button>
            </Link>
          </div>
        </div>

        {pockets.length === 0 ? (
          <EmptyState
            icon="Wallet"
            title="Belum Ada Kantong Dana"
            description="Buat kantong pertama Anda untuk mulai memisahkan pos keuangan."
            actionLabel="Buat Kantong Sekarang"
            onAction={() => setIsPocketModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pockets.map((pocket) => (
              <Link
                key={pocket.id}
                href={`/pockets/${pocket.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/90"
              >
                <div>
                  {/* Pocket Header */}
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: pocket.color }}
                      >
                        <IconRenderer name={pocket.icon} size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {pocket.name}
                        </h4>
                        <p className="line-clamp-2 break-words truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {pocket.description || "Kantong Keuangan"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Saldo */}
                  <div className="mt-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Saldo Saat Ini
                    </span>
                    <div className="text-xl font-bold font-number text-zinc-900 dark:text-zinc-50">
                      {formatRupiah(pocket.current_balance)}
                    </div>
                  </div>
                </div>

                {/* Target Progress Bar if target exists */}
                {pocket.target_amount > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Target: {formatRupiah(pocket.target_amount)}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatPercentage(pocket.progress_percentage)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, pocket.progress_percentage)}%`,
                          backgroundColor: pocket.color,
                        }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            ))}

            {/* Quick Add Pocket Card */}
            <button
              onClick={() => setIsPocketModalOpen(true)}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 p-5 text-zinc-500 transition-all hover:border-blue-500 hover:text-blue-600 dark:border-zinc-800 dark:hover:border-blue-500 dark:text-zinc-400 dark:hover:text-blue-400"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold">Tambah Kantong Dana</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. CHARTS & CASHFLOW VISUALIZATION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Breakdown Chart */}
        <Card className="lg:col-span-2 rounded-3xl p-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Ringkasan Arus Kas</CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Perbandingan pemasukan, pengeluaran & tabungan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">Periode: {period}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cashflowChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}jt`}
                  />
                  <Tooltip
                    formatter={(val) => [formatRupiah(Number(val)), "Nominal"]}
                    contentStyle={{
                      backgroundColor: "rgba(24, 24, 27, 0.95)",
                      borderRadius: "12px",
                      color: "#fff",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense by Category Chart */}
        <Card className="rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-2">
              <CardTitle>Alokasi Pengeluaran</CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Top kategori pengeluaran terbesar
              </p>
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
                      <Pie
                        data={categoryExpenseData}
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryExpenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [
                          formatRupiah(Number(val)),
                          "Total",
                        ]}
                        contentStyle={{
                          backgroundColor: "rgba(24, 24, 27, 0.95)",
                          borderRadius: "12px",
                          color: "#fff",
                          border: "none",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </div>

          {categoryExpenseData.length > 0 && (
            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
              {categoryExpenseData.slice(0, 3).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-[120px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-semibold font-number text-zinc-900 dark:text-zinc-100">
                    {formatRupiah(item.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* 4. RECENT TRANSACTIONS & ACTIVITIES */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Aktivitas Finansial Terbaru
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Riwayat pemasukan, pengeluaran & tabungan terakhir
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsQuickActionOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
              className="text-xs"
            >
              Catat Transaksi
            </Button>
            <Link href="/transactions">
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                Buka Transaksi
              </Button>
            </Link>
          </div>
        </div>

        {unifiedActivities.length === 0 ? (
          <EmptyState
            icon="Receipt"
            title="Belum Ada Transaksi"
            description="Mulai catat pemasukan, pengeluaran, atau aktivitas menabung pertama Anda."
            actionLabel="Catat Sekarang"
            onAction={() => setIsQuickActionOpen(true)}
          />
        ) : (
          <Card className="rounded-3xl p-0 overflow-hidden border-zinc-200/80 dark:border-zinc-800/80">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {unifiedActivities.slice(0, 7).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 sm:px-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {/* Left: Icon & Title & Pocket Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        activity.type === "income"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : activity.type === "expense"
                            ? "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                            : "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"
                      }`}
                    >
                      {activity.type === "income" ? (
                        <ArrowDownLeft className="h-5 w-5 stroke-[2.5]" />
                      ) : activity.type === "expense" ? (
                        <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                      ) : (
                        <ArrowRightLeft className="h-5 w-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="truncate font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {activity.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span>{formatDate(activity.date)}</span>
                        <span>&bull;</span>
                        {activity.type === "transfer" ? (
                          <span className="font-medium text-violet-600 dark:text-violet-400">
                            {activity.from_pocket_name} →{" "}
                            {activity.to_pocket_name}
                          </span>
                        ) : (
                          <>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {activity.pocket_name}
                            </span>
                            <span>&bull;</span>
                            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 text-[11px]">
                              {activity.category_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right pl-3 shrink-0">
                    <div
                      className={`text-sm sm:text-base font-extrabold font-number ${
                        activity.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : activity.type === "expense"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-violet-600 dark:text-violet-400"
                      }`}
                    >
                      {activity.type === "income"
                        ? `+${formatRupiah(activity.amount)}`
                        : activity.type === "expense"
                          ? `-${formatRupiah(activity.amount)}`
                          : `↗ ${formatRupiah(activity.amount)}`}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-400 capitalize">
                      {activity.type === "income"
                        ? "Pemasukan"
                        : activity.type === "expense"
                          ? "Pengeluaran"
                          : "Transfer"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* Modals */}
      <PocketModal
        isOpen={isPocketModalOpen}
        onClose={() => setIsPocketModalOpen(false)}
      />
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => {
          setIsQuickActionOpen(false);
          setQuickActionType(null);
        }}
        defaultAction={quickActionType}
      />
    </div>
  );
}
