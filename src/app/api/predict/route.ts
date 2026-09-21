import { NextResponse } from 'next/server';

// Parameters from trained official Linear Regression (26 features, MAE Rp 596.85)
const INTERCEPT = 3101.8876060479843;

const COEFFICIENTS: Record<string, number> = {
  monthly_income: 143.5065320980968,
  savings_rate: -2.48501156260636,
  budget_goal: -86.80569382178464,
  debt_to_income_ratio: -11.969902761584681,
  loan_payment: 4.187727832126803,
  investment_amount: -28.921016710642736,
  subscription_services: 14.040927790794083,
  emergency_fund: 6.5073525392056935,
  transaction_count: 3.66272396897365,
  discretionary_spending: 1.6545077894890312,
  essential_spending: 10.503971222405678,
  rent_or_mortgage: 16.845402380710034,
  financial_stress_level: -10.347437396132916,
  savings_goal_met: -1133.1035333224813,
  income_type_Freelance: -1.280775530211093,
  income_type_Mixed: -27.475012257960262,
  income_type_Salary: 28.755787788171382,
  financial_scenario_inflation: -1.0667305302442878,
  financial_scenario_normal: -8.447493161736586,
  financial_scenario_recession: 9.514223691981025,
  year: -3.8907980954384986,
  month: -69.34210716514067,
  quarter: 65.69144824480281,
  is_month_end: -20.295767830878408,
  is_payday_month: 0.0,
  is_bonus_month: 77.00599278736793,
};

const SCALER: Record<string, { mean: number; scale: number }> = {
  monthly_income: { mean: 3986.3517673469387, scale: 988.2848118254867 },
  savings_rate: { mean: 0.22596326530612246, scale: 0.10205476059825111 },
  budget_goal: { mean: 2812.288379591837, scale: 487.2621866607496 },
  debt_to_income_ratio: { mean: 0.3514204081632653, scale: 0.1451108752441357 },
  loan_payment: { mean: 510.4200285714285, scale: 199.4171442208088 },
  investment_amount: { mean: 398.4631469387755, scale: 235.10144511178106 },
  subscription_services: { mean: 4.989795918367347, scale: 2.5646533678308647 },
  emergency_fund: { mean: 1003.0507102040817, scale: 485.63997021475643 },
  transaction_count: { mean: 59.7, scale: 23.020740426752532 },
  discretionary_spending: { mean: 499.2224040816326, scale: 198.35473336644492 },
  essential_spending: { mean: 2209.322897959184, scale: 603.3050491364045 },
  rent_or_mortgage: { mean: 1216.027, scale: 399.48280895118705 },
  year: { mean: 2020.469387755102, scale: 1.1267080605585518 },
  month: { mean: 6.448979591836735, scale: 3.4526607574023194 },
  quarter: { mean: 2.489795918367347, scale: 1.1088226699760102 },
};

function formatRupiahId(amount: number): string {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(amount));
}

