import { NextResponse } from 'next/server';

type PredictionInput = {
  monthly_income?: unknown;
  savings_rate?: unknown;
  budget_goal?: unknown;
  emergency_fund?: unknown;
  transaction_count?: unknown;
  financial_stress_level?: unknown;
  income_type_Freelance?: unknown;
  income_type_Mixed?: unknown;
  financial_scenario_inflation?: unknown;
  financial_scenario_normal?: unknown;
  financial_scenario_recession?: unknown;
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

/**
 * This endpoint intentionally calculates a transparent budget estimate from
 * the expense fields. The previous regression fallback mixed model units and
 * training-only features, producing estimates unrelated to the entered plan.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PredictionInput;
    const subscriptions = readAmount(body.subscription_services, 'Langganan');
    const lifestyle = readAmount(body.discretionary_spending, 'Hiburan dan gaya hidup');
    const essentials = readAmount(body.essential_spending, 'Kebutuhan pokok');

    const aiEngineUrl = process.env.AI_ENGINEER_PREDICT_URL;
    if (aiEngineUrl) {
      const income = readAmount(body.monthly_income, 'Pendapatan bulanan');
      const savings = readAmount(body.savings_rate, 'Rasio tabungan');
      const aiResponse = await fetch(aiEngineUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          monthly_income: income,
          savings_rate: income > 0 ? savings / income : 0,
          budget_goal: readAmount(body.budget_goal, 'Budget'),
          debt_to_income_ratio: 0,
          loan_payment: 0,
          investment_amount: 0,
          subscription_services: subscriptions,
          emergency_fund: readAmount(body.emergency_fund, 'Dana darurat'),
          transaction_count: readAmount(body.transaction_count, 'Jumlah transaksi'),
          discretionary_spending: lifestyle,
          essential_spending: essentials,
          rent_or_mortgage: 0,
          financial_stress_level: Number(body.financial_stress_level ?? 1),
          income_type_Freelance: Number(body.income_type_Freelance ?? 0),
          income_type_Mixed: Number(body.income_type_Mixed ?? 0),
          income_type_Salary: Number(body.income_type_Freelance ?? 0) || Number(body.income_type_Mixed ?? 0) ? 0 : 1,
          financial_scenario_inflation: 0,
          financial_scenario_normal: 1,
          financial_scenario_recession: 0,
        }),
        cache: 'no-store',
      });
      if (!aiResponse.ok) throw new Error('Layanan AI Engineer gagal menghitung prediksi.');
      const aiResult = await aiResponse.json();
      if (aiResult.status !== 'success' || !Number.isFinite(aiResult.data?.predicted_expense)) {
        throw new Error('Respons dari AI Engineer tidak valid.');
      }
      return NextResponse.json({
        ...aiResult,
        data: {
          ...aiResult.data,
          meta: { ...aiResult.data.meta, source: 'ai-engineer' },
        },
      });
    }

    const predictedExpense = essentials + subscriptions + lifestyle;

    return NextResponse.json({
      status: 'success',
      data: {
        predicted_expense: predictedExpense,
        meta: {
          model: 'Kalkulasi pos pengeluaran lokal (AI Engineer belum dikonfigurasi)',
          source: 'local-expense-estimator',
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
