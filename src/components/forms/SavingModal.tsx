"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incomeSchema, IncomeFormData } from "@/lib/validations/finance";
import { useFinance } from "@/context/FinanceContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RupiahInput } from "@/components/ui/RupiahInput";
import { Select } from "@/components/ui/Select";
import { PiggyBank } from "lucide-react";

interface SavingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPocketId?: string;
}

export function SavingModal({
  isOpen,
  onClose,
  defaultPocketId,
}: SavingModalProps) {
  const { pockets, categories, addIncome } = useFinance();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const incomeCategory = categories.find(
    (category) => category.type === "income",
  );
  const savingPockets = React.useMemo(() => {
    const targetPockets = pockets.filter(
      (pocket) =>
        pocket.target_amount > 0 ||
        pocket.icon === "PiggyBank" ||
        pocket.icon === "Target",
    );
    return targetPockets.length > 0 ? targetPockets : pockets;
  }, [pockets]);
  const savingPocketId = defaultPocketId || savingPockets[0]?.id || "";
  const incomeCategoryId = incomeCategory?.id || "";

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: 0,
      title: "Menabung",
      pocket_id: savingPocketId,
      category_id: incomeCategoryId,
      transaction_date: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        amount: 0,
        title: "Menabung",
        pocket_id: savingPocketId,
        category_id: incomeCategoryId,
        transaction_date: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
  }, [isOpen, savingPocketId, incomeCategoryId, reset]);

  const onSubmit = async (data: IncomeFormData) => {
    if (!incomeCategory) return;
    setIsSubmitting(true);
    const success = await addIncome({
      ...data,
      category_id: incomeCategory.id,
    });
    setIsSubmitting(false);
    if (success) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Tabungan"
      description="Catat uang yang Anda simpan ke kantong tabungan atau kaleng."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <RupiahInput
              label="Nominal Tabungan"
              value={field.value}
              onChange={field.onChange}
              error={errors.amount?.message}
              placeholder="Contoh: 500.000"
              autoFocus
            />
          )}
        />

        <Input
          label="Tujuan Menabung"
          placeholder="Misal: Dana Laptop, Dana Darurat"
          error={errors.title?.message}
          {...register("title")}
        />

        <Select
          label="Kantong Tabungan"
          error={errors.pocket_id?.message}
          {...register("pocket_id")}
        >
          {savingPockets.map((pocket) => (
            <option key={pocket.id} value={pocket.id}>
              {pocket.name}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          label="Tanggal Menabung"
          error={errors.transaction_date?.message}
          {...register("transaction_date")}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
            rows={2}
            placeholder="Catatan tabungan..."
            {...register("description")}
          />
        </div>

        <div className="sticky bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm pt-3 pb-1 -mx-4 -mb-4 px-4 sm:-mx-6 sm:-mb-6 sm:px-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={!incomeCategory}
            leftIcon={<PiggyBank className="h-4 w-4" />}
            className="font-semibold shadow-md shadow-amber-500/20"
          >
            Simpan Tabungan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
