import { format } from 'date-fns';

export function parseDateSafe(dateField: any): Date | null {
  if (!dateField) return null;
  if (typeof dateField.toDate === 'function') {
    return dateField.toDate();
  }
  if (dateField instanceof Date) {
    if (!isNaN(dateField.getTime())) return dateField;
    return null;
  }
  if (dateField.seconds) {
    return new Date(dateField.seconds * 1000);
  }
  const d = new Date(dateField);
  if (!isNaN(d.getTime())) return d;
  return null;
}

export function formatDateSafe(dateField: any, formatStr: string, fallback = '-'): string {
  const d = parseDateSafe(dateField);
  if (!d) return fallback;
  return format(d, formatStr);
}