function calculateLocalPrediction(body: any) {
  const isRupiahFull = Number(body.monthly_income || 0) >= 100_000;
  const currencyScale = isRupiahFull ? 1000.0 : 1.0;

  const inc = Number(body.monthly_income || 0) / currencyScale;
  const sr = Number(body.savings_rate || 0.2);
  const bg = Number(body.budget_goal || 0) / currencyScale;
  const dti = Number(body.debt_to_income_ratio || 0);
  const lp = Number(body.loan_payment || 0) / currencyScale;
  const inv = Number(body.investment_amount || 0) / currencyScale;
  const subs = Number(body.subscription_services || 0) / currencyScale;
  const ef = Number(body.emergency_fund || 0) / currencyScale;
  const tc = Number(body.transaction_count || 30);
  const disc = Number(body.discretionary_spending || 0) / currencyScale;
  const es = Number(body.essential_spending || 0) / currencyScale;
  const rent = Number(body.rent_or_mortgage || 0) / currencyScale;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.floor((month - 1) / 3) + 1;
  const is_month_end = now.getDate() >= 28 ? 1.0 : 0.0;
  const is_payday_month = 1.0;
  const is_bonus_month = month === 12 ? 1.0 : 0.0;

  const est_savings = sr * inc;
  const savings_goal_met =
    body.savings_goal_met !== undefined
      ? Number(body.savings_goal_met)
      : est_savings >= bg * 0.2
      ? 1.0
      : 0.0;

  // Scale continuous numeric columns
  const numericValues: Record<string, number> = {
    monthly_income: inc,
    savings_rate: sr,
    budget_goal: bg,
    debt_to_income_ratio: dti,
    loan_payment: lp,
    investment_amount: inv,
    subscription_services: subs,
    emergency_fund: ef,
    transaction_count: tc,
    discretionary_spending: disc,
    essential_spending: es,
    rent_or_mortgage: rent,
    year: year,
    month: month,
    quarter: quarter,
  };

  const scaledValues: Record<string, number> = {};
  for (const [key, val] of Object.entries(numericValues)) {
    const s = SCALER[key];
    scaledValues[key] = s ? (val - s.mean) / s.scale : val;
  }

  // Feature dictionary
  const features: Record<string, number> = {
    monthly_income: scaledValues.monthly_income,
    savings_rate: scaledValues.savings_rate,
    budget_goal: scaledValues.budget_goal,
    debt_to_income_ratio: scaledValues.debt_to_income_ratio,
    loan_payment: scaledValues.loan_payment,
    investment_amount: scaledValues.investment_amount,
    subscription_services: scaledValues.subscription_services,
    emergency_fund: scaledValues.emergency_fund,
    transaction_count: scaledValues.transaction_count,
    discretionary_spending: scaledValues.discretionary_spending,
    essential_spending: scaledValues.essential_spending,
    rent_or_mortgage: scaledValues.rent_or_mortgage,
    financial_stress_level: Number(body.financial_stress_level || 0),
    savings_goal_met: savings_goal_met,
    income_type_Freelance: Number(body.income_type_Freelance || 0),
    income_type_Mixed: Number(body.income_type_Mixed || 0),
    income_type_Salary: Number(body.income_type_Salary || 1),
    financial_scenario_inflation: Number(body.financial_scenario_inflation || 0),
    financial_scenario_normal: Number(body.financial_scenario_normal || 1),
    financial_scenario_recession: Number(body.financial_scenario_recession || 0),
    year: scaledValues.year,
    month: scaledValues.month,
    quarter: scaledValues.quarter,
    is_month_end: is_month_end,
    is_payday_month: is_payday_month,
    is_bonus_month: is_bonus_month,
  };

  let predRaw = INTERCEPT;
  for (const [key, weight] of Object.entries(COEFFICIENTS)) {
    predRaw += (features[key] || 0) * weight;
  }

  const userIncome = Number(body.monthly_income || 0);
  const predictedValue = Math.max(0, Math.round(predRaw * currencyScale));
  const expenseRatio =
    userIncome > 0 ? Number(((predictedValue / userIncome) * 100).toFixed(1)) : 0;
  const sisaSaldo = Math.round(userIncome - predictedValue);

  let kategori = 'Cukup Sehat';
  let saran =
    'Pengeluaran Anda masih dalam batas wajar. Coba tingkatkan alokasi tabungan dana darurat.';

  if (expenseRatio <= 50) {
    kategori = 'Sangat Sehat';
    saran =
      'Pengeluaran Anda terkontrol dengan sangat baik. Pertahankan rasio ini dan maksimalkan investasi!';
  } else if (expenseRatio <= 70) {
    kategori = 'Cukup Sehat';
    saran =
      'Pengeluaran Anda masih dalam batas wajar. Coba tingkatkan alokasi tabungan dana darurat.';
  } else if (expenseRatio <= 90) {
    kategori = 'Perlu Perhatian';
    saran =
      'Pengeluaran Anda mendekati batas pendapatan. Evaluasi pos pengeluaran hiburan dan langganan.';
  } else {
    kategori = 'Kritis';
    saran =
      'Pengeluaran Anda berpotensi melebihi pendapatan! Segera kurangi pengeluaran tidak penting.';
  }

  return {
    status: 'success',
    data: {
      predicted_expense: predictedValue,
      predicted_expense_formatted: formatRupiahId(predictedValue),
      monthly_income: userIncome,
      sisa_saldo: sisaSaldo,
      sisa_saldo_formatted: formatRupiahId(sisaSaldo),
      expense_ratio_persen: expenseRatio,
      kategori_kesehatan: kategori,
      saran: saran,
      meta: {
        model: 'Linear Regression (26 features)',
        mae: 596.85,
        r2: 0.0927,
        source: 'smart-finance-engine',
      },
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Try to call the external FastAPI backend if available
    const apiBaseUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:8000';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`${apiBaseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend not running locally or slow to start, fallback seamlessly
    }

    // 2. High-speed local mathematical fallback with exact model parameters
    const localResult = calculateLocalPrediction(body);
    return NextResponse.json(localResult);
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
