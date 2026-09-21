import {
  parseISO,
  isToday,
  isThisWeek,
  isThisMonth,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';
import { PeriodFilter } from '@/types/finance';

/**
 * Checks if a given date string or Date object falls within a specified PeriodFilter interval.
 */
export function isInPeriod(
  dateInput: string | Date | null | undefined,
  filter: PeriodFilter
): boolean {
  if (!dateInput || filter === 'all') return true;

  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    const now = new Date();

    switch (filter) {
      case 'today':
        return isToday(date);
      case 'this_week':
        return isThisWeek(date, { weekStartsOn: 1 });
      case 'this_month':
        return isThisMonth(date);
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        return isWithinInterval(date, {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        });
      }
      case 'last_3_months': {
        const threeMonthsAgo = subMonths(now, 3);
        return isWithinInterval(date, {
          start: startOfMonth(threeMonthsAgo),
          end: endOfMonth(now),
        });
      }
      default:
        return true;
    }
  } catch {
    return true;
  }
}
