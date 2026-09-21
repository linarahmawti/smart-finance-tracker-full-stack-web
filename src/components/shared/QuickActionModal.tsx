"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  PiggyBank,
} from "lucide-react";
import { IncomeModal } from "@/components/forms/IncomeModal";
import { ExpenseModal } from "@/components/forms/ExpenseModal";
import { TransferModal } from "@/components/forms/TransferModal";
import { SavingModal } from "@/components/forms/SavingModal";

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAction?: "income" | "expense" | "transfer" | "saving" | null;
}

export function QuickActionModal({
  isOpen,
  onClose,
  defaultAction = null,
}: QuickActionModalProps) {
  const [activeAction, setActiveAction] = React.useState<
    "income" | "expense" | "transfer" | "saving" | null
  >(defaultAction);

  React.useEffect(() => {
    if (isOpen) {
      setActiveAction(defaultAction);
    } else {
      setActiveAction(null);
    }
  }, [isOpen, defaultAction]);

  const handleSelect = (
    action: "income" | "expense" | "transfer" | "saving",
  ) => {
    setActiveAction(action);
  };

  return (
    <>
      <Modal
        isOpen={isOpen && activeAction === null}
        onClose={onClose}
        title="Pilih Jenis Aktivitas Keuangan"
        description="Pilih aktivitas finansial yang ingin Anda catat saat ini."
        maxWidth="md"
      >
        <div className="grid grid-cols-1 gap-3 py-2">
          {/* Income Button */}
          <button
            onClick={() => handleSelect("income")}
            className="group flex items-center justify-between rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4 text-left transition-all hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Tambah Pemasukan (Income)
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Gaji, hasil freelance, bonus, dividen, dan pendapatan lain.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              + Masuk
            </span>
          </button>

          {/* Expense Button */}
          <button
            onClick={() => handleSelect("expense")}
            className="group flex items-center justify-between rounded-2xl border border-rose-200/60 bg-rose-50/40 p-4 text-left transition-all hover:bg-rose-50 hover:border-rose-300 hover:shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20 dark:hover:bg-rose-950/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm shadow-rose-600/30 group-hover:scale-105 transition-transform">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Tambah Pengeluaran (Expense)
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Makan, belanja, tagihan, transportasi, dan kebutuhan lain.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              - Keluar
            </span>
          </button>

          {/* Transfer / Saving Button */}
          <button
            onClick={() => handleSelect("transfer")}
            className="group flex items-center justify-between rounded-2xl border border-violet-200/60 bg-violet-50/40 p-4 text-left transition-all hover:bg-violet-50 hover:border-violet-300 hover:shadow-sm dark:border-violet-900/40 dark:bg-violet-950/20 dark:hover:bg-violet-950/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-600/30 group-hover:scale-105 transition-transform">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Menabung / Transfer Dana
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Pindahkan uang antar-kantong dana atau sisihkan tabungan.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              → Pindah
            </span>
          </button>

          <button
            onClick={() => handleSelect("saving")}
            className="group flex items-center justify-between rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 text-left transition-all hover:bg-amber-50 hover:border-amber-300 hover:shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/30 group-hover:scale-105 transition-transform">
                <PiggyBank className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Tambah Tabungan
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sisihkan dana ke kantong target atau tabungan Anda.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              + Simpan
            </span>
          </button>
        </div>
      </Modal>

      {/* Sub Modals */}
      <IncomeModal
        isOpen={activeAction === "income"}
        onClose={() => {
          setActiveAction(null);
          onClose();
        }}
      />
      <ExpenseModal
        isOpen={activeAction === "expense"}
        onClose={() => {
          setActiveAction(null);
          onClose();
        }}
      />
      <TransferModal
        isOpen={activeAction === "transfer"}
        onClose={() => {
          setActiveAction(null);
          onClose();
        }}
      />
      <SavingModal
        isOpen={activeAction === "saving"}
        onClose={() => {
          setActiveAction(null);
          onClose();
        }}
      />
    </>
  );
}
