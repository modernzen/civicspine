import { differenceInDays, format, parseISO, isValid } from 'date-fns';

export function getDeadlineStatus(dateStr: string | null): 'overdue' | 'urgent' | 'upcoming' | 'ok' | 'none' {
  if (!dateStr) return 'none';
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'none';
  const days = differenceInDays(date, new Date());
  if (days < 0) return 'overdue';
  if (days <= 30) return 'urgent';
  if (days <= 90) return 'upcoming';
  return 'ok';
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  const date = parseISO(dateStr);
  if (!isValid(date)) return '--';
  return format(date, 'MMM d, yyyy');
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  if (!isValid(date)) return null;
  return differenceInDays(date, new Date());
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'District of Columbia',
];
