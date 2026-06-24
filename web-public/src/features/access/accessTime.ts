const timezonePattern = /(?:z|[+-]\d{2}:?\d{2})$/i;

export function parseAccessExpiresAt(expiresAt: string): number {
  const value = expiresAt.trim();
  if (!value) {
    return Number.NaN;
  }

  const normalized = timezonePattern.test(value) ? value : `${value}Z`;
  return new Date(normalized).getTime();
}

export function isAccessExpired(expiresAt: string): boolean {
  const expiresAtMs = parseAccessExpiresAt(expiresAt);
  return Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();
}
