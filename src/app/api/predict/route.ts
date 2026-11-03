import { NextResponse } from 'next/server';

type PredictionInput = {
  subscription_services?: unknown;
  discretionary_spending?: unknown;
  essential_spending?: unknown;
};

function readAmount(value: unknown, name: string): number {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000_000) {
    throw new Error(`${name} harus berupa angka antara Rp 0 dan Rp 1.000.000.000.000.`);
  }
  return amount;
}

/** Return only the user's planned expense total; no model or risk buffer is added. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PredictionInput;
    const subscriptions = readAmount(body.subscription_services, 'Langganan');
    const lifestyle = readAmount(body.discretionary_spending, 'Hiburan dan gaya hidup');
    const essentials = readAmount(body.essential_spending, 'Kebutuhan pokok');
    const predictedExpense = essentials + subscriptions + lifestyle;

    return NextResponse.json({
      status: 'success',
      data: {
        predicted_expense: predictedExpense,
        meta: {
          model: 'Kalkulasi pos pengeluaran yang diinput pengguna',
          source: 'local-expense-estimator',
          base_planned_expense: predictedExpense,
          unplanned_risk_buffer: 0,
        },
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Permintaan prediksi tidak valid.' },
      { status: 400 }
    );
  }
}
