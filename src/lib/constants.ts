export const APP_NAME = 'Smart Finance';
export const APP_DESCRIPTION = 'Personal Finance & Pocket Tracker';

export const POCKET_COLORS = [
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500', text: 'text-blue-500' },
  { name: 'Emerald', value: '#10B981', bg: 'bg-emerald-500', text: 'text-emerald-500' },
  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500', text: 'text-indigo-500' },
  { name: 'Violet', value: '#8B5CF6', bg: 'bg-violet-500', text: 'text-violet-500' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500', text: 'text-pink-500' },
  { name: 'Amber', value: '#F59E0B', bg: 'bg-amber-500', text: 'text-amber-500' },
  { name: 'Cyan', value: '#06B6D4', bg: 'bg-cyan-500', text: 'text-cyan-500' },
  { name: 'Rose', value: '#F43F5E', bg: 'bg-rose-500', text: 'text-rose-500' },
  { name: 'Slate', value: '#64748B', bg: 'bg-slate-500', text: 'text-slate-500' },
];

export const AVAILABLE_ICONS = [
  'Wallet',
  'PiggyBank',
  'Target',
  'Coins',
  'Utensils',
  'Car',
  'ShoppingBag',
  'Receipt',
  'Sparkles',
  'HeartPulse',
  'GraduationCap',
  'Briefcase',
  'Laptop',
  'Gift',
  'TrendingUp',
  'Plane',
  'Home',
  'Coffee',
  'Gamepad2',
  'ShieldCheck',
  'CreditCard',
  'Smartphone',
  'BookOpen',
  'Film',
  'Activity',
  'Tag',
];

export const PERIOD_OPTIONS = [
  { label: 'Hari Ini', value: 'today' },
  { label: 'Minggu Ini', value: 'this_week' },
  { label: 'Bulan Ini', value: 'this_month' },
  { label: 'Bulan Lalu', value: 'last_month' },
  { label: '3 Bulan Terakhir', value: 'last_3_months' },
  { label: 'Semua Waktu', value: 'all' },
] as const;
