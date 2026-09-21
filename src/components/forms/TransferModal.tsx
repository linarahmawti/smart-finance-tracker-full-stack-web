"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferSchema, TransferFormData } from "@/lib/validations/finance";
import { useFinance } from "@/context/FinanceContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RupiahInput } from "@/components/ui/RupiahInput";
import { Select } from "@/components/ui/Select";
import { formatRupiah } from "@/lib/formatters";
import { ArrowRightLeft, AlertCircle, ArrowRight } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFromPocketId?: string;
  defaultToPocketId?: string;
}

export function TransferModal({
  isOpen,
  onClose,
  defaultFromPocketId,
  defaultToPocketId,
}: TransferModalProps) {
  const { pockets, addTransfer, getPocketById } = useFinance();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const defaultFrom = defaultFromPocketId || pockets[0]?.id || "";
  const defaultTo =
    defaultToPocketId || pockets.find((p) => p.id !== defaultFrom)?.id || "";

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      title: "Transfer Dana",
      from_pocket_id: defaultFrom,
      to_pocket_id: defaultTo,
      transfer_date: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  const fromPocketId = watch("from_pocket_id");
  const toPocketId = watch("to_pocket_id");
  const currentAmount = watch("amount");

  const fromPocket = getPocketById(fromPocketId);
  const toPocket = getPocketById(toPocketId);

  const isOverBudget = fromPocket && currentAmount > fromPocket.current_balance;
  const isSamePocket =
    fromPocketId && toPocketId && fromPocketId === toPocketId;

  React.useEffect(() => {
    if (isOpen) {
      reset({
        amount: 0,
        title: "Transfer Dana",
        from_pocket_id: defaultFrom,
        to_pocket_id: defaultTo,
        transfer_date: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
  }, [isOpen, defaultFrom, defaultTo]);

  const onSubmit = async (data: TransferFormData) => {
    if (isOverBudget || isSamePocket) return;
    setIsSubmitting(true);
    const success = await addTransfer(data);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Dana"
      description="Pindahkan dana antar-kantong secara instan tanpa memengaruhi total kekayaan."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nominal */}
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <RupiahInput
              label="Nominal Transfer"
              value={field.value}
              onChange={field.onChange}
              error={errors.amount?.message}
              placeholder="Contoh: 500.000"
              autoFocus
            />
          )}
        />

        {/* Source Pocket Balance Status */}
        {fromPocket && (
          <div
            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs ${
              isOverBudget
                ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900"
                : "bg-zinc-100/80 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              {isOverBudget && (
                <AlertCircle className="h-4 w-4 text-rose-500" />
              )}
              <span>Saldo Tersedia di {fromPocket.name}:</span>
            </div>
            <span className="font-bold font-number">
              {formatRupiah(fromPocket.current_balance)}
            </span>
          </div>
        )}

        {isSamePocket && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            Kantong asal dan kantong tujuan tidak boleh sama.
          </p>
        )}

        {/* Transfer Pathway Box */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <Select
              label="Dari Kantong (Sumber)"
              error={errors.from_pocket_id?.message}
              {...register("from_pocket_id")}
            >
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatRupiah(p.current_balance)})
                </option>
              ))}
            </Select>

            <Select
              label="Ke Kantong (Tujuan)"
              error={errors.to_pocket_id?.message}
              {...register("to_pocket_id")}
            >
              {pockets.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  disabled={p.id === fromPocketId}
                >
                  {p.name}{" "}
                  {p.target_amount > 0
                    ? `(Target: ${formatRupiah(p.target_amount)})`
                    : ""}
                </option>
              ))}
            </Select>
          </div>

          {fromPocket && toPocket && !isSamePocket && (
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 py-2 rounded-xl border border-violet-200/60 dark:border-violet-800/40">
              <span className="font-semibold">{fromPocket.name}</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="font-semibold">{toPocket.name}</span>
            </div>
          )}
        </div>

        {/* Judul Transfer */}
        <Input
          label="Judul / Keterangan"
          placeholder="Misal: Pindah ke kantong belanja"
          error={errors.title?.message}
          {...register("title")}
        />

        {/* Tanggal */}
        <Input
          type="date"
          label="Tanggal Transfer"
          error={errors.transfer_date?.message}
          {...register("transfer_date")}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
            rows={2}
            placeholder="Catatan transfer..."
            {...register("description")}
          />
        </div>

        {/* Sticky Action Buttons */}
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
            variant="transfer"
            size="sm"
            isLoading={isSubmitting}
            disabled={Boolean(isOverBudget || isSamePocket)}
            leftIcon={<ArrowRightLeft className="h-4 w-4" />}
            className="font-semibold shadow-md shadow-violet-500/20"
          >
            Lakukan Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
