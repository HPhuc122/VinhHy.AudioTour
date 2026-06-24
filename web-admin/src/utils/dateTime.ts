const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function parseApiDateTime(value?: string | null): Date | null {
  if (!value) return null;
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const date = new Date(hasTimeZone ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatVietnamDate(value?: string | null): string {
  const date = parseApiDateTime(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric', month: 'short', day: '2-digit',
  }).format(date);
}

export function formatVietnamDateTime(value?: string | null): string {
  const date = parseApiDateTime(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    dateStyle: 'short', timeStyle: 'short',
  }).format(date);
}
