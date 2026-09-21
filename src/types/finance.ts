import { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Pocket = Database['public']['Tables']['pockets']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Transfer = Database['public']['Tables']['transfers']['Row'];

export interface PocketWithBalance extends Pocket {
  current_balance: number;
  total_income: number;
  total_expense: number;
  total_transfers_in: number;
  total_transfers_out: number;
  transaction_count: number;
  progress_percentage: number;
}

export type ActivityType = 'income' | 'expense' | 'transfer';

export interface UnifiedActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  amount: number;
  date: string;
  created_at: string;
  
  // Specific relations
  pocket_id?: string;
  pocket_name?: string;
  pocket_color?: string;
  pocket_icon?: string;
  
  category_id?: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  
  from_pocket_id?: string;
  from_pocket_name?: string;
  to_pocket_id?: string;
  to_pocket_name?: string;
}

export interface FinancialSummary {
  total_balance: number;
  total_income: number;
  total_expense: number;
  total_saved: number;
  net_savings_rate: number;
}

export type PeriodFilter = 
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'this_year'
  | 'all';

export interface DateRange {
  from: string;
  to: string;
}
