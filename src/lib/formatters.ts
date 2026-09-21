import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Formats a number into Indonesian Rupiah format (e.g. Rp 1.500.000)
 */
export function formatRupiah(amount: number | null | undefined, withPrefix = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return withPrefix ? 'Rp 0' : '0';
  }
  
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID').format(rounded);
  
  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Parses user input string (which may have dots or Rp) into clean number
 */
export function parseRupiahInput(value: string): number {
  if (!value) return 0;
  // Remove non-numeric chars
  const clean = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats date into readable string with Indonesian locale
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  formatPattern: string = 'dd MMM yyyy'
): string {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return format(date, formatPattern, { locale: id });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats date in humanized relative terms (Hari ini, Kemarin, or dd MMMM yyyy)
 */
export function formatHumanDate(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (isToday(date)) return 'Hari ini';
    if (isYesterday(date)) return 'Kemarin';
    return format(date, 'dd MMMM yyyy', { locale: id });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats percentage nicely
 */
export function formatPercentage(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0%';
  const clamped = Math.max(0, val);
  return `${Math.min(100, Math.round(clamped))}%`;
}
