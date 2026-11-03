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

function readFlag(value: unknown): number {
  return Number(value) === 1 ? 1 : 0;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PredictionInput;
    const aiEngineUrl = process.env.AI_ENGINEER_PREDICT_URL;
    if (!aiEngineUrl) {
      return NextResponse.json(
        { status: 'error', message: 'Layanan prediksi AI belum dikonfigurasi.' },
        { status: 503 }
      );
    }

    const income = readAmount(body.monthly_income, 'Pendapatan bulanan');
    if (income <= 0) throw new Error('Pendapatan bulanan harus lebih dari Rp 0.');
    const subscriptions = readAmount(body.subscription_services, 'Langganan');
    const lifestyle = readAmount(body.discretionary_spending, 'Hiburan dan gaya hidup');
    const essentials = readAmount(body.essential_spending, 'Kebutuhan pokok');
    const freelance = readFlag(body.income_type_Freelance);
    const mixed = readFlag(body.income_type_Mixed);

    const aiResponse = await fetch(aiEngineUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthly_income: income,
        savings_rate: readAmount(body.savings_rate, 'Rasio tabungan'),
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
        financial_stress_level: Math.min(2, readAmount(body.financial_stress_level, 'Tingkat stres finansial')),
        income_type_Freelance: freelance,
        income_type_Mixed: mixed,
        income_type_Salary: freelance || mixed ? 0 : 1,
        financial_scenario_inflation: 0,
        financial_scenario_normal: 1,
        financial_scenario_recession: 0,
      }),
      cache: 'no-store',
    });

    if (!aiResponse.ok) {
      throw new Error('Layanan AI Engineer gagal menghitung prediksi.');
    }

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
  } catch (error: unknown) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Permintaan prediksi tidak valid.' },
      { status: 502 }
    );
  }
}
