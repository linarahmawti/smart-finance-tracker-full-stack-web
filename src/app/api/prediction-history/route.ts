import { NextResponse } from 'next/server';
import { requireFinanceUser } from '@/lib/server/finance';

export async function GET() {
  try {
    const { supabase, user } = await requireFinanceUser();
    const { data, error } = await supabase.from('prediction_history').select('*').eq('user_id', user.id).order('month', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ history: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal memuat riwayat prediksi' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireFinanceUser();
    const { month, predicted_expense, budget_goal } = await request.json();
    if (!/^\d{4}-\d{2}-01$/.test(month) || !Number.isFinite(predicted_expense) || predicted_expense < 0) {
      return NextResponse.json({ error: 'Data prediksi tidak valid' }, { status: 400 });
    }
    const { data, error } = await supabase.from('prediction_history').upsert({
      user_id: user.id, month, predicted_expense, budget_goal: Number(budget_goal) || 0,
    }, { onConflict: 'user_id,month' }).select().single();
    if (error) throw error;
    return NextResponse.json({ prediction: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal menyimpan prediksi' }, { status: 400 });
  }
}
